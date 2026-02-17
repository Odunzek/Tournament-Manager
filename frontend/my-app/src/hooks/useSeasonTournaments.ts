import { useState, useEffect } from 'react';
import { Tournament } from '@/lib/tournamentUtils';
import { subscribeToTournamentsBySeason } from '@/lib/seasonIntegrationUtils';

/**
 * Real-time hook for tournaments belonging to a specific season.
 */
export function useSeasonTournaments(seasonId: string | undefined) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!seasonId) {
      setTournaments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const unsubscribe = subscribeToTournamentsBySeason(seasonId, (data) => {
        setTournaments(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [seasonId]);

  return { tournaments, loading, error };
}
