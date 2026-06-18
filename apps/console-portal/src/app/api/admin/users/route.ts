import { NextRequest } from 'next/server';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'edge';

/**
 * Admin user actions — Supabase only. Block/unblock via GoTrue ban_duration;
 * delete removes the auth user + profile row. Admin-gated.
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const { action, uid } = body;
    if (!uid) return Response.json({ error: 'uid required' }, { status: 400 });
    const sb = getSupabaseAdmin();

    // Read current profile data so we can merge the status into the jsonb doc.
    const { data: row } = await sb.from('users').select('data').eq('id', uid).maybeSingle();
    const data = ((row?.data as any) || {});
    const now = new Date().toISOString();

    switch (action) {
      case 'block':
        await sb.auth.admin.updateUserById(uid, { ban_duration: '876000h' });
        await sb.from('users').update({ status: 'SUSPENDED', data: { ...data, status: 'SUSPENDED', updatedAt: now } }).eq('id', uid);
        break;
      case 'unblock':
        await sb.auth.admin.updateUserById(uid, { ban_duration: 'none' });
        await sb.from('users').update({ status: 'ACTIVE', data: { ...data, status: 'ACTIVE', updatedAt: now } }).eq('id', uid);
        break;
      case 'set-email': {
        const email = String(body.email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: 'A valid email is required.' }, { status: 400 });
        // Update the auth identity (confirmed so the user can sign in immediately)…
        const { error: aErr } = await sb.auth.admin.updateUserById(uid, { email, email_confirm: true });
        if (aErr) return Response.json({ error: aErr.message }, { status: 400 });
        // …and mirror it onto the profile row (promoted column + jsonb doc).
        await sb.from('users').update({ email, data: { ...data, email, updatedAt: now } }).eq('id', uid);
        break;
      }
      case 'delete':
        await sb.from('users').delete().eq('id', uid);
        try { await sb.auth.admin.deleteUser(uid); } catch (e) { console.error('[admin/users] auth delete:', e); }
        break;
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    return Response.json({ success: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
