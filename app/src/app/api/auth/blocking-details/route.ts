// Security Handshake API - Force Rebuild: 2026-04-27
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Firebase Admin DB initialization failed');
    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  }

  try {
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = snapshot.docs[0].data();

    // Check for latest appeal ticket
    let latestAppeal = null;
    try {
      const ticketsRef = adminDb.collection('tickets');
      const ticketSnapshot = await ticketsRef
        .where('email', '==', email)
        .where('type', '==', 'REVOCATION_APPEAL')
        .get();
      
      if (!ticketSnapshot.empty) {
        // Sort in memory to avoid needing a composite index for orderBy
        const sortedDocs = ticketSnapshot.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toMillis?.() || 0;
          const bTime = b.data().createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        const tData = sortedDocs[0].data();
        latestAppeal = {
          status: tData.status,
          message: tData.message || null,
          adminResponse: tData.adminResponse || null,
          createdAt: tData.createdAt?.toDate?.() || null,
          updatedAt: tData.updatedAt?.toDate?.() || tData.createdAt?.toDate?.() || null
        };
      }
    } catch (e) {
      console.error('Latest ticket check failure:', e);
    }

    // Only return blocking details, nothing else for security
    if (userData.status === 'SUSPENDED' && userData.blockingDetails) {
      return NextResponse.json({
        suspended: true,
        blockingDetails: userData.blockingDetails,
        latestAppeal
      });
    }

    return NextResponse.json({ suspended: false, latestAppeal });
  } catch (error: any) {
    console.error('Error fetching blocking details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
