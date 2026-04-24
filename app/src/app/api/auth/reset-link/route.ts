export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({}));

    // In Cloudflare Pages, environment variables are injected as globals.
    // We check every possible location with zero dependencies.
    const apiKey = (globalThis as any).NEXT_PUBLIC_FIREBASE_API_KEY || 
                   (globalThis as any).process?.env?.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Configuration Error', 
        message: 'API Key not found in Edge bindings. Please verify the Cloudflare Dashboard.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Firebase Auth REST API
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        continueUrl: 'https://www.rehdigital.com/login'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || 'ERROR';
      return new Response(JSON.stringify({ 
        error: msg === 'EMAIL_NOT_FOUND' ? 'User not found' : 'Auth failure',
        code: msg === 'EMAIL_NOT_FOUND' ? 'USER_NOT_FOUND' : 'AUTH_ERROR'
      }), {
        status: msg === 'EMAIL_NOT_FOUND' ? 404 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Worker Error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
