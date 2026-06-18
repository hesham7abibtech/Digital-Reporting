import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mailService } from '@/services/MailService';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { email, notes, originalReason, originalDuration } = await req.json();

    if (!email || !notes) {
      return NextResponse.json({ error: 'Email and notes are required' }, { status: 400 });
    }

    // 1. Create the appeal ticket in Supabase (service_role bypasses RLS)
    const now = new Date().toISOString();
    const ticketId = `DR-${Date.now().toString(36).toUpperCase()}`;
    const ticket = {
      id: ticketId, email, type: 'REVOCATION_APPEAL',
      reason: 'Revision Request for Blocked Account', message: notes,
      status: 'OPEN', priority: 'HIGH', createdAt: now, updatedAt: now,
      metadata: { originalReason, originalDuration, source: 'LOGIN_PORTAL_APPEAL' },
    };
    const sb = getSupabaseAdmin();
    await sb.from('tickets').insert({ id: ticketId, email, status: 'OPEN', data: ticket, created_at: now, updated_at: now });

    // 2. Notify User
    try {
      await mailService.dispatch({
        to: email,
        subject: 'Revision Request Received - Digital Reporting',
        type: 'REVOCATION_APPEAL',
        payload: {
          notes,
          message: 'We have received your appeal. Our team is reviewing it.'
        }
      });
    } catch (e) {
      console.error('User notification failed:', e);
    }

    // 3. Notify Admin
    try {
      await mailService.dispatch({
        to: 'admin@rehdigital.com',
        subject: 'URGENT: New Account Revision Appeal',
        type: 'REVOCATION_APPEAL',
        payload: {
          userEmail: email,
          notes,
          originalReason,
          originalDuration
        }
      });
    } catch (e) {
      console.error('Admin notification failed:', e);
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (error: any) {
    console.error('Appeal submission API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

