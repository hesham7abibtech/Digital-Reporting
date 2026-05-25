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
import { firebaseRest } from '@/lib/firebase-rest';
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
  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const res = NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
      return handleCors(res);
    }

    const token = authHeader.split('Bearer ')[1];
    const uid = await verifyTokenLocally(token);

    if (!uid) {
      const res = NextResponse.json({ error: 'Unauthorized: Invalid credentials' }, { status: 401 });
      return handleCors(res);
    }

    // 2. Fetch user status from Firestore REST to verify approval, verification, and active status
    let userData = await firebaseRest.firestoreGet(`users/${uid}`);
    if (!userData || !userData.fields) {
      const isLocalhost = req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1';
      if (process.env.NODE_ENV === 'development' || isLocalhost) {
        console.log(`[API Chat Debug]: User profile not found in Firestore for UID ${uid}. Falling back to default approved user in development.`);
        userData = {
          fields: {
            isApproved: { booleanValue: true },
            isVerified: { booleanValue: true },
            status: { stringValue: 'ACTIVE' }
          }
        };
      } else {
        const res = NextResponse.json({ error: 'Unauthorized: User profile not found' }, { status: 401 });
        return handleCors(res);
      }
    }

    const fields = userData.fields;
    const isApproved = fields.isApproved?.booleanValue === true || fields.isAdmin?.booleanValue === true;
    const isVerified = fields.isVerified?.booleanValue === true;
    const isSuspended = fields.status?.stringValue === 'SUSPENDED';

    if (!isApproved || !isVerified || isSuspended) {
      const res = NextResponse.json(
        { error: 'Forbidden: Account requires manual approval, verification, or is suspended' },
        { status: 403 }
      );
      return handleCors(res);
    }

    // 3. Parse and validate the payload
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      const res = NextResponse.json({ error: 'Bad Request: Missing messages array' }, { status: 400 });
      return handleCors(res);
    }

    // 4. Retrieve Cloudflare request context to read bindings/env variables
    let cloudflareKey: string | undefined;
    let cloudflareBaseURL: string | undefined;
    
    // Log Edge Colo location to help debug routing
    const cfColo = req.headers.get('cf-ray')?.split('-')?.[1] || 'UNKNOWN';
    console.log(`[API Chat Info]: Executing in Cloudflare Colo: ${cfColo}`);

    try {
      const ctx = getRequestContext();
      cloudflareKey = ctx.env?.OPENAI_API_KEY as string | undefined;
      cloudflareBaseURL = ctx.env?.OPENAI_BASE_URL as string | undefined;
    } catch (e) {
      // Outside Cloudflare pages runtime (local development)
    }

    const globalKey = (globalThis as any).OPENAI_API_KEY as string | undefined;
    const processKey = process.env.OPENAI_API_KEY;
    const activeKey = cloudflareKey || globalKey || processKey;

    const globalBaseURL = (globalThis as any).OPENAI_BASE_URL as string | undefined;
    const processBaseURL = process.env.OPENAI_BASE_URL;
    const activeBaseURL = cloudflareBaseURL || globalBaseURL || processBaseURL;

    console.log('[API Chat Environment Debug]:', {
      hasCloudflareKey: !!cloudflareKey,
      hasGlobalKey: !!globalKey,
      hasProcessKey: !!processKey,
      hasCloudflareBaseURL: !!cloudflareBaseURL,
      hasGlobalBaseURL: !!globalBaseURL,
      hasProcessBaseURL: !!processBaseURL,
      resolvedBaseURL: activeBaseURL || 'default'
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

    const executionPromise = runAgent(messages, activeKey, activeBaseURL);
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
      errorMessage = 'Error: The AI provider has blocked access from this region. Please configure an outbound proxy (OPENAI_BASE_URL) in Cloudflare Pages.';
    } else if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
      status = 429;
      errorMessage = 'Error: Rate limit exceeded. Please try again in a few moments.';
    }

    const res = NextResponse.json({ error: errorMessage }, { status });
    return handleCors(res);
  }
}
