import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
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
    const allowed = await isDomainAllowed(sb, email);
    if (!allowed) return Response.json({ allowed: false, exists: false });
    const { exists } = await accountExists(sb, email);
    return Response.json({ allowed: true, exists });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Check failed' }, { status: 500 });
  }
}
