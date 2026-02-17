/**
 * Season Firebase Utilities
 *
 * Functions for managing Seasons in Firestore.
 * Each season wraps a game cycle (e.g., FC 26) and contains
 * leagues, tournaments, and rankings.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Season, SeasonFormData } from '@/types/season';

const SEASONS_COLLECTION = 'seasons';

/**
 * Generate a URL-safe slug from a string
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Validate that a slug is URL-safe
 */
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

/**
 * Check if a slug is already taken
 */
export const isSlugUnique = async (slug: string, excludeId?: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, SEASONS_COLLECTION),
      where('slug', '==', slug)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true;

    // If editing, allow the same slug for the same document
    if (excludeId) {
      return snapshot.docs.every((doc) => doc.id === excludeId);
    }

    return false;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    throw error;
  }
};

/**
 * Create a new season
 */
export const createSeason = async (formData: SeasonFormData): Promise<string> => {
  try {
    // Validate slug
    if (!isValidSlug(formData.slug)) {
      throw new Error('Invalid slug format. Use only lowercase letters, numbers, and hyphens.');
    }

    // Check slug uniqueness
    const unique = await isSlugUnique(formData.slug);
    if (!unique) {
      throw new Error(`Slug "${formData.slug}" is already taken. Please choose a different one.`);
    }

    const seasonData: Omit<Season, 'id'> = {
      name: formData.name,
      slug: formData.slug,
      gameVersion: formData.gameVersion,
      status: formData.status,
      startDate: formData.startDate
        ? Timestamp.fromDate(new Date(formData.startDate))
        : serverTimestamp(),
      description: formData.description || '',
      stats: {
        totalLeagues: 0,
        totalTournaments: 0,
        totalMatches: 0,
        activePlayers: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, SEASONS_COLLECTION), seasonData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating season:', error);
    throw error;
  }
};

/**
 * Get all seasons ordered by startDate descending
 */
export const getAllSeasons = async (): Promise<Season[]> => {
  try {
    const q = query(
      collection(db, SEASONS_COLLECTION),
      orderBy('startDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Season[];
  } catch (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }
};

/**
 * Get a season by its slug (for URL routing)
 */
export const getSeasonBySlug = async (slug: string): Promise<Season | null> => {
  try {
    const q = query(
      collection(db, SEASONS_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Season;
  } catch (error) {
    console.error('Error fetching season by slug:', error);
    throw error;
  }
};

/**
 * Get the currently active season
 */
export const getActiveSeason = async (): Promise<Season | null> => {
  try {
    const q = query(
      collection(db, SEASONS_COLLECTION),
      where('status', '==', 'active'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Season;
  } catch (error) {
    console.error('Error fetching active season:', error);
    throw error;
  }
};

/**
 * Async lock to prevent concurrent activateSeason calls
 */
let activateSeasonLock = false;

/**
 * Activate a season — optionally completes any currently active season.
 * Uses an async lock to prevent concurrent calls.
 *
 * @param seasonId - The season to activate
 * @param completePrevious - Whether to auto-complete the currently active season (default: true)
 */
export const activateSeason = async (seasonId: string, completePrevious = true): Promise<{ previousSeasonName?: string }> => {
  if (activateSeasonLock) {
    throw new Error('Season activation already in progress');
  }
  activateSeasonLock = true;

  try {
    const result: { previousSeasonName?: string } = {};

    // Find and deactivate the currently active season
    const currentActive = await getActiveSeason();
    if (currentActive && currentActive.id && currentActive.id !== seasonId) {
      if (completePrevious) {
        await updateDoc(doc(db, SEASONS_COLLECTION, currentActive.id), {
          status: 'completed',
          endDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        result.previousSeasonName = currentActive.name;
      } else {
        throw new Error(`Cannot activate: "${currentActive.name}" is still active. Complete it first.`);
      }
    }

    // Activate the target season
    await updateDoc(doc(db, SEASONS_COLLECTION, seasonId), {
      status: 'active',
      updatedAt: serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error('Error activating season:', error);
    throw error;
  } finally {
    activateSeasonLock = false;
  }
};

/**
 * Complete a season — sets status to completed and stamps endDate
 */
export const completeSeason = async (seasonId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, SEASONS_COLLECTION, seasonId), {
      status: 'completed',
      endDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error completing season:', error);
    throw error;
  }
};

/**
 * Update a season's data
 */
export const updateSeason = async (
  seasonId: string,
  updates: Partial<Season>
): Promise<void> => {
  try {
    await updateDoc(doc(db, SEASONS_COLLECTION, seasonId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating season:', error);
    throw error;
  }
};

/**
 * Subscribe to all seasons in real-time
 */
export const subscribeToSeasons = (
  callback: (seasons: Season[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, SEASONS_COLLECTION),
    orderBy('startDate', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const seasons = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Season[];
      callback(seasons);
    },
    (error) => {
      console.error('Error subscribing to seasons:', error);
      onError?.(error as Error);
    }
  );
};

/**
 * Delete a season and clean up linked data:
 * - Removes seasonId from linked leagues and tournaments
 * - Deletes the per-season rankings subcollection
 * - Deletes the season document
 */
export const deleteSeason = async (seasonId: string): Promise<void> => {
  try {
    // 1. Remove seasonId from linked leagues (use deleteField instead of empty string)
    const leaguesSnap = await getDocs(
      query(collection(db, 'leagues'), where('seasonId', '==', seasonId))
    );
    if (!leaguesSnap.empty) {
      const batch = writeBatch(db);
      leaguesSnap.docs.forEach((d) => {
        batch.update(doc(db, 'leagues', d.id), { seasonId: deleteField() });
      });
      await batch.commit();
    }

    // 2. Remove seasonId from linked tournaments (use deleteField instead of empty string)
    const tournamentsSnap = await getDocs(
      query(collection(db, 'tournaments'), where('seasonId', '==', seasonId))
    );
    if (!tournamentsSnap.empty) {
      const batch = writeBatch(db);
      tournamentsSnap.docs.forEach((d) => {
        batch.update(doc(db, 'tournaments', d.id), { seasonId: deleteField() });
      });
      await batch.commit();
    }

    // 3. Clean up seasonAchievements from all player documents
    const playersSnap = await getDocs(collection(db, 'players'));
    const playersToClean = playersSnap.docs.filter((d) => {
      const data = d.data();
      return data.seasonAchievements && data.seasonAchievements[seasonId];
    });
    if (playersToClean.length > 0) {
      const batch = writeBatch(db);
      playersToClean.forEach((d) => {
        batch.update(doc(db, 'players', d.id), {
          [`seasonAchievements.${seasonId}`]: deleteField(),
          updatedAt: new Date(),
        });
      });
      await batch.commit();
    }

    // 4. Delete rankings subcollection
    const rankingsSnap = await getDocs(
      collection(db, SEASONS_COLLECTION, seasonId, 'rankings')
    );
    if (!rankingsSnap.empty) {
      const batch = writeBatch(db);
      rankingsSnap.docs.forEach((d) => {
        batch.delete(doc(db, SEASONS_COLLECTION, seasonId, 'rankings', d.id));
      });
      await batch.commit();
    }

    // 5. Delete the season document
    await deleteDoc(doc(db, SEASONS_COLLECTION, seasonId));
  } catch (error) {
    console.error('Error deleting season:', error);
    throw error;
  }
};

/**
 * Subscribe to a single season by slug in real-time
 */
export const subscribeToSeasonBySlug = (
  slug: string,
  callback: (season: Season | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, SEASONS_COLLECTION),
    where('slug', '==', slug),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      const doc = snapshot.docs[0];
      callback({ id: doc.id, ...doc.data() } as Season);
    },
    (error) => {
      console.error('Error subscribing to season:', error);
      onError?.(error as Error);
    }
  );
};
