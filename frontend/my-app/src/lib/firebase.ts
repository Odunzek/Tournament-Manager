// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// All values already expected in your .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing during hot reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export db for your existing utils
export const db = getFirestore(app);

// 🔐 Lightweight auth: give each browser a Firebase identity (no UI change)
export const auth = getAuth(app);

// Only run in the browser (Next.js App Router SSR guard)
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    // If the user has no Firebase identity yet, sign them in anonymously
    if (!user) {
      signInAnonymously(auth).catch((e) =>
        console.error('Anonymous sign-in failed:', e)
      );
    }
  });
}
