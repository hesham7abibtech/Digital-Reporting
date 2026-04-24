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
    const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_RESET_USER || process.env.SMTP_USER || 'verification@rehdigital.com',
    pass: process.env.SMTP_RESET_PASS || process.env.SMTP_PASS || '51FzgcyZfydb',
  },
};

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('[FIREBASE_ADMIN] Using Service Account from environment');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      // Robust fix for private key newline characters in environment variables
      if (serviceAccount.private_key) {
        // Handle both literal newlines and escaped string newlines
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');
      }

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
