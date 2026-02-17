/**
 * React Hooks for Season Data
 *
 * Real-time Firebase hooks for seasons
 */

import { useState, useEffect } from 'react';
import { Season } from '@/types/season';
import { subscribeToSeasons, subscribeToSeasonBySlug } from '@/lib/seasonUtils';

/**
 * Hook to fetch all seasons in real-time
 */
export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSeasons(
      (seasonsData) => {
        setSeasons(seasonsData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { seasons, loading, error };
}

/**
 * Hook to fetch a single season by slug in real-time
 */
export function useSeasonBySlug(slug: string | null) {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setSeason(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToSeasonBySlug(
      slug,
      (seasonData) => {
        setSeason(seasonData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [slug]);

  return { season, loading, error };
}
