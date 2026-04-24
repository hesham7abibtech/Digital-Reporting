export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Release ID to verify deployment sync
const RELEASE_ID = 'STABLE_V2_REST';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    /**
     * CLOUDFLARE BINDING RESOLUTION
     * In Cloudflare Pages, bindings are available directly in the global scope.
     * We attempt to resolve them from all possible runtime containers.
     */
    const apiKey = (globalThis as any).NEXT_PUBLIC_FIREBASE_API_KEY || 
                   (globalThis as any).process?.env?.NEXT_PUBLIC_FIREBASE_API_KEY ||
                   'MISSING';

    const baseUrl = (globalThis as any).NEXT_PUBLIC_BASE_URL || 
                    (globalThis as any).process?.env?.NEXT_PUBLIC_BASE_URL ||
                    'https://www.rehdigital.com';

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Release-ID': RELEASE_ID }
      });
    }

    if (apiKey === 'MISSING') {
      return new Response(JSON.stringify({ 
        error: 'Infrastructure Error', 
        message: 'Firebase API Key binding was not found in the Edge global scope.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Release-ID': RELEASE_ID }
      });
    }

    const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;

    const res = await fetch(firebaseEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        continueUrl: `${baseUrl}/login`
      })
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error?.message || 'AUTH_GATEWAY_ERROR';
      return new Response(JSON.stringify({ 
        error: errorMsg === 'EMAIL_NOT_FOUND' ? 'User account not found' : 'Security gateway error',
        code: errorMsg === 'EMAIL_NOT_FOUND' ? 'USER_NOT_FOUND' : 'GATEWAY_ERROR'
      }), {
        status: errorMsg === 'EMAIL_NOT_FOUND' ? 404 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Release-ID': RELEASE_ID }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Release-ID': RELEASE_ID }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Critical Gateway Failure', detail: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Release-ID': RELEASE_ID }
    });
  }
}
