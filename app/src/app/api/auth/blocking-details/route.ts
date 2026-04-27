import { NextRequest, NextResponse } from 'next/server';
import { firebaseRest } from '@/lib/firebase-rest';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    // 1. Fetch user by email via Firestore REST Query
    const queryResults = await firebaseRest.firestoreQuery('users', [
      { field: 'email', op: 'EQUAL', value: email }
    ]);

    const userDoc = queryResults?.[0]?.document;
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.fields;

    // 2. Check for latest appeal ticket via Firestore REST Query
    let latestAppeal = null;
    try {
      const ticketResults = await firebaseRest.firestoreQuery('tickets', [
        { field: 'email', op: 'EQUAL', value: email },
        { field: 'type', op: 'EQUAL', value: 'REVOCATION_APPEAL' }
      ]);

      if (ticketResults && ticketResults.length > 0) {
        // RunQuery returns an array of { document: ... }
        // Sort in memory (already handled by the utility potentially, but we'll do it here)
        const sortedTickets = ticketResults
          .filter((r: any) => r.document)
          .sort((a: any, b: any) => {
            const aTime = new Date(a.document.createTime).getTime();
            const bTime = new Date(b.document.createTime).getTime();
            return bTime - aTime;
          });

        const tDoc = sortedTickets[0].document;
        const tFields = tDoc.fields;
        
        latestAppeal = {
          status: tFields.status?.stringValue,
          message: tFields.message?.stringValue || null,
          adminResponse: tFields.adminResponse?.stringValue || null,
          createdAt: tDoc.createTime,
          updatedAt: tDoc.updateTime
        };
      }
    } catch (e) {
      console.error('Latest ticket check failure:', e);
    }

    // Only return blocking details, nothing else for security
    const status = userData.status?.stringValue;
    if (status === 'SUSPENDED' && userData.blockingDetails) {
      // Map complex blockingDetails if needed, or return as is
      return NextResponse.json({
        suspended: true,
        blockingDetails: {
          reason: userData.blockingDetails.mapValue?.fields?.reason?.stringValue,
          duration: userData.blockingDetails.mapValue?.fields?.duration?.stringValue,
          blockedAt: userData.blockingDetails.mapValue?.fields?.blockedAt?.stringValue,
        },
        latestAppeal
      });
    }

    return NextResponse.json({ suspended: false, latestAppeal });
  } catch (error: any) {
    console.error('Error fetching blocking details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

