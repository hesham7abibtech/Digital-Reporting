import { mailService } from '@/services/MailService';

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
    const { type, to, payload } = await request.json();

    if (!to || !type) {
      return new Response(JSON.stringify({ success: false, message: 'Missing recipient or type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result;
    switch (type) {
      case 'REGISTRATION_PENDING':
        result = await mailService.dispatch({
          to,
          subject: 'REH Digital — Account Initialized',
          type: 'ANNOUNCEMENT',
          payload: { 
            name: payload.name, 
            title: 'Account Registration Successful',
            body: 'Your operative profile has been created and is awaiting clearance.' 
          }
        });
        break;
      case 'ADMIN_NOTIFICATION':
        result = await mailService.notifyAdminOfNewUser(payload.name, payload.email, to);
        break;
      case 'ACCOUNT_APPROVED':
        result = await mailService.dispatch({
          to,
          subject: 'REH Digital — Access Granted',
          type: 'ACCOUNT_APPROVED',
          payload: { name: payload.name }
        });
        break;
      case 'PASSWORD_RESET':
        result = await mailService.sendPasswordReset(to, payload.name || 'Operative');
        break;
      case 'CUSTOM_NOTIFICATION':
      case 'CUSTOM':
        result = await mailService.dispatch({
          to,
          subject: payload.title || 'REH Digital Notification',
          type: 'ANNOUNCEMENT',
          payload: { 
            title: payload.title, 
            body: payload.body || payload.content,
            category: payload.category 
          }
        });
        break;
      default:
        return new Response(JSON.stringify({ success: false, message: 'Invalid email type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[MAIL_API_ERROR]', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
