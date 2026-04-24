import * as admin from 'firebase-admin';

/**
 * Bulletproof Firebase Admin Initialization
 * Handles Next.js Fast Refresh and missing environment credentials gracefully.
 */

function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  try {
    const projectId = "keodigitalreporting";
    console.log(`[FIREBASE_ADMIN] Initializing for project: ${projectId}`);

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('[FIREBASE_ADMIN] Using Service Account from environment');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });
    } else {
      console.warn('[FIREBASE_ADMIN] No Service Account found. Attempting Application Default Credentials...');
      return admin.initializeApp({
        projectId: projectId
      });
    }
  } catch (error: any) {
    console.error('[FIREBASE_ADMIN] Initialization failed:', error.message);
    return null;
  }
}

const app = getAdminApp();

// Lazy exporters to prevent crash during module evaluation
export const adminAuth = app ? admin.auth(app) : null as unknown as admin.auth.Auth;
export const adminDb = app ? admin.firestore(app) : null as unknown as admin.firestore.Firestore;
