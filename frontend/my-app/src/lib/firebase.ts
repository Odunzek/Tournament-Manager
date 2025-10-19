import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (u) => {
    if (!u) {
      signInAnonymously(auth).catch((e) => console.error('Anon sign-in failed:', e));
    }
  });
}

// ================================
// 📘 Shared Data Models
// ================================

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
