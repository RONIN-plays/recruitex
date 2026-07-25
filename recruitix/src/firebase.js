// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8tOtnNCTYIscW1UYEChgovoVdC3TBB8A",
  authDomain: "recruitx-b3d63.firebaseapp.com",
  projectId: "recruitx-b3d63",
  storageBucket: "recruitx-b3d63.firebasestorage.app",
  messagingSenderId: "659225267914",
  appId: "1:659225267914:web:7a11fdfb31a9ca0e1a6e33",
  measurementId: "G-ZXWCZGXYJ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
