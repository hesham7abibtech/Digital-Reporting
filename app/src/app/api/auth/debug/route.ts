export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  const smtp = process.env.SMTP_PASS || process.env.SMTP_RESET_PASS;
  
  let sa_status = 'MISSING';
  let sa_error = null;
  let project_id = 'MISSING';
  
  if (sa) {
    try {
      const parsed = JSON.parse(sa);
      sa_status = 'VALID_JSON';
      project_id = parsed.project_id || 'UNKNOWN';
    } catch (e: any) {
      sa_status = 'INVALID_JSON';
      sa_error = e.message;
    }
  }

  let mail_engine_status = 'WAITING';
  try {
    // Attempting to test the import resolution
    // @ts-ignore
    const mod = await import('@/services/MailService');
    mail_engine_status = mod.mailService ? 'READY' : 'MODULE_LOADED_BUT_EMPTY';
  } catch (e: any) {
    mail_engine_status = 'IMPORT_ERROR: ' + e.message;
  }

  return new Response(JSON.stringify({
    status: 'BOOT_SUCCESS',
    diagnostics: {
      FIREBASE_AUTH: { status: sa_status, project_id, error: sa_error },
      SMTP_SYSTEM: { status: smtp ? 'CONFIGURED' : 'MISSING' },
      MAIL_ENGINE: { status: mail_engine_status }
    },
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
