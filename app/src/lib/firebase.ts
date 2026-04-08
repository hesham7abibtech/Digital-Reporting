import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

const storage = getStorage(app);
export { app, auth, db, storage };
