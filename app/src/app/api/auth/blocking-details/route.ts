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
    
    // Only return blocking details, nothing else for security
    if (userData.status === 'SUSPENDED' && userData.blockingDetails) {
      return NextResponse.json({
        suspended: true,
        blockingDetails: userData.blockingDetails
      });
    }

    return NextResponse.json({ suspended: false });
  } catch (error: any) {
    console.error('Error fetching blocking details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
