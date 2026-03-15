/**
 * League Firebase Utilities
 *
 * Core data layer for the FIFA League Manager's round-robin league system.
 * This module provides all Firestore CRUD operations for leagues and their matches,
 * as well as pure-logic helpers that derive standings, win streaks, and per-player
 * statistics from raw match data.
 *
 * Leagues follow a round-robin format where every player faces every other player.
 * Total matches for a league are calculated as n(n-1)/2 where n is the number of
 * players. Points are awarded as: Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
 *
 * The module also handles backward compatibility with a legacy match data format
 * (homeTeam/awayTeam) that may still exist in older Firestore documents.
 *
 * Collections used:
 *   - `leagues`        -- League metadata (name, players, settings, point adjustments)
 *   - `leagueMatches`  -- Individual match results linked to a league via `leagueId`
 *
 * @module leagueUtils
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
import { League, LeagueMatch, LeaguePlayer, LeaguePointAdjustment, WinStreak } from '@/types/league';
import { v4 as uuidv4 } from 'uuid';
import { Player } from '@/types/player';

/** Firestore collection name for league documents. */
const LEAGUES_COLLECTION = 'leagues';

/** Firestore collection name for match documents (newer format). */
const MATCHES_COLLECTION = 'leagueMatches';

/**
 * Convert a Firestore Timestamp (or any timestamp-like value) to a JavaScript Date.
 *
 * Handles multiple input shapes because match dates may arrive as Firestore
 * `Timestamp` objects, plain `Date` instances, numeric seconds, or serialised
 * strings depending on how the data was originally written or cached.
 *
 * @param timestamp - A Firestore Timestamp, Date, numeric seconds value, date string, or nullish value.
 * @returns A valid JavaScript `Date`. Falls back to `new Date()` (now) if the input is falsy or unparseable.
 */
export const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  // Firestore Timestamp objects expose a `.toDate()` method
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // Plain object with `seconds` field (e.g., serialised Firestore Timestamp)
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }
  // Last resort: try the built-in Date constructor (handles ISO strings, epoch ms, etc.)
  try {
    return new Date(timestamp);
  } catch {
    return new Date();
  }
};

/**
 * Create a new league in Firestore.
 *
 * Initialises `matchesPlayed` to 0 and stamps `createdAt` / `updatedAt` with
 * the Firestore server timestamp so clocks are consistent across clients.
 *
 * @param leagueData - All league fields except `id` (Firestore auto-generates the document ID).
 * @returns The Firestore-generated document ID for the new league.
 * @throws Re-throws any Firestore write error after logging.
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
 * Fetch every league from Firestore, ordered newest-first by creation date.
 *
 * Used on the leagues listing / dashboard page to show all available leagues.
 *
 * @returns An array of {@link League} objects sorted by `createdAt` descending.
 * @throws Re-throws any Firestore read error after logging.
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
 * Fetch a single league document by its Firestore ID.
 *
 * @param leagueId - The Firestore document ID of the league.
 * @returns The {@link League} object if found, or `null` if the document does not exist.
 * @throws Re-throws any Firestore read error after logging.
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
 * Partially update an existing league document in Firestore.
 *
 * Automatically stamps `updatedAt` with the server timestamp on every call.
 *
 * @param leagueId - The Firestore document ID of the league to update.
 * @param updates  - A partial {@link League} object containing only the fields to change.
 * @throws Re-throws any Firestore write error after logging.
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
 * Delete a league document from Firestore.
 *
 * **Note:** This only removes the league metadata document. To also delete all
 * associated match documents, use {@link deleteLeagueWithMatches} instead.
 *
 * @param leagueId - The Firestore document ID of the league to delete.
 * @throws Re-throws any Firestore delete error after logging.
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
 * Add one or more players to an existing league.
 *
 * Merges `newPlayerIds` with the league's current roster (deduplicating) and
 * recalculates `totalMatches` using the round-robin formula `n(n-1)/2` so the
 * league's progress bar stays accurate.
 *
 * @param leagueId     - The Firestore document ID of the league.
 * @param newPlayerIds - Array of player IDs to add to the league.
 * @throws If the league document is not found or Firestore write fails.
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
 * Remove a player from a league and delete all their match results.
 *
 * Steps:
 *   1. Remove the player ID from the league's `playerIds` array.
 *   2. Recalculate `totalMatches` for the reduced roster (n(n-1)/2).
 *   3. Query and delete every match where the player was involved.
 *   4. Decrement `matchesPlayed` by the number of deleted matches.
 *   5. Remove any `pointAdjustments` for the player.
 *
 * @param leagueId - The Firestore document ID of the league.
 * @param playerId - The ID of the player to remove.
 * @throws If the league document is not found or Firestore operations fail.
 */
export const removePlayerFromLeague = async (
  leagueId: string,
  playerId: string
): Promise<void> => {
  try {
    const league = await getLeagueById(leagueId);
    if (!league) {
      throw new Error('League not found');
    }

    // 1. Remove player from the roster
    const currentPlayerIds = league.playerIds || [];
    const updatedPlayerIds = currentPlayerIds.filter(id => id !== playerId);

    // 2. Recalculate total matches for the reduced roster
    const numPlayers = updatedPlayerIds.length;
    const totalMatches = numPlayers > 1 ? (numPlayers * (numPlayers - 1)) / 2 : 0;

    // 3. Find and delete all matches involving this player
    const matchesQuery = query(
      collection(db, MATCHES_COLLECTION),
      where('leagueId', '==', leagueId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);

    let deletedMatchCount = 0;
    const deletePromises: Promise<void>[] = [];

    matchesSnapshot.forEach((matchDoc) => {
      const match = matchDoc.data();
      if (match.playerA === playerId || match.playerB === playerId) {
        deletePromises.push(deleteDoc(doc(db, MATCHES_COLLECTION, matchDoc.id)));
        if (match.played) {
          deletedMatchCount++;
        }
      }
    });

    await Promise.all(deletePromises);

    // 4. Build the league update
    const newMatchesPlayed = Math.max(0, (league.matchesPlayed || 0) - deletedMatchCount);

    // 5. Remove point adjustments for this player
    const pointAdjustments = { ...(league.pointAdjustments || {}) };
    delete pointAdjustments[playerId];

    await updateLeague(leagueId, {
      playerIds: updatedPlayerIds,
      totalMatches,
      matchesPlayed: newMatchesPlayed,
      pointAdjustments,
    });
  } catch (error) {
    console.error('Error removing player from league:', error);
    throw error;
  }
};

/**
 * Fetch all matches belonging to a given league, sorted newest-first.
 *
 * Implements a fallback strategy for backward compatibility:
 *   1. Query the current `leagueMatches` collection with a Firestore `orderBy`.
 *   2. If that fails (e.g., composite index not yet built) or returns nothing,
 *      fall back to the legacy `matches` collection and sort client-side.
 *   3. If both fail, return an empty array instead of throwing, so the UI can
 *      still render an empty state.
 *
 * @param leagueId - The Firestore document ID of the league whose matches to fetch.
 * @returns An array of {@link LeagueMatch} objects sorted by date descending (newest first).
 */
export const getLeagueMatches = async (leagueId: string): Promise<LeagueMatch[]> => {
  try {
    // Strategy 1: Query the current `leagueMatches` collection with server-side ordering
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
  playersList: Player[],
  pointAdjustments?: Record<string, LeaguePointAdjustment[]>
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

    // Apply point adjustments
    if (pointAdjustments) {
      Object.entries(pointAdjustments).forEach(([playerId, adjustments]) => {
        if (playerStats[playerId] && adjustments.length > 0) {
          const totalAdj = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
          playerStats[playerId].points += totalAdj;
          playerStats[playerId].pointAdjustments = adjustments;
          playerStats[playerId].totalAdjustment = totalAdj;
        }
      });
    }

    // Sort by points, then goal difference, then goals for, then alphabetically
    const standings = Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
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
        currentUnbeaten: 0,
        longestUnbeaten: 0,
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
    const currentUnbeaten: Record<string, number> = {};
    playersList.forEach((player) => {
      currentStreaks[player.id!] = 0;
      currentUnbeaten[player.id!] = 0;
    });

    sortedMatches.forEach((match) => {
      if (!match.played) return;

      const playerA = match.playerA;
      const playerB = match.playerB;

      if (match.scoreA > match.scoreB) {
        // Player A wins
        currentStreaks[playerA]++;
        currentUnbeaten[playerA]++;
        currentStreaks[playerB] = 0;
        currentUnbeaten[playerB] = 0;

        if (currentStreaks[playerA] > streaks[playerA].longestStreak) {
          streaks[playerA].longestStreak = currentStreaks[playerA];
          streaks[playerA].longestStreakDate = match.date;
        }
        if (currentUnbeaten[playerA] > streaks[playerA].longestUnbeaten) {
          streaks[playerA].longestUnbeaten = currentUnbeaten[playerA];
        }
      } else if (match.scoreB > match.scoreA) {
        // Player B wins
        currentStreaks[playerB]++;
        currentUnbeaten[playerB]++;
        currentStreaks[playerA] = 0;
        currentUnbeaten[playerA] = 0;

        if (currentStreaks[playerB] > streaks[playerB].longestStreak) {
          streaks[playerB].longestStreak = currentStreaks[playerB];
          streaks[playerB].longestStreakDate = match.date;
        }
        if (currentUnbeaten[playerB] > streaks[playerB].longestUnbeaten) {
          streaks[playerB].longestUnbeaten = currentUnbeaten[playerB];
        }
      } else {
        // Draw — win streak broken, unbeaten run continues
        currentStreaks[playerA] = 0;
        currentStreaks[playerB] = 0;
        currentUnbeaten[playerA]++;
        currentUnbeaten[playerB]++;

        if (currentUnbeaten[playerA] > streaks[playerA].longestUnbeaten) {
          streaks[playerA].longestUnbeaten = currentUnbeaten[playerA];
        }
        if (currentUnbeaten[playerB] > streaks[playerB].longestUnbeaten) {
          streaks[playerB].longestUnbeaten = currentUnbeaten[playerB];
        }
      }
    });

    // Update current streaks
    Object.keys(currentStreaks).forEach((playerId) => {
      if (streaks[playerId]) {
        streaks[playerId].currentStreak = currentStreaks[playerId];
        streaks[playerId].currentUnbeaten = currentUnbeaten[playerId];
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

/**
 * Adjust a player's points manually (for rule violations, fair play bonuses, etc.)
 */
export const adjustPlayerPoints = async (
  leagueId: string,
  playerId: string,
  adjustment: number,
  reason: string
): Promise<void> => {
  try {
    const league = await getLeagueById(leagueId);
    if (!league) throw new Error('League not found');

    const pointAdjustment: LeaguePointAdjustment = {
      id: uuidv4(),
      amount: adjustment,
      reason,
      timestamp: Timestamp.now(),
      adjustedBy: 'admin',
    };

    const existingAdjustments = league.pointAdjustments || {};
    const playerAdjustments = existingAdjustments[playerId] || [];

    const updatedAdjustments = {
      ...existingAdjustments,
      [playerId]: [...playerAdjustments, pointAdjustment],
    };

    const docRef = doc(db, LEAGUES_COLLECTION, leagueId);
    await updateDoc(docRef, {
      pointAdjustments: updatedAdjustments,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adjusting player points:', error);
    throw error;
  }
};
