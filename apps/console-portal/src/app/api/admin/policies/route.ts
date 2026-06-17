import { NextRequest } from 'next/server';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * Group Policy management — Supabase `group_policies` table (no Firestore).
 *  GET    → list policies
 *  POST   → create/update (upsert) a policy
 *  DELETE ?id= → remove a policy
 * Admin/owner only.
 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('group_policies').select('id, data').order('id');
    if (error) throw new Error(error.message);
    const policies = (data || []).map((r: any) => ({ id: r.id, ...(r.data || {}) }));
    return Response.json({ policies });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const body = await req.json().catch(() => ({} as any));
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      return Response.json({ error: 'Policy name is required' }, { status: 400 });
    }
    const sb = getSupabaseAdmin();
    const id = body.id && String(body.id).trim() ? String(body.id) : `policy-${Date.now()}`;
    const { data: existing } = await sb.from('group_policies').select('data').eq('id', id).maybeSingle();
    const createdAt = (existing?.data as any)?.createdAt || new Date().toISOString();
    const now = new Date().toISOString();
    const policy = {
      id,
      name: body.name.trim(),
      description: typeof body.description === 'string' ? body.description : '',
      isTeammatePolicy: !!body.isTeammatePolicy,
      modules: body.modules && typeof body.modules === 'object' ? body.modules : {},
      createdAt,
      updatedAt: now,
    };
    const { error } = await sb.from('group_policies').upsert({
      id, name: policy.name, description: policy.description, modules: policy.modules,
      data: policy, created_at: createdAt, updated_at: now,
    });
    if (error) throw new Error(error.message);
    return Response.json({ success: true, policy });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { error } = await sb.from('group_policies').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return Response.json({ success: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
