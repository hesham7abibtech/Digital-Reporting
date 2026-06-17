import { NextRequest } from 'next/server';
import { verifyBimAccess, authErrorResponse, AuthError } from '@/lib/adminAuth';
import { getBimSourceConfig, getUnifiedBimReviews } from '@/lib/bimSource';

export const runtime = 'edge';

/**
 * GET /api/bim-reviews-report
 * Returns the unified BIM Reviews Report dataset for the active admin-configured
 * data-source mode (Notion-only / Manual-only / Hybrid). Requires an authenticated
 * user with BIM Reviews access.
 */
export async function GET(req: NextRequest) {
  try {
    await verifyBimAccess(req);

    const config = await getBimSourceConfig();
    const result = await getUnifiedBimReviews(config);

    return Response.json(
      {
        mode: result.mode,
        notionActive: result.notionActive,
        sources: result.sources,
        count: result.data.length,
        warnings: result.warnings,
        cachedAt: new Date().toISOString(),
        data: result.data,
      },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    console.error('[bim-reviews-report] Failed:', err);
    return Response.json(
      { error: 'Failed to resolve BIM Reviews Report', detail: (err as Error)?.message },
      { status: 502 },
    );
  }
}
