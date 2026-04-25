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

    // In Cloudflare Pages, environment variables are injected as globals or process.env.
    // We check all possible locations to ensure local and production stability.
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
                   (globalThis as any).NEXT_PUBLIC_FIREBASE_API_KEY || 
                   (globalThis as any).process?.env?.NEXT_PUBLIC_FIREBASE_API_KEY;

    console.log(`[AUTH_RESET] Request initiated for email: ${email}`);
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      console.error('[AUTH_RESET] Configuration Error: API Key not found.');
      return new Response(JSON.stringify({ 
        error: 'Configuration Error', 
        message: 'API Key not found in Edge bindings. Please verify the Cloudflare Dashboard and .env.local.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Firebase Auth REST API
    // Note: We omit continueUrl for local testing to avoid 'UNAUTHORIZED_DOMAIN' errors.
    // Firebase will use the default template settings in the console.
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        // continueUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rehdigital.com'}/login`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || 'ERROR';
      console.error(`[AUTH_RESET] Firebase Error: ${msg}`, data);
      return new Response(JSON.stringify({ 
        error: msg === 'EMAIL_NOT_FOUND' ? 'User not found' : 'Auth failure',
        code: msg === 'EMAIL_NOT_FOUND' ? 'USER_NOT_FOUND' : 'AUTH_ERROR',
        details: msg
      }), {
        status: msg === 'EMAIL_NOT_FOUND' ? 404 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[AUTH_RESET] Reset link successfully dispatched via Firebase for: ${email}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[AUTH_RESET] Worker Exception:', err);
    return new Response(JSON.stringify({ error: 'Worker Error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
