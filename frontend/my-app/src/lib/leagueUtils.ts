/**
 * League Firebase Utilities
 *
 * Functions for managing 1v1 FIFA Leagues in Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { League, LeagueMatch, LeaguePlayer, WinStreak } from '@/types/league';
import { Player } from '@/types/player';

const LEAGUES_COLLECTION = 'leagues';
const MATCHES_COLLECTION = 'leagueMatches';

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
export const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }
  try {
    return new Date(timestamp);
  } catch {
    return new Date();
  }
};

/**
 * Create a new league
 */
export const createLeague = async (leagueData: Omit<League, 'id'>): Promise<string> => {
  try {
    const leagueRef = await addDoc(collection(db, LEAGUES_COLLECTION), {
      ...leagueData,
      matchesPlayed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return leagueRef.id;
  } catch (error) {
    console.error('Error creating league:', error);
    throw error;
  }
};

/**
 * Get all leagues
 */
export const getAllLeagues = async (): Promise<League[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, LEAGUES_COLLECTION), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as League[];
  } catch (error) {
    console.error('Error fetching leagues:', error);
    throw error;
  }
};

/**
 * Get a single league by ID
 */
export const getLeagueById = async (leagueId: string): Promise<League | null> => {
  try {
    const docRef = doc(db, LEAGUES_COLLECTION, leagueId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as League;
    }
    return null;
  } catch (error) {
    console.error('Error fetching league:', error);
    throw error;
  }
};

/**
 * Update league
 */
export const updateLeague = async (
  leagueId: string,
  updates: Partial<League>
): Promise<void> => {
  try {
    const docRef = doc(db, LEAGUES_COLLECTION, leagueId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating league:', error);
    throw error;
  }
};

/**
 * Delete league
 */
export const deleteLeague = async (leagueId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, LEAGUES_COLLECTION, leagueId));
  } catch (error) {
    console.error('Error deleting league:', error);
    throw error;
  }
};

/**
 * Add players to an existing league
 * Recalculates total matches based on new player count
 */
export const addPlayersToLeague = async (
  leagueId: string,
  newPlayerIds: string[]
): Promise<void> => {
  try {
    const league = await getLeagueById(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // Combine existing and new player IDs, removing duplicates
    const currentPlayerIds = league.playerIds || [];
    const combinedPlayerIds = [...new Set([...currentPlayerIds, ...newPlayerIds])];

    // Calculate new total matches (round-robin: n(n-1)/2)
    const numPlayers = combinedPlayerIds.length;
    const totalMatches = (numPlayers * (numPlayers - 1)) / 2;

    // Update league
    await updateLeague(leagueId, {
      playerIds: combinedPlayerIds,
      totalMatches,
    });
  } catch (error) {
    console.error('Error adding players to league:', error);
    throw error;
  }
};

/**
 * Get all matches for a league
 */
export const getLeagueMatches = async (leagueId: string): Promise<LeagueMatch[]> => {
  try {
    // Try new collection name first
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, MATCHES_COLLECTION),
          where('leagueId', '==', leagueId),
          orderBy('date', 'desc')
        )
      );

      if (querySnapshot.docs.length > 0) {
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LeagueMatch[];
      }
    } catch (indexError) {
      console.log('Index not ready or collection not found, trying alternative...');
    }

    // Try old collection name (matches without orderBy)
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'matches'),
          where('leagueId', '==', leagueId)
        )
      );

      if (querySnapshot.docs.length > 0) {
        const matches = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LeagueMatch[];

        // Sort manually if no orderBy available
        return matches.sort((a, b) => {
          const dateA = convertTimestamp(a.date).getTime();
          const dateB = convertTimestamp(b.date).getTime();
          return dateB - dateA;
        });
      }
    } catch (oldError) {
      console.log('Old collection not found either');
    }

    // Return empty array if no matches found
    return [];
  } catch (error) {
    console.error('Error fetching league matches:', error);
    return [];
  }
};

/**
 * Record a single match
 */
export const recordMatch = async (matchData: Omit<LeagueMatch, 'id'>): Promise<string> => {
  try {
    // Determine winner
    let winner: string | null = null;
    if (matchData.scoreA > matchData.scoreB) {
      winner = matchData.playerA;
    } else if (matchData.scoreB > matchData.scoreA) {
      winner = matchData.playerB;
    }

    const matchRef = await addDoc(collection(db, MATCHES_COLLECTION), {
      ...matchData,
      winner,
      played: true,
      date: matchData.date || Timestamp.now(),
    });

    // Update league match count, and bump totalMatches if exceeded
    const league = await getLeagueById(matchData.leagueId);
    if (league) {
      const newMatchesPlayed = (league.matchesPlayed || 0) + 1;
      const updates: Record<string, number> = { matchesPlayed: newMatchesPlayed };
      if (newMatchesPlayed > (league.totalMatches || 0)) {
        updates.totalMatches = newMatchesPlayed;
      }
      await updateLeague(matchData.leagueId, updates);
    }

    return matchRef.id;
  } catch (error) {
    console.error('Error recording match:', error);
    throw error;
  }
};

/**
 * Record multiple matches (bulk)
 */
export const recordBulkMatches = async (
  matches: Omit<LeagueMatch, 'id'>[]
): Promise<string[]> => {
  try {
    const matchIds: string[] = [];

    for (const matchData of matches) {
      const matchId = await recordMatch(matchData);
      matchIds.push(matchId);
    }

    return matchIds;
  } catch (error) {
    console.error('Error recording bulk matches:', error);
    throw error;
  }
};

/**
 * Edit an existing match
 */
export const editMatch = async (
  matchId: string,
  updates: {
    scoreA: number;
    scoreB: number;
  }
): Promise<void> => {
  try {
    // Determine new winner
    let winner: string | null = null;
    const match = await getDoc(doc(db, MATCHES_COLLECTION, matchId));

    if (!match.exists()) {
      throw new Error('Match not found');
    }

    const matchData = match.data() as LeagueMatch;

    if (updates.scoreA > updates.scoreB) {
      winner = matchData.playerA;
    } else if (updates.scoreB > updates.scoreA) {
      winner = matchData.playerB;
    }

    // Update match document
    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      scoreA: updates.scoreA,
      scoreB: updates.scoreB,
      winner,
      editedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error editing match:', error);
    throw error;
  }
};

/**
 * Delete a match
 */
export const deleteMatch = async (matchId: string, leagueId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MATCHES_COLLECTION, matchId));

    // Update league match count
    const league = await getLeagueById(leagueId);
    if (league && league.matchesPlayed > 0) {
      await updateLeague(leagueId, {
        matchesPlayed: league.matchesPlayed - 1,
      });
    }
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};

/**
 * Delete league and all associated matches
 */
export const deleteLeagueWithMatches = async (leagueId: string): Promise<void> => {
  try {
    // Delete all matches for this league
    const matchesQuery = query(
      collection(db, MATCHES_COLLECTION),
      where('leagueId', '==', leagueId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);

    const deleteMatchPromises = matchesSnapshot.docs.map((matchDoc) =>
      deleteDoc(doc(db, MATCHES_COLLECTION, matchDoc.id))
    );

    await Promise.all(deleteMatchPromises);

    // Delete the league
    await deleteLeague(leagueId);
  } catch (error) {
    console.error('Error deleting league with matches:', error);
    throw error;
  }
};

/**
 * Calculate league standings from matches
 */
export const calculateStandings = async (
  leagueId: string,
  playersList: Player[]
): Promise<LeaguePlayer[]> => {
  try {
    const rawMatches = await getLeagueMatches(leagueId);

    // Transform old format matches to new format
    const matches = rawMatches.map((match): LeagueMatch => {
      // Check if this is old format (has homeTeam/awayTeam instead of playerA/playerB)
      const matchData = match as any;
      if (matchData.homeTeam && matchData.awayTeam && !matchData.playerA) {
        // Old format - transform it
        const playerA = playersList.find(p => p.name.toLowerCase() === matchData.homeTeam.toLowerCase());
        const playerB = playersList.find(p => p.name.toLowerCase() === matchData.awayTeam.toLowerCase());

        const playerAId = playerA?.id || `legacy_${matchData.homeTeam.replace(/\s/g, '_')}`;
        const playerBId = playerB?.id || `legacy_${matchData.awayTeam.replace(/\s/g, '_')}`;
        const scoreA = matchData.homeScore || 0;
        const scoreB = matchData.awayScore || 0;

        return {
          id: match.id,
          leagueId: match.leagueId,
          playerA: playerAId,
          playerAName: matchData.homeTeam,
          playerB: playerBId,
          playerBName: matchData.awayTeam,
          scoreA,
          scoreB,
          date: match.date,
          played: true,
          winner: scoreA > scoreB ? playerAId : scoreB > scoreA ? playerBId : null,
        };
      }
      // Already new format
      return match;
    });

    // Initialize player stats
    const playerStats: Record<string, LeaguePlayer> = {};
    playersList.forEach((player) => {
      playerStats[player.id!] = {
        id: player.id!,
        name: player.name,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        position: 0,
        form: [],
      };
    });

    // Process matches
    matches.forEach((match) => {
      if (!match.played) return;

      const playerA = playerStats[match.playerA];
      const playerB = playerStats[match.playerB];

      if (playerA && playerB) {
        // Update played count
        playerA.played++;
        playerB.played++;

        // Update goals (with safety checks for undefined scores)
        const scoreA = match.scoreA || 0;
        const scoreB = match.scoreB || 0;
        playerA.goalsFor += scoreA;
        playerA.goalsAgainst += scoreB;
        playerB.goalsFor += scoreB;
        playerB.goalsAgainst += scoreA;

        // Determine result
        if (scoreA > scoreB) {
          // Player A wins
          playerA.won++;
          playerA.points += 3;
          playerA.form.unshift('W');
          playerB.lost++;
          playerB.form.unshift('L');
        } else if (scoreB > scoreA) {
          // Player B wins
          playerB.won++;
          playerB.points += 3;
          playerB.form.unshift('W');
          playerA.lost++;
          playerA.form.unshift('L');
        } else {
          // Draw
          playerA.draw++;
          playerA.points += 1;
          playerA.form.unshift('D');
          playerB.draw++;
          playerB.points += 1;
          playerB.form.unshift('D');
        }

        // Limit form to last 5 matches
        playerA.form = playerA.form.slice(0, 5);
        playerB.form = playerB.form.slice(0, 5);
      }
    });

    // Calculate goal difference
    Object.values(playerStats).forEach((player) => {
      player.goalDifference = player.goalsFor - player.goalsAgainst;
    });

    // Sort by points, then goal difference, then goals for
    const standings = Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    standings.forEach((player, index) => {
      player.position = index + 1;
    });

    return standings;
  } catch (error) {
    console.error('Error calculating standings:', error);
    throw error;
  }
};

/**
 * Calculate win streaks for all players in a league
 */
export const calculateWinStreaks = async (
  leagueId: string,
  playersList: Player[]
): Promise<WinStreak[]> => {
  try {
    const rawMatches = await getLeagueMatches(leagueId);

    // Transform old format matches to new format
    const matches = rawMatches.map((match): LeagueMatch => {
      const matchData = match as any;
      if (matchData.homeTeam && matchData.awayTeam && !matchData.playerA) {
        const playerA = playersList.find(p => p.name.toLowerCase() === matchData.homeTeam.toLowerCase());
        const playerB = playersList.find(p => p.name.toLowerCase() === matchData.awayTeam.toLowerCase());
        const playerAId = playerA?.id || `legacy_${matchData.homeTeam.replace(/\s/g, '_')}`;
        const playerBId = playerB?.id || `legacy_${matchData.awayTeam.replace(/\s/g, '_')}`;
        const scoreA = matchData.homeScore || 0;
        const scoreB = matchData.awayScore || 0;

        return {
          id: match.id,
          leagueId: match.leagueId,
          playerA: playerAId,
          playerAName: matchData.homeTeam,
          playerB: playerBId,
          playerBName: matchData.awayTeam,
          scoreA,
          scoreB,
          date: match.date,
          played: true,
          winner: scoreA > scoreB ? playerAId : scoreB > scoreA ? playerBId : null,
        };
      }
      return match;
    });

    const streaks: Record<string, WinStreak> = {};

    // Initialize streaks
    playersList.forEach((player) => {
      streaks[player.id!] = {
        playerId: player.id!,
        playerName: player.name,
        currentStreak: 0,
        longestStreak: 0,
      };
    });

    // Sort matches by date (oldest first) to calculate streaks correctly
    const sortedMatches = [...matches].sort((a, b) => {
      const dateA = convertTimestamp(a.date).getTime();
      const dateB = convertTimestamp(b.date).getTime();
      return dateA - dateB;
    });

    // Track current streaks
    const currentStreaks: Record<string, number> = {};
    playersList.forEach((player) => {
      currentStreaks[player.id!] = 0;
    });

    sortedMatches.forEach((match) => {
      if (!match.played) return;

      const playerA = match.playerA;
      const playerB = match.playerB;

      if (match.scoreA > match.scoreB) {
        // Player A wins
        currentStreaks[playerA]++;
        currentStreaks[playerB] = 0;

        if (currentStreaks[playerA] > streaks[playerA].longestStreak) {
          streaks[playerA].longestStreak = currentStreaks[playerA];
          streaks[playerA].longestStreakDate = match.date;
        }
      } else if (match.scoreB > match.scoreA) {
        // Player B wins
        currentStreaks[playerB]++;
        currentStreaks[playerA] = 0;

        if (currentStreaks[playerB] > streaks[playerB].longestStreak) {
          streaks[playerB].longestStreak = currentStreaks[playerB];
          streaks[playerB].longestStreakDate = match.date;
        }
      } else {
        // Draw - breaks streak
        currentStreaks[playerA] = 0;
        currentStreaks[playerB] = 0;
      }
    });

    // Update current streaks
    Object.keys(currentStreaks).forEach((playerId) => {
      if (streaks[playerId]) {
        streaks[playerId].currentStreak = currentStreaks[playerId];
      }
    });

    return Object.values(streaks);
  } catch (error) {
    console.error('Error calculating win streaks:', error);
    throw error;
  }
};

/**
 * Get player-specific stats for a league
 */
export const getPlayerLeagueStats = async (
  leagueId: string,
  playerId: string,
  standings: LeaguePlayer[],
  allPlayers: Player[]
): Promise<{
  player: LeaguePlayer;
  matchesPlayed: LeagueMatch[];
  notPlayedYet: string[];
  notPlayedYetNames: string[];
  winRate: number;
} | null> => {
  try {
    const player = standings.find((p) => p.id === playerId);
    if (!player) return null;

    const allMatches = await getLeagueMatches(leagueId);
    const matchesPlayed = allMatches.filter(
      (match) => match.played && (match.playerA === playerId || match.playerB === playerId)
    );

    // Find players not faced yet
    const facedPlayerIds = new Set<string>();
    matchesPlayed.forEach((match) => {
      if (match.playerA === playerId) facedPlayerIds.add(match.playerB);
      if (match.playerB === playerId) facedPlayerIds.add(match.playerA);
    });

    const league = await getLeagueById(leagueId);
    const notPlayedYet = league?.playerIds.filter(
      (id) => id !== playerId && !facedPlayerIds.has(id)
    ) || [];

    const notPlayedYetNames = notPlayedYet
      .map((id) => {
        const p = allPlayers.find((player) => player.id === id);
        return p?.name || 'Unknown';
      })
      .filter(Boolean);

    const winRate = player.played > 0 && player.won !== undefined ? (player.won / player.played) * 100 : 0;

    return {
      player,
      matchesPlayed,
      notPlayedYet,
      notPlayedYetNames,
      winRate,
    };
  } catch (error) {
    console.error('Error getting player league stats:', error);
    throw error;
  }
};
