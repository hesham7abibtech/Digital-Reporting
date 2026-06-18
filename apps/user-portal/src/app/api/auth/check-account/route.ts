import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isDomainAllowed, accountExists } from '@/lib/authPolicy';

export const runtime = 'edge';

/**
 * Pre-flight check for the auth UI: is the email's domain allowed (admin-controlled)
 * and does an account actually exist? Lets the UI say "this account does not exist"
 * before attempting a sign-in / reset.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({} as any));
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    // Report existence independently of the domain rule: an already-provisioned
    // account is allowed to sign in even if its email domain isn't on the
    // allow-list (the list only gates brand-new access).
    const [allowed, { exists }] = await Promise.all([
      isDomainAllowed(sb, email),
      accountExists(sb, email),
    ]);
    return Response.json({ allowed, exists });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Check failed' }, { status: 500 });
  }
}
