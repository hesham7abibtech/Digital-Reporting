export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;

    // Use a robust fallback for the API Key
    // On Cloudflare Pages, globalThis.process.env is sometimes more reliable
    const env = (globalThis as any).process?.env || {};
    const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || 'MISSING';

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (apiKey === 'MISSING') {
       return new Response(JSON.stringify({ error: 'Infrastructure Error', detail: 'API Key Binding Missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

    const res = await fetch(firebaseEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        continueUrl: 'https://www.rehdigital.com/login'
      })
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error?.message || 'UNKNOWN';
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
    return new Response(JSON.stringify({ error: 'Gateway Crash', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
