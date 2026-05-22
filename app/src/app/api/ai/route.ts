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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const uid = await verifyTokenLocally(token);

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid credentials' }, { status: 401 });
    }

    // Fetch user status from Firestore REST to verify approval, verification and active status
    let userData = await firebaseRest.firestoreGet(`users/${uid}`);
    if (!userData || !userData.fields) {
      const isLocalhost = req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1';
      if (process.env.NODE_ENV === 'development' || isLocalhost) {
        console.log(`[API AI Debug]: User profile not found in Firestore for UID ${uid}. Falling back to default approved user in development.`);
        userData = {
          fields: {
            isApproved: { booleanValue: true },
            isVerified: { booleanValue: true },
            status: { stringValue: 'ACTIVE' }
          }
        };
      } else {
        return NextResponse.json({ error: 'Unauthorized: User profile not found' }, { status: 401 });
      }
    }

    const fields = userData.fields;
    const isApproved = fields.isApproved?.booleanValue === true || fields.isAdmin?.booleanValue === true;
    const isVerified = fields.isVerified?.booleanValue === true;
    const isSuspended = fields.status?.stringValue === 'SUSPENDED';

    if (!isApproved || !isVerified || isSuspended) {
      return NextResponse.json(
        { error: 'Forbidden: Account requires manual approval, verification, or is suspended' },
        { status: 403 }
      );
    }

    // Parse the payload messages
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Bad Request: Missing messages array' }, { status: 400 });
    }

    // Retrieve Cloudflare request context to read bindings/env variables
    let cloudflareKey: string | undefined;
    try {
      const ctx = getRequestContext();
      cloudflareKey = ctx.env?.OPENAI_API_KEY as string | undefined;
    } catch (e) {
      // Outside Cloudflare pages runtime (local development)
    }

    const globalKey = (globalThis as any).OPENAI_API_KEY as string | undefined;
    const processKey = process.env.OPENAI_API_KEY;

    console.log('[API AI Environment Debug]:', {
      hasCloudflareKey: !!cloudflareKey,
      hasGlobalKey: !!globalKey,
      hasProcessKey: !!processKey
    });

    const activeKey = cloudflareKey || globalKey || processKey;

    // Execute the agent turn
    const { outputText, updatedHistory } = await runAgent(messages, activeKey);

    return NextResponse.json({
      outputText,
      updatedHistory
    });

  } catch (err: any) {
    console.error('[API AI Error]:', err);
    return NextResponse.json(
      { error: err.message || 'AI request execution failed' },
      { status: 500 }
    );
  }
}
