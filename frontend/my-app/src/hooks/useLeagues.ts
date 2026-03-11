/**
 * @file useLeagues.ts
 *
 * Real-time Firebase hooks for league and league-match data. Exports four hooks:
 *
 * - {@link useLeagues}        - All leagues, ordered by creation date.
 * - {@link useLeague}         - A single league looked up by document ID.
 * - {@link useLeagueMatches}  - All matches for a given league, merging the
 *                               legacy `matches` collection with the newer
 *                               `leagueMatches` collection and normalising the
 *                               data shape.
 * - {@link useActiveLeagues}  - Only leagues whose `status` is `'active'`.
 *
 * Every hook returns `{ loading, error }` alongside its primary data so
 * consumers can render skeleton/error states consistently.
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { League, LeagueMatch } from '@/types/league';
import { usePlayers } from './usePlayers';

/**
 * Subscribe to **all** leagues in real-time, ordered newest-first.
 *
 * Queries the `leagues` Firestore collection sorted by `createdAt` descending.
 * The snapshot listener keeps the returned array in sync with the database for
 * the lifetime of the consuming component.
 *
 * @returns An object containing:
 *   - `leagues` - Array of {@link League} documents.
 *   - `loading` - `true` until the first snapshot resolves.
 *   - `error`   - Populated if the Firestore listener encounters an error.
 *
 * @example
 * ```tsx
 * const { leagues, loading } = useLeagues();
 * ```
 */
export function useLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Query all leagues, most recently created first
    const q = query(collection(db, 'leagues'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        // Map each Firestore document into a League object with its ID merged in
        const leaguesData: League[] = [];
        querySnapshot.forEach((doc) => {
          leaguesData.push({ id: doc.id, ...doc.data() } as League);
        });
        setLeagues(leaguesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching leagues:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Detach listener on unmount
    return () => unsubscribe();
  }, []);

  return { leagues, loading, error };
}

/**
 * Subscribe to a **single league** by its Firestore document ID in real-time.
 *
 * Uses a `where('__name__', '==', leagueId)` query so that changes to the
 * document (e.g., status updates, player additions) are pushed to the
 * component automatically.
 *
 * @param leagueId - The Firestore document ID of the league, or `null` to skip
 *                   the subscription entirely.
 *
 * @returns An object containing:
 *   - `league`  - The matched {@link League} document, or `null`.
 *   - `loading` - `true` until the first snapshot resolves.
 *   - `error`   - Populated on Firestore errors.
 */
export function useLeague(leagueId: string | null) {
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no leagueId provided, reset state and bail out early
    if (!leagueId) {
      setLeague(null);
      setLoading(false);
      return;
    }

    // __name__ is a Firestore special field that refers to the document ID
    const q = query(collection(db, 'leagues'), where('__name__', '==', leagueId));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const leagueData = { id: doc.id, ...doc.data() } as League;
          console.log(`[useLeague] Fetched league ${leagueId}:`, leagueData);
          setLeague(leagueData);
        } else {
          console.log(`[useLeague] No league found with id ${leagueId}`);
          setLeague(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching league:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Detach listener on unmount or when leagueId changes
    return () => unsubscribe();
  }, [leagueId]);

  return { league, loading, error };
}

/**
 * Subscribe to all matches for a given league in real-time, merging data from
 * both the **new** `leagueMatches` collection and the **legacy** `matches`
 * collection.
 *
 * The hook performs two parallel Firestore subscriptions. Once both have
 * delivered their first snapshot, matches are merged, sorted by date
 * (newest first), and stored as `rawMatches`. A `useMemo` pass then
 * normalises legacy match documents (which use `homeTeam`/`awayTeam` field
 * names) into the current {@link LeagueMatch} shape using the player list
 * from {@link usePlayers}.
 *
 * @param leagueId - The league document ID to fetch matches for, or `null`
 *                   to skip the subscription.
 *
 * @returns An object containing:
 *   - `matches` - Normalised array of {@link LeagueMatch} objects.
 *   - `loading` - `true` until both collection snapshots have resolved.
 *   - `error`   - Populated on Firestore errors.
 */
export function useLeagueMatches(leagueId: string | null) {
  /** Raw (un-normalised) match documents from both collections */
  const [rawMatches, setRawMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Player list used during the legacy-format normalisation step
  const { players } = usePlayers();

  // ---- Firestore subscriptions (raw data only, no transformation) ----
  useEffect(() => {
    if (!leagueId) {
      setRawMatches([]);
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];
    let newMatches: any[] = [];
    let oldMatches: any[] = [];
    let loadedCount = 0;

    /**
     * Called after each of the two snapshot listeners fires for the first time.
     * Once both have reported (`loadedCount === 2`), the results are merged,
     * sorted by date descending, and committed to state.
     */
    const checkAndUpdate = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Merge results from both collections
        const allMatches = [...newMatches, ...oldMatches];

        // Sort by date descending; handle both Firestore Timestamps and ISO strings
        allMatches.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(a.date);
          const dateB = b.date?.toDate?.() || new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setRawMatches(allMatches);
        setLoading(false);
      }
    };

    // --- Listener 1: new `leagueMatches` collection ---
    const newQuery = query(
      collection(db, 'leagueMatches'),
      where('leagueId', '==', leagueId)
    );

    const unsubNew = onSnapshot(
      newQuery,
      (snapshot) => {
        newMatches = [];
        snapshot.forEach((doc) => {
          newMatches.push({ id: doc.id, ...doc.data() } as LeagueMatch);
        });
        console.log(`[useLeagueMatches] Found ${newMatches.length} matches in leagueMatches collection for league ${leagueId}`);
        checkAndUpdate();
      },
      (err) => {
        console.error('Error fetching new matches:', err);
        checkAndUpdate();
      }
    );
    unsubscribers.push(unsubNew);

    // --- Listener 2: legacy `matches` collection ---
    const oldQuery = query(
      collection(db, 'matches'),
      where('leagueId', '==', leagueId)
    );

    const unsubOld = onSnapshot(
      oldQuery,
      (snapshot) => {
        oldMatches = [];
        snapshot.forEach((doc) => {
          oldMatches.push({ id: doc.id, ...doc.data() });
        });
        console.log(`[useLeagueMatches] Found ${oldMatches.length} matches in matches collection for league ${leagueId}`);
        checkAndUpdate();
      },
      (err) => {
        console.error('Error fetching old matches:', err);
        checkAndUpdate();
      }
    );
    unsubscribers.push(unsubOld);

    // Detach both listeners on cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [leagueId]); // Only re-subscribe when leagueId changes

  /**
   * Normalise raw matches into a consistent {@link LeagueMatch} shape.
   *
   * Legacy documents store players as `homeTeam`/`awayTeam` (string names)
   * and scores as `homeScore`/`awayScore`. This memo converts them to the
   * current `playerA`/`playerB` ID-based format by looking up players by name.
   * If a player cannot be resolved, a deterministic `legacy_<name>` ID is
   * generated so that downstream components still have a stable key.
   */
  const matches = useMemo(() => {
    return rawMatches.map((match): LeagueMatch => {
      // Detect legacy format: uses homeTeam/awayTeam instead of playerA/playerB
      if (match.homeTeam && match.awayTeam && !match.playerA) {
        // Resolve player documents by case-insensitive name match
        const playerA = players.find(p => p.name.toLowerCase() === match.homeTeam.toLowerCase());
        const playerB = players.find(p => p.name.toLowerCase() === match.awayTeam.toLowerCase());

        // Fall back to a deterministic legacy ID if the player document is missing
        const playerAId = playerA?.id || `legacy_${match.homeTeam.replace(/\s/g, '_')}`;
        const playerBId = playerB?.id || `legacy_${match.awayTeam.replace(/\s/g, '_')}`;
        const scoreA = match.homeScore || 0;
        const scoreB = match.awayScore || 0;

        return {
          id: match.id,
          leagueId: match.leagueId,
          playerA: playerAId,
          playerAName: match.homeTeam,
          playerB: playerBId,
          playerBName: match.awayTeam,
          scoreA,
          scoreB,
          date: match.date,
          played: true,
          // Determine winner by comparing scores; null indicates a draw
          winner: scoreA > scoreB ? playerAId : scoreB > scoreA ? playerBId : null,
        };
      }
      // Document already uses the current schema -- pass through unchanged
      return match as LeagueMatch;
    });
  }, [rawMatches, players]);

  return { matches, loading, error };
}

/**
 * Subscribe to **active** leagues only, ordered newest-first.
 *
 * Identical to {@link useLeagues} but adds a `where('status', '==', 'active')`
 * filter. Useful for dashboards and dropdowns that should exclude completed or
 * archived leagues.
 *
 * @returns An object containing:
 *   - `leagues` - Array of active {@link League} documents.
 *   - `loading` - `true` until the first snapshot resolves.
 *   - `error`   - Populated on Firestore errors.
 */
export function useActiveLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Filter to only active leagues, newest first
    const q = query(
      collection(db, 'leagues'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const leaguesData: League[]= [];
        querySnapshot.forEach((doc) => {
          leaguesData.push({ id: doc.id, ...doc.data() } as League);
        });
        setLeagues(leaguesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching active leagues:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Detach listener on unmount
    return () => unsubscribe();
  }, []);

  return { leagues, loading, error };
}
