/**
 * Firebase Player Utilities
 *
 * CRUD operations and real-time subscriptions for player management
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  where,
  Timestamp,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Player, PlayerFormData, SeasonAchievements, calculateTier } from '@/types/player';
import { getActiveSeason } from './seasonUtils';

/**
 * Create a new player in Firestore
 */
export const createPlayer = async (
  playerData: PlayerFormData & {
    achievements?: {
      leagueWins: number;
      tournamentWins: number;
    }
  }
): Promise<string> => {
  try {
    const now = new Date();
    const leagueWins = playerData.achievements?.leagueWins || 0;
    const tournamentWins = playerData.achievements?.tournamentWins || 0;
    const totalTitles = leagueWins + tournamentWins;
    const tier = calculateTier(totalTitles);

    // Build achievements object without undefined values
    const achievements: any = {
      leagueWins,
      tournamentWins,
      totalTitles,
      tier
    };

    // Only add inductionDate if Hall of Fame eligible (Firebase doesn't allow undefined)
    if (totalTitles >= 1) {
      achievements.inductionDate = now.toISOString();
    }

    const docRef = await addDoc(collection(db, 'players'), {
      name: playerData.name,
      psnId: playerData.psnId.toLowerCase(), // Store PSN ID in lowercase for consistency
      avatar: playerData.avatar || null,
      achievements,
      createdAt: now,
      updatedAt: now
    });

    console.log('✅ Player created:', docRef.id);

    // Automatically add to P4P rankings at the bottom
    try {
      const rankingsCol = collection(db, 'rankings');
      const rankingsSnapshot = await getDocs(rankingsCol);

      // Find the current max rank
      let maxRank = 0;
      rankingsSnapshot.docs.forEach((doc) => {
        const rank = doc.data().rank || 0;
        if (rank > maxRank) maxRank = rank;
      });

      // Add player to rankings at the bottom (maxRank + 1)
      const newRank = maxRank + 1;
      await setDoc(doc(db, 'rankings', docRef.id), {
        memberId: docRef.id,
        name: playerData.name,
        rank: newRank,
        coolOff: '',
        wildCard: '',
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Added to P4P rankings at position ${newRank}`);
    } catch (error) {
      console.warn('⚠️ Could not add to P4P rankings:', error);
      // Don't throw - player creation succeeded, ranking addition is secondary
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating player:', error);
    throw error;
  }
};

/**
 * Get all players from Firestore
 */
export const getPlayers = async (): Promise<Player[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'players'), orderBy('createdAt', 'desc'))
    );

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        psnId: data.psnId,
        avatar: data.avatar || undefined,
        achievements: data.achievements,
        seasonAchievements: data.seasonAchievements || undefined,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
      } as Player;
    });
  } catch (error) {
    console.error('❌ Error getting players:', error);
    return [];
  }
};

/**
 * Get a single player by ID
 */
export const getPlayerById = async (playerId: string): Promise<Player | null> => {
  try {
    const docRef = doc(db, 'players', playerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        psnId: data.psnId,
        avatar: data.avatar || undefined,
        achievements: data.achievements,
        seasonAchievements: data.seasonAchievements || undefined,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
      } as Player;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting player by ID:', error);
    return null;
  }
};

/**
 * Update a player's information
 */
export const updatePlayer = async (
  playerId: string,
  updates: Partial<PlayerFormData> & {
    achievements?: {
      leagueWins?: number;
      tournamentWins?: number;
    }
  }
): Promise<void> => {
  try {
    const playerRef = doc(db, 'players', playerId);

    // Get current player data
    const currentPlayer = await getPlayerById(playerId);
    if (!currentPlayer) {
      throw new Error('Player not found');
    }

    // Calculate new achievements if provided
    let achievementUpdates = {};
    let newLeagueWins = currentPlayer.achievements.leagueWins;
    let newTournamentWins = currentPlayer.achievements.tournamentWins;

    if (updates.achievements) {
      newLeagueWins = updates.achievements.leagueWins ?? currentPlayer.achievements.leagueWins;
      newTournamentWins = updates.achievements.tournamentWins ?? currentPlayer.achievements.tournamentWins;
      const totalTitles = newLeagueWins + newTournamentWins;
      const tier = calculateTier(totalTitles);

      // Build achievements object without undefined values
      const achievements: any = {
        leagueWins: newLeagueWins,
        tournamentWins: newTournamentWins,
        totalTitles,
        tier
      };

      // Set induction date if reaching Hall of Fame for first time
      let inductionDate = currentPlayer.achievements.inductionDate;
      if (totalTitles >= 1 && !inductionDate) {
        inductionDate = new Date().toISOString();
      }

      // Only add inductionDate if it exists (Firebase doesn't allow undefined)
      if (inductionDate) {
        achievements.inductionDate = inductionDate;
      }

      achievementUpdates = { achievements };
    }

    // Build update object
    const updateData: any = {
      ...updates,
      ...achievementUpdates,
      updatedAt: new Date()
    };

    // Ensure PSN ID is lowercase if updated
    if (updateData.psnId) {
      updateData.psnId = updateData.psnId.toLowerCase();
    }

    // Remove undefined values and achievements field if present
    const cleanUpdates = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    delete cleanUpdates.achievements;
    if (achievementUpdates.hasOwnProperty('achievements')) {
      (cleanUpdates as any).achievements = (achievementUpdates as any).achievements;
    }

    await updateDoc(playerRef, cleanUpdates);
    console.log('✅ Player updated:', playerId);
  } catch (error) {
    console.error('❌ Error updating player:', error);
    throw error;
  }
};

/**
 * Delete a player from Firestore with cascade delete
 * Removes player from:
 * - Players collection
 * - P4P Rankings
 * - Future/upcoming leagues (not completed)
 * - Future/upcoming tournaments (not completed)
 * But keeps them in historical data (completed leagues, past matches)
 */
export const deletePlayer = async (playerId: string): Promise<void> => {
  try {
    console.log('🗑️ Starting cascade delete for player:', playerId);

    // 1. Delete from P4P Rankings (rankings collection)
    try {
      const rankingRef = doc(db, 'rankings', playerId);
      const rankingDoc = await getDoc(rankingRef);
      if (rankingDoc.exists()) {
        await deleteDoc(rankingRef);
        console.log('✅ Removed from P4P rankings');

        // Renumber remaining rankings to fix gaps
        const rankingsCol = collection(db, 'rankings');
        const rankingsSnapshot = await getDocs(query(rankingsCol, orderBy('rank', 'asc')));

        const batch = writeBatch(db);
        rankingsSnapshot.docs.forEach((rankDoc, index) => {
          const correctRank = index + 1;
          const currentRank = rankDoc.data().rank;
          if (currentRank !== correctRank) {
            batch.update(doc(db, 'rankings', rankDoc.id), {
              rank: correctRank,
              updatedAt: serverTimestamp()
            });
          }
        });

        await batch.commit();
        console.log('✅ Renumbered P4P rankings');
      }
    } catch (error) {
      console.warn('⚠️ Could not remove from rankings:', error);
    }

    // 2. Remove from future/upcoming leagues (not completed)
    try {
      const leaguesQuery = query(
        collection(db, 'leagues'),
        where('status', 'in', ['active', 'upcoming'])
      );
      const leaguesSnapshot = await getDocs(leaguesQuery);

      for (const leagueDoc of leaguesSnapshot.docs) {
        const leagueData = leagueDoc.data();
        if (leagueData.playerIds && leagueData.playerIds.includes(playerId)) {
          const updatedPlayerIds = leagueData.playerIds.filter((id: string) => id !== playerId);
          await updateDoc(doc(db, 'leagues', leagueDoc.id), {
            playerIds: updatedPlayerIds,
            updatedAt: serverTimestamp()
          });
          console.log(`✅ Removed from league: ${leagueData.name}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not remove from leagues:', error);
    }

    // 3. Remove from future/upcoming tournaments
    try {
      const tournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', 'in', ['upcoming'])
      );
      const tournamentsSnapshot = await getDocs(tournamentsQuery);

      for (const tournamentDoc of tournamentsSnapshot.docs) {
        // Remove from tournament_members collection
        const membersQuery = query(
          collection(db, 'tournament_members'),
          where('tournamentId', '==', tournamentDoc.id),
          where('playerId', '==', playerId)
        );
        const membersSnapshot = await getDocs(membersQuery);

        for (const memberDoc of membersSnapshot.docs) {
          await deleteDoc(doc(db, 'tournament_members', memberDoc.id));
          console.log(`✅ Removed from tournament: ${tournamentDoc.data().name}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not remove from tournaments:', error);
    }

    // 4. Delete the player from players collection
    await deleteDoc(doc(db, 'players', playerId));
    console.log('✅ Player deleted from players collection');

    console.log('✅ Cascade delete completed successfully');
  } catch (error) {
    console.error('❌ Error during cascade delete:', error);
    throw error;
  }
};

/**
 * Search players by name or PSN ID
 */
export const searchPlayers = async (searchQuery: string): Promise<Player[]> => {
  try {
    const allPlayers = await getPlayers();
    const lowerQuery = searchQuery.toLowerCase();

    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(lowerQuery) ||
      player.psnId.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('❌ Error searching players:', error);
    return [];
  }
};

/**
 * Get Hall of Fame members (1+ titles)
 */
export const getHallOfFameMembers = async (): Promise<Player[]> => {
  try {
    const allPlayers = await getPlayers();
    return allPlayers.filter(player => player.achievements.totalTitles >= 1);
  } catch (error) {
    console.error('❌ Error getting Hall of Fame members:', error);
    return [];
  }
};

/**
 * Get players by tier
 */
export const getPlayersByTier = async (
  tier: 'legend' | 'champion' | 'veteran'
): Promise<Player[]> => {
  try {
    const allPlayers = await getPlayers();
    return allPlayers.filter(player => player.achievements.tier === tier);
  } catch (error) {
    console.error('❌ Error getting players by tier:', error);
    return [];
  }
};

/**
 * Get all-time record holders
 */
export const getAllTimeRecords = async () => {
  try {
    const allPlayers = await getPlayers();

    if (allPlayers.length === 0) {
      return {
        mostLeagues: null,
        mostTournaments: null,
        mostTitles: null,
        currentChampion: null
      };
    }

    const sortedByLeagues = [...allPlayers].sort((a, b) =>
      b.achievements.leagueWins - a.achievements.leagueWins
    );

    const sortedByTournaments = [...allPlayers].sort((a, b) =>
      b.achievements.tournamentWins - a.achievements.tournamentWins
    );

    const sortedByTitles = [...allPlayers].sort((a, b) =>
      b.achievements.totalTitles - a.achievements.totalTitles
    );

    return {
      mostLeagues: sortedByLeagues[0],
      mostTournaments: sortedByTournaments[0],
      mostTitles: sortedByTitles[0],
      currentChampion: sortedByTitles[0] // In real app, could be from most recent tournament
    };
  } catch (error) {
    console.error('❌ Error getting all-time records:', error);
    return {
      mostLeagues: null,
      mostTournaments: null,
      mostTitles: null,
      currentChampion: null
    };
  }
};

/**
 * Increment player's league wins (global + per-season if seasonId provided)
 */
export const incrementLeagueWins = async (playerId: string, seasonId?: string): Promise<void> => {
  try {
    const player = await getPlayerById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const playerRef = doc(db, 'players', playerId);
    const batch = writeBatch(db);

    // Global achievements
    const newGlobalLeague = player.achievements.leagueWins + 1;
    const newGlobalTournament = player.achievements.tournamentWins;
    const newGlobalTotal = newGlobalLeague + newGlobalTournament;
    const newGlobalTier = calculateTier(newGlobalTotal);

    const globalAchievements: Record<string, unknown> = {
      leagueWins: newGlobalLeague,
      tournamentWins: newGlobalTournament,
      totalTitles: newGlobalTotal,
      tier: newGlobalTier,
    };

    let globalInduction = player.achievements.inductionDate;
    if (newGlobalTotal >= 1 && !globalInduction) {
      globalInduction = new Date().toISOString();
    }
    if (globalInduction) {
      globalAchievements.inductionDate = globalInduction;
    }

    const updateData: Record<string, unknown> = {
      achievements: globalAchievements,
      updatedAt: new Date(),
    };

    // Per-season achievements (same batch)
    if (seasonId) {
      const current = player.seasonAchievements?.[seasonId];
      const newLeagueWins = (current?.leagueWins ?? 0) + 1;
      const newTournamentWins = current?.tournamentWins ?? 0;
      const newTotalTitles = newLeagueWins + newTournamentWins;
      const newTier = calculateTier(newTotalTitles);

      const seasonAchievement: SeasonAchievements = {
        leagueWins: newLeagueWins,
        tournamentWins: newTournamentWins,
        totalTitles: newTotalTitles,
        tier: newTier,
      };

      if (newTotalTitles >= 1 && !current?.inductionDate) {
        seasonAchievement.inductionDate = new Date().toISOString();
      } else if (current?.inductionDate) {
        seasonAchievement.inductionDate = current.inductionDate;
      }

      updateData[`seasonAchievements.${seasonId}`] = seasonAchievement;
    }

    batch.update(playerRef, updateData);
    await batch.commit();

    console.log('✅ Incremented league wins for player:', playerId);
  } catch (error) {
    console.error('❌ Error incrementing league wins:', error);
    throw error;
  }
};

/**
 * Increment player's tournament wins (global + per-season if seasonId provided)
 * Uses a single batch write for atomicity — both global and season data update together or not at all.
 */
export const incrementTournamentWins = async (playerId: string, seasonId?: string): Promise<void> => {
  try {
    const player = await getPlayerById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const playerRef = doc(db, 'players', playerId);
    const batch = writeBatch(db);

    // Global achievements
    const newGlobalLeague = player.achievements.leagueWins;
    const newGlobalTournament = player.achievements.tournamentWins + 1;
    const newGlobalTotal = newGlobalLeague + newGlobalTournament;
    const newGlobalTier = calculateTier(newGlobalTotal);

    const globalAchievements: Record<string, unknown> = {
      leagueWins: newGlobalLeague,
      tournamentWins: newGlobalTournament,
      totalTitles: newGlobalTotal,
      tier: newGlobalTier,
    };

    let globalInduction = player.achievements.inductionDate;
    if (newGlobalTotal >= 1 && !globalInduction) {
      globalInduction = new Date().toISOString();
    }
    if (globalInduction) {
      globalAchievements.inductionDate = globalInduction;
    }

    const updateData: Record<string, unknown> = {
      achievements: globalAchievements,
      updatedAt: new Date(),
    };

    // Per-season achievements (same batch)
    if (seasonId) {
      const current = player.seasonAchievements?.[seasonId];
      const newLeagueWins = current?.leagueWins ?? 0;
      const newTournamentWins = (current?.tournamentWins ?? 0) + 1;
      const newTotalTitles = newLeagueWins + newTournamentWins;
      const newTier = calculateTier(newTotalTitles);

      const seasonAchievement: SeasonAchievements = {
        leagueWins: newLeagueWins,
        tournamentWins: newTournamentWins,
        totalTitles: newTotalTitles,
        tier: newTier,
      };

      if (newTotalTitles >= 1 && !current?.inductionDate) {
        seasonAchievement.inductionDate = new Date().toISOString();
      } else if (current?.inductionDate) {
        seasonAchievement.inductionDate = current.inductionDate;
      }

      updateData[`seasonAchievements.${seasonId}`] = seasonAchievement;
    }

    batch.update(playerRef, updateData);
    await batch.commit();

    console.log('✅ Incremented tournament wins for player:', playerId);
  } catch (error) {
    console.error('❌ Error incrementing tournament wins:', error);
    throw error;
  }
};

/**
 * Migration: Copy each player's current global achievements into a target season.
 *
 * Since all existing achievements happened during the first season (e.g., FC 26),
 * this simply mirrors global achievements → seasonAchievements[seasonId].
 * Only copies players who have at least 1 title (Hall of Fame members).
 *
 * Safe to run multiple times — it overwrites the season entry each time.
 */
export const migrateSeasonAchievements = async (targetSeasonId?: string): Promise<{
  playersSynced: number;
  errors: string[];
}> => {
  const result = {
    playersSynced: 0,
    errors: [] as string[],
  };

  try {
    // If no target season provided, find the active season
    let seasonId = targetSeasonId;
    if (!seasonId) {
      const { getActiveSeason } = await import('./seasonUtils');
      const activeSeason = await getActiveSeason();
      if (!activeSeason?.id) {
        result.errors.push('No active season found. Please provide a target season ID.');
        return result;
      }
      seasonId = activeSeason.id;
    }

    // Get all players
    const allPlayers = await getPlayers();

    // For each player with at least 1 title, copy global achievements to the season
    for (const player of allPlayers) {
      if (!player.id || player.achievements.totalTitles < 1) continue;

      try {
        const playerRef = doc(db, 'players', player.id);
        const seasonAchievement: SeasonAchievements = {
          leagueWins: player.achievements.leagueWins,
          tournamentWins: player.achievements.tournamentWins,
          totalTitles: player.achievements.totalTitles,
          tier: player.achievements.tier,
          inductionDate: player.achievements.inductionDate || new Date().toISOString(),
        };

        await updateDoc(playerRef, {
          [`seasonAchievements.${seasonId}`]: seasonAchievement,
          updatedAt: new Date(),
        });

        result.playersSynced++;
      } catch (err) {
        result.errors.push(`Player "${player.name}": ${err}`);
      }
    }

    console.log(`✅ Season achievements synced for ${result.playersSynced} players to season ${seasonId}`);
    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
};

/**
 * Set a player's achievements for a specific season and recompute the global total.
 * This is the authoritative way to edit per-season wins — global is always derived from all seasons.
 */
export const setSeasonAchievements = async (
  playerId: string,
  seasonId: string,
  leagueWins: number,
  tournamentWins: number
): Promise<void> => {
  const player = await getPlayerById(playerId);
  if (!player) throw new Error('Player not found');

  const allSeasonAchs = { ...(player.seasonAchievements ?? {}) };
  const current = allSeasonAchs[seasonId];
  const totalTitles = leagueWins + tournamentWins;

  allSeasonAchs[seasonId] = {
    leagueWins,
    tournamentWins,
    totalTitles,
    tier: calculateTier(totalTitles),
    ...(current?.inductionDate
      ? { inductionDate: current.inductionDate }
      : totalTitles >= 1 ? { inductionDate: new Date().toISOString() } : {}),
  };

  // Recompute global as sum of all seasons
  let globalLeague = 0, globalTournament = 0;
  for (const ach of Object.values(allSeasonAchs)) {
    globalLeague += ach.leagueWins;
    globalTournament += ach.tournamentWins;
  }
  const globalTotal = globalLeague + globalTournament;

  const playerRef = doc(db, 'players', playerId);

  // Build global achievements; use dot-notation updates so inductionDate
  // can be independently set or deleted without overwriting the whole map.
  const globalFieldUpdates: Record<string, any> = {
    'achievements.leagueWins': globalLeague,
    'achievements.tournamentWins': globalTournament,
    'achievements.totalTitles': globalTotal,
    'achievements.tier': calculateTier(globalTotal),
  };

  if (globalTotal >= 1) {
    // Preserve existing induction date; set a new one if there isn't one yet
    globalFieldUpdates['achievements.inductionDate'] =
      player.achievements.inductionDate ?? new Date().toISOString();
  } else {
    // All titles removed — clear induction date so the player leaves the HOF
    globalFieldUpdates['achievements.inductionDate'] = deleteField();
  }

  await updateDoc(playerRef, {
    [`seasonAchievements.${seasonId}`]: allSeasonAchs[seasonId],
    ...globalFieldUpdates,
    updatedAt: new Date(),
  });

  console.log(`✅ Set season achievements for player ${playerId} in season ${seasonId}`);
};

/**
 * Remove a player's season achievements for a specific season.
 * Deletes the seasonAchievements[seasonId] entry from the player document.
 */
export const removePlayerSeasonAchievements = async (playerId: string, seasonId: string): Promise<void> => {
  try {
    const playerRef = doc(db, 'players', playerId);
    await updateDoc(playerRef, {
      [`seasonAchievements.${seasonId}`]: deleteField(),
      updatedAt: new Date(),
    });
    console.log(`✅ Removed season achievements for player ${playerId} in season ${seasonId}`);
  } catch (error) {
    console.error('❌ Error removing season achievements:', error);
    throw error;
  }
};

/**
 * Real-time subscription to all players
 */
export const subscribeToPlayers = (
  callback: (players: Player[]) => void
): (() => void) => {
  const q = query(collection(db, 'players'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        psnId: data.psnId,
        avatar: data.avatar || undefined,
        achievements: data.achievements,
        seasonAchievements: data.seasonAchievements || undefined,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
      } as Player;
    });

    callback(players);
  }, (error) => {
    console.error('❌ Error in players subscription:', error);
  });
};

/**
 * Real-time subscription to a single player
 */
export const subscribeToPlayerById = (
  playerId: string,
  callback: (player: Player | null) => void
): (() => void) => {
  const playerRef = doc(db, 'players', playerId);

  return onSnapshot(playerRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const player: Player = {
        id: snapshot.id,
        name: data.name,
        psnId: data.psnId,
        avatar: data.avatar || undefined,
        achievements: data.achievements,
        seasonAchievements: data.seasonAchievements || undefined,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
      };
      callback(player);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('❌ Error in player subscription:', error);
    callback(null);
  });
};

/**
 * Real-time subscription to Hall of Fame members
 */
export const subscribeToHallOfFame = (
  callback: (players: Player[]) => void
): (() => void) => {
  const q = query(collection(db, 'players'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const allPlayers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        psnId: data.psnId,
        avatar: data.avatar || undefined,
        achievements: data.achievements,
        seasonAchievements: data.seasonAchievements || undefined,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
      } as Player;
    });

    // Filter for Hall of Fame members (1+ titles)
    const hofMembers = allPlayers.filter(player => player.achievements.totalTitles >= 1);
    callback(hofMembers);
  }, (error) => {
    console.error('❌ Error in Hall of Fame subscription:', error);
  });
};
