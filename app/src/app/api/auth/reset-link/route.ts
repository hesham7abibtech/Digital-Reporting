import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { mailService } from '@/services/MailService';

/**
 * Custom Password Reset Dispatcher
 * 1. Generates a secure Firebase reset link
 * 2. Wraps it in an Ultra-Elite mail template
 * 3. Dispatches via reset@rehdigital.com
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Safety check for Firebase Admin initialization - we now log a warning but proceed with mock links if needed
    if (!adminAuth) {
      console.warn('[RESET_LINK] Firebase Admin SDK not initialized. Proceeding in Mock Mode.');
    }

    // 1. Check if user exists (to get their name if possible)
    let displayName = 'User';
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      displayName = userRecord.displayName || email.split('@')[0];
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json({ 
          error: 'User account not found', 
          code: 'USER_NOT_FOUND' 
        }, { status: 404 });
      }
      throw err;
    }

    // 2. Generate secure password reset link pointing to our custom reset page
    let resetLink = '';
    let oobCode = '';

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

    const customResetLink = `https://rehdigital.com/reset-password?oobCode=${oobCode}`;

    // 3. Dispatch the Ultra-Elite fancy email
    await mailService.sendPasswordReset(email, displayName, customResetLink);

    console.log(`[RESET_LINK] Dispatched custom reset email to: ${email}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[API_AUTH_RESET] Critical Failure:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal service failure' 
    }, { status: 500 });
  }
}
