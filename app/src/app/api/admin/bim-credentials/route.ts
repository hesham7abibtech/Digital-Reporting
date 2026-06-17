import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, authErrorResponse } from '@/lib/adminAuth';
import { getNotionConnectionInfo, saveNotionCredentials } from '@/lib/bimSource';

export const runtime = 'edge';

/**
 * Notion credential management for the BIM Reviews Report (Admin → API Connections).
 *  GET → masked connection status (never returns the raw token).
 *  PUT → store/update credentials in the server-only `secrets/bimNotion` doc,
 *        then return a fresh masked status incl. a live connection test.
 * Admin-only.
 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req);
    // Only contact Notion when ?test=1 (Re-test button). Plain loads never ping.
    const test = new URL(req.url).searchParams.get('test') === '1';
    const info = await getNotionConnectionInfo({ test });
    return Response.json(info);
  } catch (err) {
    return authErrorResponse(err);
  }
}

const credSchema = z
  .object({
    // Token optional: omit/blank keeps the existing stored secret.
    token: z.string().trim().max(300).optional(),
    databaseId: z.string().trim().max(100).optional(),
    version: z.string().trim().max(20).optional(),
    // JSON map of BIMReview field -> Notion property name. '' clears it.
    propertyMap: z
      .string()
      .max(4000)
      .refine((s) => s === '' || isValidJsonObject(s), { message: 'propertyMap must be valid JSON object or empty' })
      .optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields provided' });

function isValidJsonObject(s: string): boolean {
  try {
    const v = JSON.parse(s);
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  } catch {
    return false;
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json().catch(() => ({}));
    const parsed = credSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
    }
    await saveNotionCredentials(parsed.data, admin.email || admin.uid);
    const info = await getNotionConnectionInfo({ test: true }); // live ping after save
    return Response.json({ success: true, info });
  } catch (err) {
    return authErrorResponse(err);
  }
}
