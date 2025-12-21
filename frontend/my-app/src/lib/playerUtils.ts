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
  query,
  orderBy,
  onSnapshot,
  getDoc,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Player, PlayerFormData, calculateTier } from '@/types/player';

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
    if (totalTitles >= 3) {
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
    if (updates.achievements) {
      const leagueWins = updates.achievements.leagueWins ?? currentPlayer.achievements.leagueWins;
      const tournamentWins = updates.achievements.tournamentWins ?? currentPlayer.achievements.tournamentWins;
      const totalTitles = leagueWins + tournamentWins;
      const tier = calculateTier(totalTitles);

      // Build achievements object without undefined values
      const achievements: any = {
        leagueWins,
        tournamentWins,
        totalTitles,
        tier
      };

      // Set induction date if reaching Hall of Fame for first time
      let inductionDate = currentPlayer.achievements.inductionDate;
      if (totalTitles >= 3 && !inductionDate) {
        inductionDate = new Date().toISOString();
      }

      // Only add inductionDate if it exists (Firebase doesn't allow undefined)
      if (inductionDate) {
        achievements.inductionDate = inductionDate;
      }

      achievementUpdates = {
        achievements
      };
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
 * Delete a player from Firestore
 */
export const deletePlayer = async (playerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'players', playerId));
    console.log('✅ Player deleted:', playerId);
  } catch (error) {
    console.error('❌ Error deleting player:', error);
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
 * Get Hall of Fame members (3+ titles)
 */
export const getHallOfFameMembers = async (): Promise<Player[]> => {
  try {
    const allPlayers = await getPlayers();
    return allPlayers.filter(player => player.achievements.totalTitles >= 3);
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
 * Increment player's league wins
 */
export const incrementLeagueWins = async (playerId: string): Promise<void> => {
  try {
    const player = await getPlayerById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    await updatePlayer(playerId, {
      achievements: {
        leagueWins: player.achievements.leagueWins + 1,
        tournamentWins: player.achievements.tournamentWins
      }
    });

    console.log('✅ Incremented league wins for player:', playerId);
  } catch (error) {
    console.error('❌ Error incrementing league wins:', error);
    throw error;
  }
};

/**
 * Increment player's tournament wins
 */
export const incrementTournamentWins = async (playerId: string): Promise<void> => {
  try {
    const player = await getPlayerById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    await updatePlayer(playerId, {
      achievements: {
        leagueWins: player.achievements.leagueWins,
        tournamentWins: player.achievements.tournamentWins + 1
      }
    });

    console.log('✅ Incremented tournament wins for player:', playerId);
  } catch (error) {
    console.error('❌ Error incrementing tournament wins:', error);
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
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
      } as Player;
    });

    // Filter for Hall of Fame members (3+ titles)
    const hofMembers = allPlayers.filter(player => player.achievements.totalTitles >= 3);
    callback(hofMembers);
  }, (error) => {
    console.error('❌ Error in Hall of Fame subscription:', error);
  });
};
