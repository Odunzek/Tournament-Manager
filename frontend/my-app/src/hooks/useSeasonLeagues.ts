import { useState, useEffect } from 'react';
import { League } from '@/types/league';
import { subscribeToLeaguesBySeason } from '@/lib/seasonIntegrationUtils';

/**
 * Real-time hook for leagues belonging to a specific season.
 */
export function useSeasonLeagues(seasonId: string | undefined) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!seasonId) {
      setLeagues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const unsubscribe = subscribeToLeaguesBySeason(seasonId, (data) => {
        setLeagues(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [seasonId]);

  return { leagues, loading, error };
}
