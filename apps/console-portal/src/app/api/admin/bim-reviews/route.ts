import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'edge';

/**
 * Admin manual-entry management for BIM Reviews (the Manual / Hybrid sources).
 *  GET  → list manual entries from the Supabase `bim_reviews` table.
 *  POST → create or override (upsert) a manual BIM review (validated).
 * Admin-only.
 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('bim_reviews').select('id, data');
    if (error) throw new Error(error.message);
    return Response.json({ count: data?.length ?? 0, data: (data || []).map((r: any) => ({ id: r.id, ...r.data })) });
  } catch (err) {
    return authErrorResponse(err);
  }
}

// Validation for a manually-entered BIM review (canonical BIMReview shape).
const reviewSchema = z.object({
  'ID': z.string().trim().max(200).optional(),
  'Precinct': z.array(z.string()).optional(),
  'Project': z.string().trim().min(1, 'Project is required').max(500),
  'Stakeholder': z.string().trim().max(500).optional(),
  'Submitter': z.string().trim().max(500).optional(),
  'Milestone Submissions': z.array(z.string()).optional(),
  'Submission Category': z.array(z.string()).optional(),
  'Design Stage': z.string().trim().max(200).optional(),
  'ACC Review ID': z.string().trim().max(200).optional(),
  'InSite Review Status': z.string().trim().max(200).optional(),
  'InSite Review Due Date': z.string().nullable().optional(),
  'InSite Reviewer': z.array(z.string()).optional(),
  'InSite Review Output ACC URL': z.union([z.string().url(), z.literal('')]).optional(),
  'General Comments': z.string().max(5000).optional(),
});

function generateId(): string {
  return `bim-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const body = await req.json().catch(() => ({}));
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
    }

    const input = parsed.data;
    const id = (input['ID'] && input['ID'].length > 0 ? input['ID'] : generateId());
    const now = new Date().toISOString();
    const sb = getSupabaseAdmin();

    // Preserve the original createdAt when overriding an existing entry.
    const { data: existing } = await sb.from('bim_reviews').select('data').eq('id', id).maybeSingle();
    const createdAt = (existing?.data as any)?.createdAt || now;

    const record = {
      'ID': id,
      'Precinct': input['Precinct'] ?? [],
      'Project': input['Project'],
      'Stakeholder': input['Stakeholder'] ?? '',
      'Submitter': input['Submitter'] ?? '',
      'Milestone Submissions': input['Milestone Submissions'] ?? [],
      'Submission Category': input['Submission Category'] ?? [],
      'Design Stage': input['Design Stage'] ?? '',
      'ACC Review ID': input['ACC Review ID'] ?? '',
      'InSite Review Status': input['InSite Review Status'] ?? '',
      'InSite Review Due Date': input['InSite Review Due Date'] ?? null,
      'InSite Reviewer': input['InSite Reviewer'] ?? [],
      'InSite Review Output ACC URL': input['InSite Review Output ACC URL'] ?? '',
      'General Comments': input['General Comments'] ?? '',
      source: 'manual' as const,
      updatedAt: now,
      createdAt,
    };

    const { error } = await sb.from('bim_reviews').upsert({
      id,
      project: record['Project'],
      status: record['InSite Review Status'],
      data: record,
      created_at: createdAt,
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    return Response.json({ success: true, id, data: record }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
