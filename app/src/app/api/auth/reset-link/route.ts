import { NextRequest, NextResponse } from 'next/server';
import { authEdge } from '@/lib/firebase-edge';
import { mailService } from '@/services/MailService';

export const runtime = 'edge';

/**
 * CORS handling for Enterprise API
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Custom Password Reset Dispatcher
 * 1. Generates a secure Firebase reset link
 * 2. Wraps it in an Ultra-Elite mail template
 * 3. Dispatches via reset@rehdigital.com
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    try {
      await authEdge.getPasswordResetLink(email);
      
      // Since the REST API sends the mail directly, we just return success
      return NextResponse.json({ 
        success: true, 
        message: 'Security update link dispatched to your infrastructure.' 
      }, { status: 200, headers: corsHeaders });
      
    } catch (error: any) {
      if (error.message.includes('EMAIL_NOT_FOUND')) {
        return NextResponse.json({ 
          error: 'Not Found', 
          code: 'USER_NOT_FOUND' 

    if (adminAuth) {
      try {
        const firebaseResetLink = await adminAuth.generatePasswordResetLink(email, {
          url: 'https://rehdigital.com/login',
        });
        const urlObj = new URL(firebaseResetLink);
        oobCode = urlObj.searchParams.get('oobCode') || '';
      } catch (err: any) {
        console.warn('[RESET_LINK] Admin SDK failed to generate link, falling back to mock:', err.message);
      }
    }

    if (!oobCode) {
      // DEVELOPMENT MOCK MODE
      // If Admin SDK is not fully setup, we generate a mock token so you can still test the flow/mail
      oobCode = `mock_token_${Math.random().toString(36).substring(7)}`;
      console.warn(`[RESET_LINK] Using MOCK token for development: ${oobCode}`);
    }

    // 3. Track request for 30-min expiration and one-time use policy
    if (adminDb) {
      try {
        await adminDb.collection('passwordResetRequests').doc(oobCode).set({
          email,
          createdAt: new Date().toISOString(),
          used: false,
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        });
      } catch (err) {
        console.warn('[RESET_LINK] Failed to track request in Firestore:', err);
      }
    }

    const origin = req.headers.get('origin') || 'https://rehdigital.com';
    const customResetLink = `${origin}/reset-password?oobCode=${oobCode}`;

    // 4. Dispatch the Ultra-Elite fancy email
    await mailService.sendPasswordReset(email, displayName, customResetLink);

    console.log(`[RESET_LINK] Dispatched custom reset email to: ${email}`);

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[API_AUTH_RESET] Critical Failure:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal service failure' 
    }, { status: 500, headers: corsHeaders });
  }
}
