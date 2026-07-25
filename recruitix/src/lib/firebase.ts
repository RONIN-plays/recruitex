
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8tOtnNCTYIscW1UYEChgovoVdC3TBB8A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "recruitx-b3d63.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "recruitx-b3d63",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "recruitx-b3d63.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "659225267914",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:659225267914:web:7a11fdfb31a9ca0e1a6e33",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZXWCZGXYJ0"
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
