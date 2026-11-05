
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAVryEjbHzE_X9fR7Es27q_f-e1V2Hbxy8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "recruitex-7557c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "recruitex-7557c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "recruitex-7557c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "665620562251",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:665620562251:web:634c205efb5c1f21c4a8ce",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-R04N369DJX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
