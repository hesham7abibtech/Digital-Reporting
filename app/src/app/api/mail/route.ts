import { NextRequest, NextResponse } from 'next/server';
import { mailService } from '@/services/MailService';

/**
 * Enterprise Mail Gateway API
 * Accepts: to, cc, bcc, type, payload
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, cc, bcc, payload } = body;

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing required fields (type, to)' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'REGISTRATION_PENDING':
        result = await mailService.sendRegistrationPending(to, payload.name);
        break;

      case 'ADMIN_NOTIFICATION':
        result = await mailService.sendAdminRegistrationAlert(to, {
          name: payload.name,
          email: payload.email,
          department: payload.department,
        });
        break;

      case 'ACCOUNT_APPROVED':
        result = await mailService.sendAccountApproved(to, payload.name);
        break;

      case 'CUSTOM':
      case 'CUSTOM_NOTIFICATION':
        result = await mailService.sendCustomNotification(
          to,
          { title: payload.title, body: payload.body, category: payload.category },
          { cc, bcc }
        );
        break;

      case 'PASSWORD_RESET':
        result = await mailService.sendPasswordReset(to, payload.name, payload.resetLink);
        break;

      default:
        return NextResponse.json({ error: `Invalid mail type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ ...result });

  } catch (error: any) {
    console.error('[API_MAIL] Handler error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
