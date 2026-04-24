import { NextRequest, NextResponse } from 'next/server';
import { mailService } from '@/services/MailService';

/**
 * Enterprise Mail Gateway API
 * 
 * Handles internal dispatch requests for notifications.
 * Protected by environment-level security.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, payload } = body;

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
        result = await mailService.sendCustomNotification(to, {
          title: payload.title,
          body: payload.body,
          category: payload.category
        });
        break;

      default:
        return NextResponse.json({ error: `Invalid mail type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ ...result });

  } catch (error: any) {
    console.error('[API_MAIL] Handler error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
