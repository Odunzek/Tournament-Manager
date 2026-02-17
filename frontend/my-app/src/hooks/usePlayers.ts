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
 * Hook to subscribe to Hall of Fame members with real-time updates.
 * Optionally filter by season — when seasonId is provided, filters by
 * per-season achievements instead of global achievements.
 */
export function useHallOfFame(seasonId?: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPlayers((allPlayers) => {
      let hofMembers: Player[];

      if (seasonId) {
        hofMembers = allPlayers.filter(
          (p) => (p.seasonAchievements?.[seasonId]?.totalTitles ?? 0) >= 1
        );
      } else {
        hofMembers = allPlayers.filter(
          (p) => p.achievements.totalTitles >= 1
        );
      }

      setPlayers(hofMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [seasonId]);

  const getAchievements = (p: Player) =>
    seasonId ? p.seasonAchievements?.[seasonId] : p.achievements;

  const legends = players.filter((p) => getAchievements(p)?.tier === 'legend');
  const champions = players.filter((p) => getAchievements(p)?.tier === 'champion');
  const veterans = players.filter((p) => getAchievements(p)?.tier === 'veteran');

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
 * Hook to get records for a specific season (or all-time if no seasonId).
 * Uses real-time subscription unlike useAllTimeRecords.
 */
export function useSeasonRecords(seasonId?: string | null) {
  const [records, setRecords] = useState<{
    mostLeagues: Player | null;
    mostTournaments: Player | null;
    mostTitles: Player | null;
    currentChampion: Player | null;
  }>({
    mostLeagues: null,
    mostTournaments: null,
    mostTitles: null,
    currentChampion: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToPlayers((allPlayers) => {
      if (allPlayers.length === 0) {
        setRecords({ mostLeagues: null, mostTournaments: null, mostTitles: null, currentChampion: null });
        setLoading(false);
        return;
      }

      const getAchievements = (p: Player) =>
        seasonId ? p.seasonAchievements?.[seasonId] : p.achievements;

      const relevantPlayers = allPlayers.filter(
        (p) => (getAchievements(p)?.totalTitles ?? 0) > 0
      );

      if (relevantPlayers.length === 0) {
        setRecords({ mostLeagues: null, mostTournaments: null, mostTitles: null, currentChampion: null });
        setLoading(false);
        return;
      }

      const sortedByLeagues = [...relevantPlayers].sort(
        (a, b) => (getAchievements(b)?.leagueWins ?? 0) - (getAchievements(a)?.leagueWins ?? 0)
      );
      const sortedByTournaments = [...relevantPlayers].sort(
        (a, b) => (getAchievements(b)?.tournamentWins ?? 0) - (getAchievements(a)?.tournamentWins ?? 0)
      );
      const sortedByTitles = [...relevantPlayers].sort(
        (a, b) => (getAchievements(b)?.totalTitles ?? 0) - (getAchievements(a)?.totalTitles ?? 0)
      );

      setRecords({
        mostLeagues: sortedByLeagues[0],
        mostTournaments: sortedByTournaments[0],
        mostTitles: sortedByTitles[0],
        currentChampion: sortedByTitles[0],
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [seasonId]);

  return { records, loading };
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
