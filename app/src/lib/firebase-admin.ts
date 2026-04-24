import * as admin from 'firebase-admin';

/**
 * Edge-Compatible Firebase Admin Proxy
 * Prevents module evaluation errors by lazy-loading the SDK only when called.
 */

let app: admin.app.App | null = null;

function getAdminApp() {
  if (typeof window !== 'undefined') return null; // Never run on client
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    const projectId = "keodigitalreporting";
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');
      }

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });
    }
    return null;
  } catch (error) {
    return null;
  }
}

export const getAdminAuth = () => {
  const app = getAdminApp();
  return app ? admin.auth(app) : null as unknown as admin.auth.Auth;
};

export const getAdminDb = () => {
  const app = getAdminApp();
  return app ? admin.firestore(app) : null as unknown as admin.firestore.Firestore;
};
