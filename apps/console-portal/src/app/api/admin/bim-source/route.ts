import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getBimSourceConfig, saveBimSourceConfig, getNotionStatus } from '@/lib/bimSource';

export const runtime = 'edge';

/**
 * GET  /api/admin/bim-source  → current config + live Notion connection status.
 * PUT  /api/admin/bim-source  → update mode / sync toggle / merge strategy.
 * Admin-only.
 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const [config, notion] = await Promise.all([getBimSourceConfig(), getNotionStatus()]);
    return Response.json({ config, notion });
  } catch (err) {
    return authErrorResponse(err);
  }
}

const updateSchema = z
  .object({
    mode: z.enum(['notion', 'manual', 'hybrid']).optional(),
    notionSyncEnabled: z.boolean().optional(),
    mergeStrategy: z.enum(['manual_override', 'notion_override']).optional(),
    syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual']).optional(),
    syncTime: z.string().max(20).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No configuration fields provided' });

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
    }
    const config = await saveBimSourceConfig(parsed.data, admin.email || admin.uid);
    return Response.json({ config });
  } catch (err) {
    return authErrorResponse(err);
  }
}
