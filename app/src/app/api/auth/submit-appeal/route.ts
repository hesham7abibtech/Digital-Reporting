import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { mailService } from '@/services/MailService';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { email, notes, originalReason, originalDuration } = await req.json();

    if (!email || !notes) {
      return NextResponse.json({ error: 'Email and notes are required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 1. Create Ticket in Firestore via Admin SDK (Bypassing Rules)
    const ticketRef = await adminDb.collection('tickets').add({
      email: email,
      type: 'REVOCATION_APPEAL',
      reason: 'Revision Request for Blocked Account',
      message: notes,
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        originalReason,
        originalDuration,
        source: 'LOGIN_PORTAL_APPEAL'
      }
    });

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

    return NextResponse.json({ success: true, ticketId: ticketRef.id });
  } catch (error: any) {
    console.error('Appeal submission API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
