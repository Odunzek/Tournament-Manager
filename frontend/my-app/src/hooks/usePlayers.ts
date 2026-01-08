/**
 * React Hooks for Player Management
 *
 * Custom hooks for managing player data with Firebase real-time updates
 */

import { useState, useEffect } from 'react';
import { Player } from '@/types/player';
import {
  subscribeToPlayers,
  subscribeToPlayerById,
  subscribeToHallOfFame,
  getAllTimeRecords,
  getPlayersByTier
} from '@/lib/playerUtils';

/**
 * Hook to subscribe to all players with real-time updates
 */
export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { players, loading, error };
}

/**
 * Hook to subscribe to a single player by ID with real-time updates
 */
export function usePlayer(playerId: string | null) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPlayerById(playerId, (updatedPlayer) => {
      setPlayer(updatedPlayer);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [playerId]);

  return { player, loading, error };
}

/**
 * Hook to subscribe to Hall of Fame members with real-time updates
 */
export function useHallOfFame() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToHallOfFame((updatedPlayers) => {
      setPlayers(updatedPlayers);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Separate by tiers
  const legends = players.filter(p => p.achievements.tier === 'legend');
  const champions = players.filter(p => p.achievements.tier === 'champion');
  const veterans = players.filter(p => p.achievements.tier === 'veteran');

  return {
    players,
    legends,
    champions,
    veterans,
    loading,
    error
  };
}

/**
 * Hook to get all-time records
 */
export function useAllTimeRecords() {
  const [records, setRecords] = useState<{
    mostLeagues: Player | null;
    mostTournaments: Player | null;
    mostTitles: Player | null;
    currentChampion: Player | null;
  }>({
    mostLeagues: null,
    mostTournaments: null,
    mostTitles: null,
    currentChampion: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        const allTimeRecords = await getAllTimeRecords();

        if (mounted) {
          setRecords(allTimeRecords);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchRecords();

    return () => {
      mounted = false;
    };
  }, []);

  return { records, loading, error };
}

/**
 * Hook to get players by tier
 */
export function usePlayersByTier(tier: 'legend' | 'champion' | 'veteran' | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tier) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const tierPlayers = await getPlayersByTier(tier);

        if (mounted) {
          setPlayers(tierPlayers);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchPlayers();

    return () => {
      mounted = false;
    };
  }, [tier]);

  return { players, loading, error };
}
