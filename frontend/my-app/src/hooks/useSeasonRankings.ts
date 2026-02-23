import { useState, useEffect } from 'react';
import { RankingEntry } from '@/lib/rankingUtils';
import { subscribeToSeasonRankings } from '@/lib/seasonIntegrationUtils';

/**
 * Real-time hook for per-season rankings subcollection.
 */
export function useSeasonRankings(seasonId: string | undefined) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seasonId) {
      setRankings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSeasonRankings(seasonId, (data) => {
      setRankings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [seasonId]);

  return { rankings, loading };
}
