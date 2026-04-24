import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Enterprise CORS Configuration
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Password Reset Pipeline (Edge-Native)
 * Uses Firebase REST API directly for 100% Cloudflare compatibility.
 */
export async function POST(req: NextRequest, context: any) {
  try {
    const { email } = await req.json();

    // 1. Resolve Environment Bindings (Support for context.env, global, and process)
    const env = context?.env || (req as any).env || (globalThis as any).env || process.env;
    const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://www.rehdigital.com';

    // Diagnostic Check
    const debugSource = apiKey ? 'RESOLVED' : 'MISSING';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { 
        status: 400, 
        headers: { ...corsHeaders, 'X-Debug-Config': debugSource } 
      });
    }

    if (!apiKey) {
      console.error('[RESET_API] Critical Error: FIREBASE_API_KEY not found in Edge bindings.');
      return NextResponse.json({ 
        error: 'Infrastructure Configuration Error', 
        message: 'The authentication gateway is missing its API binding. Verify Cloudflare Dashboard variables.'
      }, { 
        status: 500, 
        headers: { ...corsHeaders, 'X-Debug-Config': 'MISSING' } 
      });
    }

    // 2. Dispatch Reset Link via Firebase REST API
    // Endpoint docs: https://firebase.google.com/docs/reference/rest/auth#section-send-password-reset-email
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

    // 3. Handle Firebase-Specific Errors
    if (!response.ok) {
      console.error('[FIREBASE_REST_FAILURE]', data);
      
      const errorCode = data.error?.message || 'UNKNOWN_ERROR';
      
      if (errorCode === 'EMAIL_NOT_FOUND') {
        return NextResponse.json({ 
          error: 'User account not found', 
          code: 'USER_NOT_FOUND' 
        }, { status: 404, headers: corsHeaders });
      }

      if (errorCode === 'INVALID_EMAIL') {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400, headers: corsHeaders });
      }

      throw new Error(errorCode);
    }

    // 4. Success Response
    return NextResponse.json({ 
      success: true, 
      message: 'Security update link dispatched to your infrastructure.' 
    }, { 
      status: 200, 
      headers: { ...corsHeaders, 'X-Debug-Config': 'RESOLVED' } 
    });

  } catch (error: any) {
    console.error('[EDGE_AUTH_GATEWAY_CRASH]', error);
    return NextResponse.json(
      { 
        error: 'Edge Gateway Failure', 
        message: error.message 
      },
      { 
        status: 500, 
        headers: { ...corsHeaders } 
      }
    );
  }
}
