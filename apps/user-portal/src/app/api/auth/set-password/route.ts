import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * Set a user's password from a verified Supabase recovery session.
 * The caller proves ownership of the account via the recovery access-token
 * (Authorization: Bearer); the server then sets the password + clears the
 * migration flag with the service_role. Used by the post-migration
 * "set / reuse your password" flow and normal password resets.
 */
function validatePassword(p: string): string | null {
  if (!p || p.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(p)) return 'Add at least one uppercase letter.';
  if (!/\d/.test(p)) return 'Add at least one number.';
  if (!/[^a-zA-Z0-9]/.test(p)) return 'Add at least one special character.';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing recovery session.' }, { status: 401 });
    }
    const token = header.slice(7).trim();
    const { password } = await req.json().catch(() => ({} as any));
    const invalid = validatePassword(password);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) {
      return Response.json({ error: 'Recovery session is invalid or expired. Request a new link.' }, { status: 401 });
    }
    const u = data.user;

    const { error: upErr } = await sb.auth.admin.updateUserById(u.id, {
      password,
      app_metadata: { ...(u.app_metadata || {}), must_set_password: false },
      user_metadata: { ...(u.user_metadata || {}), must_set_password: false },
    });
    if (upErr) return Response.json({ error: upErr.message }, { status: 400 });

    // best-effort: flag the profile as migrated
    await sb.from('users').update({ password_migrated: true }).eq('id', u.id);

    return Response.json({ success: true, email: u.email });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Failed to set password' }, { status: 500 });
  }
}
