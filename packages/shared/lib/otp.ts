/**
 * One-time password issuance (server / service-role context).
 * Generates a strong OTP, sets it as the user's password with `must_set_password`
 * so they are forced to choose a new password on first sign-in, and optionally
 * emails it via the AWS relay (bypasses Supabase's email rate limit).
 */
import { mailService } from '@/services/MailService';
import { SITE_URL } from '@/lib/siteConfig';

export function genOtp(): string {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789', S = '!@#$%';
  const all = U + L + D;
  const buf = new Uint32Array(11);
  crypto.getRandomValues(buf);
  let core = '';
  for (let i = 0; i < 8; i++) core += all[buf[i] % all.length];
  // Guarantee complexity (upper + lower + digit + special), 11 chars.
  return U[buf[8] % U.length] + core + D[buf[9] % D.length] + S[buf[10] % S.length];
}

export interface OtpResult {
  email: string;
  ok: boolean;
  otp?: string;
  emailed?: boolean;
  emailError?: string;
  error?: string;
}

/** Generate + set the OTP for one user, optionally emailing it. */
export async function issueOtp(
  sb: any,
  u: { id: string; email: string; name?: string },
  sendEmail: boolean,
): Promise<OtpResult> {
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
          content: `<p style="text-align:center;color:#475569;font-size:15px;">Hello ${u.name || 'there'}, a one-time password has been issued for your REH Digital account.</p>
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
