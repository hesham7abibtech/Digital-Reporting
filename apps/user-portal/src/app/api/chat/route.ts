if (typeof process !== 'undefined') {
  const p = process as any;
  if (!p['once']) {
    p['once'] = () => {};
  }
  if (!p['on']) {
    p['on'] = () => {};
  }
}

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent extends Event {
    detail: any;
    constructor(message: string, transfer: any = {}) {
      super(message, transfer);
      this.detail = transfer?.detail;
    }
  } as any;
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, AuthError } from '@/lib/adminAuth';
import { runAgent } from '@/services/ai-agent';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// CORS response helper
function handleCors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

async function verifyTokenLocally(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error('Token does not contain payload');
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const jsonPayload = atob(padded);
    const payload = JSON.parse(jsonPayload);
    return payload.user_id || payload.sub;
  } catch (e) {
    throw new Error('Invalid token format');
  }
}

// OPTIONS preflight request handler
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return handleCors(res);
}

export async function POST(req: NextRequest) {
  let cfColo = 'UNKNOWN';
  let activeBaseURL: string | undefined;
  try {
    // 1. Authentication + profile (Supabase)
    let profile: Record<string, any>;
    try {
      const vu = await verifyUser(req);
      profile = vu.profile;
    } catch (e: any) {
      const res = NextResponse.json({ error: e instanceof AuthError ? e.message : 'Unauthorized' }, { status: e?.status || 401 });
      return handleCors(res);
    }

    // 2. Verify approval, verification, and active status
    const isApproved = profile.is_approved === true || profile.is_admin === true;
    const isVerified = profile.is_verified === true;
    const isSuspended = profile.status === 'SUSPENDED';

    if (!isApproved || !isVerified || isSuspended) {
      const res = NextResponse.json(
        { error: 'Forbidden: Account requires manual approval, verification, or is suspended' },
        { status: 403 }
      );
      return handleCors(res);
    }

    // 3. Parse and validate the payload
    const { messages, userName } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      const res = NextResponse.json({ error: 'Bad Request: Missing messages array' }, { status: 400 });
      return handleCors(res);
    }

    const finalUserName = userName || profile?.name || 'User';

    // 4. Retrieve Cloudflare request context to read bindings/env variables
    let cloudflareKey: string | undefined;
    let cloudflareBaseURL: string | undefined;
    let cloudflareAigToken: string | undefined;
    
    // Log Edge Colo location to help debug routing
    cfColo = req.headers.get('cf-ray')?.split('-')?.[1] || 'UNKNOWN';
    console.log(`[API Chat Info]: Executing in Cloudflare Colo: ${cfColo}`);

    try {
      const ctx = getRequestContext();
      cloudflareKey = ctx.env?.OPENAI_API_KEY as string | undefined;
      cloudflareBaseURL = ctx.env?.OPENAI_BASE_URL as string | undefined;
      cloudflareAigToken = ctx.env?.CLOUDFLARE_AIG_TOKEN as string | undefined;
    } catch (e) {
      // Outside Cloudflare pages runtime (local development)
    }

    const globalKey = (globalThis as any).OPENAI_API_KEY as string | undefined;
    const processKey = process.env.OPENAI_API_KEY;
    const activeKey = cloudflareKey || globalKey || processKey;

    const globalBaseURL = (globalThis as any).OPENAI_BASE_URL as string | undefined;
    const processBaseURL = process.env.OPENAI_BASE_URL;
    activeBaseURL = cloudflareBaseURL || globalBaseURL || processBaseURL;

    const globalAigToken = (globalThis as any).CLOUDFLARE_AIG_TOKEN as string | undefined;
    const processAigToken = process.env.CLOUDFLARE_AIG_TOKEN;
    const activeAigToken = cloudflareAigToken || globalAigToken || processAigToken;

    if (!activeBaseURL) {
      console.warn('[API Chat WARNING]: OPENAI_BASE_URL is NOT configured. Requests will go directly to api.openai.com and may be blocked in certain regions. Set up a Cloudflare AI Gateway and add OPENAI_BASE_URL to your Pages environment variables for worldwide access.');
    }

    console.log('[API Chat Environment Debug]:', {
      hasCloudflareKey: !!cloudflareKey,
      hasGlobalKey: !!globalKey,
      hasProcessKey: !!processKey,
      hasCloudflareBaseURL: !!cloudflareBaseURL,
      hasGlobalBaseURL: !!globalBaseURL,
      hasProcessBaseURL: !!processBaseURL,
      hasAigToken: !!activeAigToken,
      resolvedBaseURL: activeBaseURL ? '(configured)' : 'NONE - direct to OpenAI',
      colo: cfColo
    });

    if (!activeKey) {
      const res = NextResponse.json({ error: 'Internal Server Error: OpenAI API Key not configured' }, { status: 500 });
      return handleCors(res);
    }

    // 5. Execute the agent turn with Timeout Handling
    // Wrap execution with a 25-second timeout to prevent Pages Function from hanging
    const timeoutDuration = 25000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI assistant response timed out. Please try again.')), timeoutDuration)
    );

    const executionPromise = runAgent(messages, activeKey, activeBaseURL, finalUserName, activeAigToken);
    const { outputText, updatedHistory } = await Promise.race([executionPromise, timeoutPromise]);

    const res = NextResponse.json({
      outputText,
      updatedHistory
    });
    return handleCors(res);

  } catch (err: any) {
    console.error('[API Chat Error]:', err);
    
    // Map common OpenAI / network error codes to user-friendly messages
    let status = 500;
    let errorMessage = err.message || 'AI request execution failed';
    
    if (err.message?.includes('timed out')) {
      status = 504; // Gateway Timeout
    } else if (err.status === 403 || err.message?.includes('403') || err.message?.includes('Country, region, or territory not supported')) {
      status = 403;
      // Log detailed info for admins, but show clean message to end users
      console.error(`[API Chat 403 Detail]: Region block detected. Colo: ${cfColo}. Base URL configured: ${!!activeBaseURL}. Raw error: ${err.message}`);
      errorMessage = 'The AI assistant is temporarily unavailable in your region. Our team has been notified and is working on it. Please try again shortly.';
    } else if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
      status = 429;
      errorMessage = 'Error: Rate limit exceeded. Please try again in a few moments.';
    }

    const res = NextResponse.json({ error: errorMessage }, { status });
    return handleCors(res);
  }
}
