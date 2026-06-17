import { NextRequest } from 'next/server';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { issueOtp } from '@/lib/otp';

export const runtime = 'edge';

/**
 * Admin-issued one-time passwords. `{ uid }` for one user, or `{ all: true }`
 * for every user with an email. Returns each OTP so the admin can also share it
 * manually if mail is unavailable. See `@/lib/otp` for the issuance logic.
 */
type Target = { id: string; email: string; name?: string };

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
    for (const t of targets) results.push(await issueOtp(sb, t, !!sendEmail));
    return Response.json({ success: true, count: results.length, results });
  } catch (err) {
    return authErrorResponse(err);
  }
}
