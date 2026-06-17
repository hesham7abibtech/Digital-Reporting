import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isDomainAllowed, accountExists } from '@/lib/authPolicy';
import { issueOtp } from '@/lib/otp';

export const runtime = 'edge';

/**
 * Self-service one-time password (the "First sign-in since our security upgrade"
 * / forgot-password path). Validates the domain (admin-controlled) and that the
 * account exists, then emails the user a one-time password via the AWS relay
 * (NOT Supabase email → no rate limit). The OTP is never returned to the browser;
 * signing in with it forces a new password (`must_set_password`).
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({} as any));
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
    const sb = getSupabaseAdmin();

    // Existing accounts may request an OTP regardless of the domain allow-list —
    // the gate only restricts unknown/unprovisioned emails. So check existence
    // first; only enforce the domain rule when no account exists.
    const acct = await accountExists(sb, email);
    if (!acct.exists || !acct.id) {
      if (!(await isDomainAllowed(sb, email))) {
        return Response.json({ error: 'This email domain is not authorized.' }, { status: 403 });
      }
      return Response.json({ error: 'This account does not exist.', code: 'NOT_FOUND' }, { status: 404 });
    }

    // requireEmail: don't change the password unless the OTP email actually sent.
    const r = await issueOtp(sb, { id: acct.id, email, name: acct.name }, true, { requireEmail: true });
    if (!r.ok) {
      return Response.json({ error: r.error || 'Could not send the one-time password.', emailError: r.emailError }, { status: 502 });
    }
    return Response.json({ success: true, emailed: r.emailed, emailError: r.emailError });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Request failed' }, { status: 500 });
  }
}
