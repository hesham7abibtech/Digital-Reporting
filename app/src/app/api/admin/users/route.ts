import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { action, uid } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    
    if (!adminAuth) {
      return NextResponse.json({ error: 'Internal Error: Firebase Admin not initialized' }, { status: 500 });
    }

    // 1. Verify the requester is an Admin/Owner
    const decodedToken = await adminAuth.verifyIdToken(token);
    const requesterUid = decodedToken.uid;
    
    // Check requester role in Firestore via Admin SDK
    const adminDb = (await import('@/lib/firebase-admin')).getAdminDb();
    if (!adminDb) {
        return NextResponse.json({ error: 'Internal Error: Firestore Admin not initialized' }, { status: 500 });
    }
    const requesterDoc = await adminDb.collection('users').doc(requesterUid).get();
    const requesterData = requesterDoc.data();

    if (!requesterData?.isAdmin && requesterData?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // 2. Perform Action
    switch (action) {
      case 'block':
        await adminAuth.updateUser(uid, { disabled: true });
        break;
      case 'unblock':
        await adminAuth.updateUser(uid, { disabled: false });
        break;
      case 'delete':
        // Deleting from Auth
        await adminAuth.deleteUser(uid);
        // Firestore deletion is handled separately in the client but we can do it here for atomicity if needed.
        // The user requested it be deleted from both.
        await adminDb.collection('users').doc(uid).delete();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Admin User Action Error:', err);
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
