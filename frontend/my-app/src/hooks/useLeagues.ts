/**
 * React Hooks for League Data
 *
 * Real-time Firebase hooks for leagues and matches
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { League, LeagueMatch } from '@/types/league';
import { usePlayers } from './usePlayers';

/**
 * Hook to fetch all leagues in real-time
 */
export function useLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'leagues'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
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

    return () => unsubscribe();
  }, []);

  return { leagues, loading, error };
}

/**
 * Hook to fetch a single league by ID in real-time
 */
export function useLeague(leagueId: string | null) {
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setLeague(null);
      setLoading(false);
      return;
    }

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

    return () => unsubscribe();
  }, [leagueId]);

  return { league, loading, error };
}

/**
 * Hook to fetch all matches for a league in real-time
 * Checks both new (leagueMatches) and old (matches) collections
 */
export function useLeagueMatches(leagueId: string | null) {
  const [rawMatches, setRawMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { players } = usePlayers();

  // Subscribe to matches (without transformation)
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

    const checkAndUpdate = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Both queries completed
        const allMatches = [...newMatches, ...oldMatches];

        // Sort manually by date
        allMatches.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(a.date);
          const dateB = b.date?.toDate?.() || new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setRawMatches(allMatches);
        setLoading(false);
      }
    };
// Subscribe to new collection (leagueMatches)
    // Subscribe to new collection (leagueMatches)
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

    // Subscribe to old collection (matches)
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

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [leagueId]); // Only re-subscribe when leagueId changes

  // Transform matches in a separate effect that depends on both rawMatches and players
  const matches = useMemo(() => {
    return rawMatches.map((match): LeagueMatch => {
      // Check if this is old format (has homeTeam/awayTeam instead of playerA/playerB)
      if (match.homeTeam && match.awayTeam && !match.playerA) {
        // Old format - transform it
        const playerA = players.find(p => p.name.toLowerCase() === match.homeTeam.toLowerCase());
        const playerB = players.find(p => p.name.toLowerCase() === match.awayTeam.toLowerCase());

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
          winner: scoreA > scoreB ? playerAId : scoreB > scoreA ? playerBId : null,
        };
      }
      // Already new format
      return match as LeagueMatch;
    });
  }, [rawMatches, players]);

  return { matches, loading, error };
}

/**
 * Hook to fetch active leagues only
 */
export function useActiveLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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

    return () => unsubscribe();
  }, []);

  return { leagues, loading, error };
}
