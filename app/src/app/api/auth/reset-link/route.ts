import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * Ultra-Stable Edge Reset Gateway
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email;

    // Direct environment access (Most compatible with Cloudflare)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rehdigital.com';

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400, headers: corsHeaders });
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Config Missing', 
        message: 'Firebase API Key not detected in Edge Runtime.' 
      }, { status: 500, headers: corsHeaders });
    }

    const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

    const response = await fetch(firebaseEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        continueUrl: `${baseUrl}/login`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || 'UNKNOWN';
      return NextResponse.json({ 
        error: msg === 'EMAIL_NOT_FOUND' ? 'User not found' : 'Auth failure',
        code: msg === 'EMAIL_NOT_FOUND' ? 'USER_NOT_FOUND' : 'AUTH_ERROR'
      }, { status: response.status === 404 || msg === 'EMAIL_NOT_FOUND' ? 404 : 400, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: 'Gateway Error', details: error.message }, { status: 500, headers: corsHeaders });
  }
}
