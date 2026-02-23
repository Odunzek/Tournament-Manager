import { useState, useEffect } from 'react';
import { Season } from '@/types/season';
import { onSnapshot, query, collection, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Real-time hook tracking the currently active season.
 * Used by create modals to auto-assign seasonId.
 */
export function useActiveSeason() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'seasons'),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setActiveSeason(null);
      } else {
        const doc = snap.docs[0];
        setActiveSeason({ id: doc.id, ...doc.data() } as Season);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { activeSeason, loading };
}
