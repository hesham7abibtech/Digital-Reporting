import { NextRequest } from 'next/server';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mailService } from '@/services/MailService';
import { SITE_URL } from '@/lib/siteConfig';

export const runtime = 'edge';

/**
 * Admin-issued one-time passwords.
 *  - Generates a strong OTP, sets it as the user's password, and flags
 *    `must_set_password` so the user is forced to choose a new password on first
 *    sign-in (no email-reset link needed → avoids the GoTrue email rate limit).
 *  - Optionally emails the OTP to the user via the AWS relay.
 *  - `{ uid }` for one user, or `{ all: true }` for every user with an email.
 * Returns each OTP so the admin can also share it manually if mail is unavailable.
 */
function genOtp(): string {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789', S = '!@#$%';
  const all = U + L + D;
  const buf = new Uint32Array(11);
  crypto.getRandomValues(buf);
  let core = '';
  for (let i = 0; i < 8; i++) core += all[buf[i] % all.length];
  // Guarantee complexity (upper + lower + digit + special), 11 chars total.
  return U[buf[8] % U.length] + core + D[buf[9] % D.length] + S[buf[10] % S.length];
}

type Target = { id: string; email: string; name?: string };

async function issueFor(sb: any, u: Target, sendEmail: boolean) {
  const otp = genOtp();
  const { error } = await sb.auth.admin.updateUserById(u.id, {
    password: otp,
    app_metadata: { must_set_password: true },
    user_metadata: { must_set_password: true },
  });
  if (error) return { email: u.email, ok: false, error: error.message };

  let emailed = false;
  let emailError: string | undefined;
  if (sendEmail && u.email) {
    try {
      await mailService.dispatch({
        to: u.email,
        subject: 'Your REH Digital one-time password',
        type: 'SYSTEM_ALERT',
        payload: {
          title: 'Your One-Time Password',
          content: `<p style="text-align:center;color:#475569;font-size:15px;">Hello ${u.name || 'there'}, an administrator has issued you a one-time password to access REH Digital.</p>
            <p style="font-size:26px;font-weight:900;letter-spacing:5px;text-align:center;color:#003f49;background:#f1f5f9;padding:18px;border-radius:12px;margin:18px 0;">${otp}</p>
            <p style="text-align:center;color:#475569;font-size:14px;">Sign in with your work email and this password. You will be asked to set your own new password immediately.</p>`,
          link: `${SITE_URL}/login`,
          buttonLabel: 'Sign In',
        },
      });
      emailed = true;
    } catch (e: any) {
      emailError = e?.message || 'Email delivery failed';
    }
  }
  return { email: u.email, ok: true, otp, emailed, emailError };
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const { uid, all, sendEmail = true } = await req.json().catch(() => ({} as any));
    const sb = getSupabaseAdmin();

    let targets: Target[] = [];
    if (all) {
      const { data } = await sb.from('users').select('id,email,data');
      targets = (data || [])
        .filter((r: any) => r.email)
        .map((r: any) => ({ id: r.id, email: r.email, name: (r.data as any)?.name }));
    } else if (uid) {
      const { data } = await sb.from('users').select('id,email,data').eq('id', uid).maybeSingle();
      if (!data?.email) return Response.json({ error: 'User has no email on file.' }, { status: 400 });
      targets = [{ id: data.id, email: data.email, name: (data.data as any)?.name }];
    } else {
      return Response.json({ error: 'uid or all is required.' }, { status: 400 });
    }

    const results = [];
    for (const t of targets) results.push(await issueFor(sb, t, !!sendEmail));
    return Response.json({ success: true, count: results.length, results });
  } catch (err) {
    return authErrorResponse(err);
  }
}
