import { NextRequest, NextResponse } from 'next/server';
import { authEdge } from '@/lib/firebase-edge';

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest, context: any) {
  try {
    const { email } = await req.json();

    /**
     * EXTRACT ENVIRONMENT BINDINGS
     * Cloudflare Pages (next-on-pages) passes variables in different ways.
     * We check all possible locations to ensure 100% compatibility.
     */
    const env = 
      context?.env || 
      (req as any).env || 
      (globalThis as any).process?.env || 
      (globalThis as any).env || 
      {};

    const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    // Diagnostic tracking
    const debugStatus = apiKey ? 'FOUND' : 'MISSING';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { 
        status: 400, 
        headers: { ...corsHeaders, 'X-Debug-Env': debugStatus } 
      });
    }

    if (!apiKey) {
      console.error('[RESET_LINK] CRITICAL: API Key not found in context.env or process.env');
      return NextResponse.json({ 
        error: 'Infrastructure Error', 
        message: 'Missing Firebase API Configuration in Cloudflare Dashboard.' 
      }, { 
        status: 500, 
        headers: { ...corsHeaders, 'X-Debug-Env': 'MISSING' } 
      });
    }

    try {
      await authEdge.getPasswordResetLink(email, env);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Security update link dispatched to your infrastructure.' 
      }, { 
        status: 200, 
        headers: { ...corsHeaders, 'X-Debug-Env': 'FOUND' } 
      });
      
    } catch (error: any) {
      if (error.message.includes('EMAIL_NOT_FOUND')) {
        return NextResponse.json({ 
          error: 'User account not found', 
          code: 'USER_NOT_FOUND' 
        }, { 
          status: 404, 
          headers: { ...corsHeaders, 'X-Debug-Env': 'FOUND' } 
        });
      }
      throw error;
    }

  } catch (error: any) {
    console.error('[RESET_LINK_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { 
        status: 500, 
        headers: { ...corsHeaders } 
      }
    );
  }
}
