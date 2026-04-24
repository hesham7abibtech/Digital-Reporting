import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBvTzutQCPLDLAE44knfNlG_U5gFLar1M4",
  authDomain: "keodigitalreporting.firebaseapp.com",
  projectId: "keodigitalreporting",
  storageBucket: "keodigitalreporting.firebasestorage.app",
  messagingSenderId: "308017579101",
  appId: "1:308017579101:web:75aec4a1a9c2942a2c39b4",
  measurementId: "G-X5E9ZPE1BG"
};

// Initialize Firebase for Client side
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Modern Firestore Initialization with Multi-Tab Persistence
let db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined") {
  try {
    // We use initializeFirestore without persistentMultipleTabManager to isolate
    // the Firestore connection per tab. This prevents cross-tab Auth token conflicts
    // when using browserSessionPersistence for separate Admin and Home logins.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache(),
      experimentalAutoDetectLongPolling: true
    });
  } catch (err) {
    // Fallback if already initialized (Next.js Fast Refresh behavior)
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

const storage = getStorage(app);
export { app, auth, db, storage };
