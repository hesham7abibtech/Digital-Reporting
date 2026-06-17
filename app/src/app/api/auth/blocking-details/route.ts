import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

/** Returns suspension details + latest appeal for a given email (login portal). Supabase-backed. */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  try {
    const sb = getSupabaseAdmin();
    const { data: user } = await sb.from('users').select('status, data').eq('email', email).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Latest revocation appeal (if any)
    let latestAppeal = null;
    const { data: tix } = await sb.from('tickets').select('data').eq('email', email).order('created_at', { ascending: false });
    const appeal = (tix || []).map((t: any) => t.data).find((d: any) => d?.type === 'REVOCATION_APPEAL');
    if (appeal) {
      latestAppeal = {
        status: appeal.status, message: appeal.message || null, adminResponse: appeal.adminResponse || null,
        createdAt: appeal.createdAt || null, updatedAt: appeal.updatedAt || null,
      };
    }

    const data = (user.data as any) || {};
    if (data.status === 'SUSPENDED' && data.blockingDetails) {
      return NextResponse.json({
        suspended: true,
        blockingDetails: {
          reason: data.blockingDetails.reason,
          duration: data.blockingDetails.duration,
          blockedAt: data.blockingDetails.blockedAt,
        },
        latestAppeal,
      });
    }
    return NextResponse.json({ suspended: false, latestAppeal });
  } catch (error: any) {
    console.error('Error fetching blocking details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
