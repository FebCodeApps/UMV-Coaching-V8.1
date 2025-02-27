import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCpA86zPqZzNoy5cLC8FHvJYwJZjk_8Vcs",
  authDomain: "anini-f5291.firebaseapp.com",
  projectId: "anini-f5291",
  storageBucket: "anini-f5291.firebasestorage.app",
  messagingSenderId: "74712392355",
  appId: "1:74712392355:web:2f571a198691c9c4dcd516",
  measurementId: "G-0599QKWG6N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Check if getAnalytics is supported in the current environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
