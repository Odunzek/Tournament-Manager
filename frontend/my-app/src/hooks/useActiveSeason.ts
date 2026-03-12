/**
 * @file useActiveSeason.ts
 *
 * Provides a real-time hook that resolves the single currently active season
 * from Firestore. The app enforces at most one active season at a time, so this
 * hook queries with `limit(1)`. It is primarily consumed by create/edit modals
 * (e.g., CreateLeagueModal, CreateTournamentModal) to auto-assign the correct
 * `seasonId` to newly created entities.
 */

import { useState, useEffect } from 'react';
import { Season } from '@/types/season';
import { onSnapshot, query, collection, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Real-time hook tracking the currently active season.
 * Used by create modals to auto-assign seasonId.
 *
 * Subscribes to the `seasons` collection filtered by `status === 'active'` and
 * limited to a single document. The listener stays open for the lifetime of the
 * consuming component, so any season activation/deactivation is reflected
 * immediately in the UI.
 *
 * @returns An object containing:
 *   - `activeSeason` - The current active {@link Season} document, or `null` if none exists.
 *   - `loading`      - `true` until the first Firestore snapshot arrives.
 *
 * @example
 * ```tsx
 * const { activeSeason, loading } = useActiveSeason();
 * if (!loading && activeSeason) {
 *   console.log('Current season:', activeSeason.name);
 * }
 * ```
 */
export function useActiveSeason() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore query: get the one season document whose status is 'active'.
    // limit(1) ensures we only read a single doc even if data is inconsistent.
    const q = query(
      collection(db, 'seasons'),
      where('status', '==', 'active'),
      limit(1)
    );

    // Set up a real-time listener; onSnapshot fires immediately with the
    // current data and again whenever the matched document changes.
    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        // No active season exists (e.g., between seasons or first launch)
        setActiveSeason(null);
      } else {
        // Merge the Firestore document ID with its field data into a Season object
        const doc = snap.docs[0];
        setActiveSeason({ id: doc.id, ...doc.data() } as Season);
      }
      setLoading(false);
    });

    // Cleanup: detach the Firestore listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return { activeSeason, loading };
}
