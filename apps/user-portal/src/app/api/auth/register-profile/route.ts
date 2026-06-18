import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'edge';

/**
 * Provision a PENDING profile row for a brand-new Supabase sign-up.
 * Verifies the auth user exists and the email matches before inserting
 * (so a caller can't fabricate a profile for an arbitrary id). The profile
 * starts unapproved/unverified — an admin approves it, mirroring the old flow.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, department } = await req.json().catch(() => ({} as any));
    if (!userId || !email) return Response.json({ error: 'userId and email required' }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.auth.admin.getUserById(userId);
    if (error || !data?.user) return Response.json({ error: 'Unknown user' }, { status: 404 });
    if ((data.user.email || '').toLowerCase() !== String(email).toLowerCase()) {
      return Response.json({ error: 'Email mismatch' }, { status: 403 });
    }

    const existing = await sb.from('users').select('id').eq('id', userId).maybeSingle();
    if (existing.data) return Response.json({ success: true, already: true });

    const now = new Date().toISOString();
    const profile = {
      uid: userId, email, name: name || '', department: department || '',
      role: 'TEAM_MATE', isAdmin: false, isApproved: false, isVerified: false,
      status: 'PENDING', access: { deliverablesRegistry: false, bimReviews: false },
      createdAt: now, updatedAt: now,
    };
    const { error: insErr } = await sb.from('users').insert({
      id: userId, email, name: name || '', role: 'TEAM_MATE',
      is_admin: false, is_approved: false, is_verified: false, status: 'PENDING',
      access: profile.access, data: profile, created_at: now, updated_at: now,
    });
    if (insErr) return Response.json({ error: insErr.message }, { status: 400 });
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
