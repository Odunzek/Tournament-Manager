/**
 * Firebase Configuration & Initialization
 *
 * This is the central Firebase setup file for the entire application.
 * It initializes the Firebase app, Firestore database, and Authentication.
 *
 * Key behavior:
 * - Uses singleton pattern (getApps check) to prevent duplicate initialization
 *   during Next.js hot reloads or SSR hydration.
 * - All non-admin users are automatically signed in anonymously so they can
 *   read Firestore data. Admin users sign in via Google (see AuthContext.tsx).
 * - Environment variables (NEXT_PUBLIC_*) are set in .env.local
 *
 * @see AuthContext.tsx — Admin authentication (Google sign-in) built on top of this
 * @see firebaseutils.ts — LEGACY CRUD functions (old league system, still used by some components)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

/** Firebase project configuration — values loaded from environment variables */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Initialize Firebase app — reuses existing instance if already initialized (Next.js HMR safety) */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** Firestore database instance — used throughout the app for all data operations */
export const db = getFirestore(app);

/** Firebase Auth instance — manages both anonymous and admin (Google) sessions */
export const auth = getAuth(app);

/** Google OAuth provider — used by AuthContext for admin sign-in */
export const googleProvider = new GoogleAuthProvider();

// Re-export auth functions so AuthContext.tsx can import them from one place
export { signInWithPopup, signOut, onAuthStateChanged };

/**
 * Auto-sign-in anonymous users on the client side.
 * This runs once when the app loads in the browser.
 * If no user is signed in (or the previous anonymous session expired),
 * we create a new anonymous session so Firestore reads work for all visitors.
 * Admin users who sign in with Google will replace this anonymous session.
 */
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (u) => {
    if (!u) {
      signInAnonymously(auth).catch((e) => console.error('Anon sign-in failed:', e));
    }
  });
}

// ================================
// 📘 Legacy Shared Data Models
// ================================
// These interfaces are used by the OLD league system (firebaseutils.ts).
// The new system uses types from types/league.ts and lib/leagueUtils.ts instead.
// Kept here because some legacy components (app/components/*) still import them.

/** Legacy League interface — used by the old LeagueManager component */
export interface League {
  id: string;
  name: string;
  createdAt: Date;
  teams: {
    id: string;
    name: string;
    psnId?: string;
  }[];
  status?: 'active' | 'ended';
  endedAt?: Date;
}

/** Legacy Match interface — used by the old match recording system */
export interface Match {
  id: string;
  leagueId?: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date;
}
