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

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders });
    }

    try {
      await authEdge.getPasswordResetLink(email);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Security update link dispatched to your infrastructure.' 
      }, { status: 200, headers: corsHeaders });
      
    } catch (error: any) {
      if (error.message.includes('EMAIL_NOT_FOUND')) {
        return NextResponse.json({ 
          error: 'User account not found', 
          code: 'USER_NOT_FOUND' 
        }, { status: 404, headers: corsHeaders });
      }
      throw error;
    }

  } catch (error: any) {
    console.error('[RESET_LINK_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
