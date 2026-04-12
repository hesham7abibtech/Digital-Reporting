import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
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
const db = getFirestore(app);

// Enable Offline Persistence for Client-side Resilience
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore persistence NOT supported by browser.");
    }
  });
}

const storage = getStorage(app);
export { app, auth, db, storage };
