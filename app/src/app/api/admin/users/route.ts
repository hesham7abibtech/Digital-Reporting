import { NextRequest } from 'next/server';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * Admin user actions — Supabase only. Block/unblock via GoTrue ban_duration;
 * delete removes the auth user + profile row. Admin-gated.
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const { action, uid } = await req.json();
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
