/**
 * Season Integration Utilities
 *
 * Central file for binding leagues, tournaments, and rankings to seasons.
 * Handles auto-assignment, retroactive assignment, per-season rankings,
 * and season stats recomputation.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { League } from '@/types/league';
import type { Tournament } from './tournamentUtils';
import type { RankingEntry } from './rankingUtils';

// ─── Active Season ───────────────────────────────────────────

/**
 * Get the currently active season ID (one-shot read)
 */
export async function getActiveSeasonId(): Promise<string | null> {
  const q = query(
    collection(db, 'seasons'),
    where('status', '==', 'active'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

// ─── Subscribe: Leagues by Season ────────────────────────────

/**
 * Real-time listener for leagues belonging to a specific season
 */
export function subscribeToLeaguesBySeason(
  seasonId: string,
  callback: (leagues: League[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'leagues'),
    where('seasonId', '==', seasonId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const leagues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as League));
    callback(leagues);
  });
}

// ─── Subscribe: Tournaments by Season ────────────────────────

/**
 * Real-time listener for tournaments belonging to a specific season
 */
export function subscribeToTournamentsBySeason(
  seasonId: string,
  callback: (tournaments: Tournament[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'tournaments'),
    where('seasonId', '==', seasonId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const tournaments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tournament));
    callback(tournaments);
  });
}

// ─── Unscoped (for retroactive assignment) ───────────────────

/**
 * Get all leagues that don't have a seasonId (unscoped)
 */
export async function getUnscopedLeagues(): Promise<League[]> {
  // Firestore can't query "field doesn't exist", so we fetch all and filter client-side
  const snap = await getDocs(
    query(collection(db, 'leagues'), orderBy('createdAt', 'desc'))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as League))
    .filter((l) => !l.seasonId);
}

/**
 * Get all tournaments that don't have a seasonId (unscoped)
 */
export async function getUnscopedTournaments(): Promise<Tournament[]> {
  const snap = await getDocs(
    query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Tournament))
    .filter((t) => !t.seasonId);
}

// ─── Assign to Season ────────────────────────────────────────

/**
 * Assign a single league to a season
 */
export async function assignLeagueToSeason(
  leagueId: string,
  seasonId: string
): Promise<void> {
  await updateDoc(doc(db, 'leagues', leagueId), { seasonId });
}

/**
 * Assign a single tournament to a season
 */
export async function assignTournamentToSeason(
  tournamentId: string,
  seasonId: string
): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId), { seasonId });
}

/**
 * Batch-assign multiple leagues to a season
 */
export async function assignLeaguesToSeason(
  leagueIds: string[],
  seasonId: string
): Promise<void> {
  const batch = writeBatch(db);
  leagueIds.forEach((id) => {
    batch.update(doc(db, 'leagues', id), { seasonId });
  });
  await batch.commit();
}

/**
 * Batch-assign multiple tournaments to a season
 */
export async function assignTournamentsToSeason(
  tournamentIds: string[],
  seasonId: string
): Promise<void> {
  const batch = writeBatch(db);
  tournamentIds.forEach((id) => {
    batch.update(doc(db, 'tournaments', id), { seasonId });
  });
  await batch.commit();
}

/**
 * Unassign a league from its season (removes seasonId field)
 */
export async function unassignLeagueFromSeason(leagueId: string): Promise<void> {
  await updateDoc(doc(db, 'leagues', leagueId), { seasonId: deleteField() });
}

/**
 * Unassign a tournament from its season (removes seasonId field)
 */
export async function unassignTournamentFromSeason(tournamentId: string): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId), { seasonId: deleteField() });
}

// ─── Per-Season Rankings ─────────────────────────────────────

/**
 * Real-time listener for per-season rankings subcollection
 */
export function subscribeToSeasonRankings(
  seasonId: string,
  callback: (rankings: RankingEntry[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'seasons', seasonId, 'rankings'),
    orderBy('rank', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const rankings = snap.docs.map((d) => d.data() as RankingEntry);
    callback(rankings);
  });
}

/**
 * Copy global rankings into a season's rankings subcollection.
 * Resets coolOff and wildCard fields for the fresh season.
 */
export async function copyGlobalRankingsToSeason(
  seasonId: string
): Promise<void> {
  // Read global rankings
  const globalSnap = await getDocs(
    query(collection(db, 'rankings'), orderBy('rank', 'asc'))
  );

  if (globalSnap.empty) return;

  const batch = writeBatch(db);
  const seasonRankingsCol = collection(db, 'seasons', seasonId, 'rankings');

  globalSnap.docs.forEach((d) => {
    const data = d.data() as RankingEntry;
    batch.set(doc(seasonRankingsCol, data.memberId), {
      memberId: data.memberId,
      name: data.name,
      rank: data.rank,
      coolOff: '',
      wildCard: '',
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Save a new drag-and-drop ranking order for a season
 */
export async function saveSeasonRankingOrder(
  seasonId: string,
  newOrder: string[]
): Promise<void> {
  const batch = writeBatch(db);
  const seasonRankingsCol = collection(db, 'seasons', seasonId, 'rankings');

  newOrder.forEach((memberId, idx) => {
    batch.update(doc(seasonRankingsCol, memberId), {
      rank: idx + 1,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Update coolOff/wildCard fields for a player in a season's rankings
 */
export async function updateSeasonRankingFields(
  seasonId: string,
  memberId: string,
  updates: Partial<Pick<RankingEntry, 'coolOff' | 'wildCard'>>
): Promise<void> {
  const ref = doc(db, 'seasons', seasonId, 'rankings', memberId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

// ─── Season Stats Recomputation ──────────────────────────────

/**
 * Recompute season stats from linked leagues and tournaments.
 * Counts total leagues, tournaments, matches played, and unique active players.
 */
export async function recomputeSeasonStats(seasonId: string): Promise<void> {
  // Get leagues for this season
  const leaguesSnap = await getDocs(
    query(collection(db, 'leagues'), where('seasonId', '==', seasonId))
  );
  const leagues = leaguesSnap.docs.map((d) => d.data());

  // Get tournaments for this season
  const tournamentsSnap = await getDocs(
    query(collection(db, 'tournaments'), where('seasonId', '==', seasonId))
  );
  const tournaments = tournamentsSnap.docs.map((d) => d.data());

  // Count matches from leagues
  let totalMatches = 0;
  const playerSet = new Set<string>();

  for (const league of leagues) {
    totalMatches += league.matchesPlayed || 0;
    const playerIds: string[] = league.playerIds || [];
    playerIds.forEach((id: string) => playerSet.add(id));
  }

  // Build a name→ID lookup from the real players collection
  const allPlayersSnap = await getDocs(collection(db, 'players'));
  const playerNameToId = new Map<string, string>();
  allPlayersSnap.docs.forEach((d) => {
    const data = d.data();
    if (data.name) playerNameToId.set(data.name, d.id);
  });

  // Count matches from tournaments and collect real player IDs
  for (const t of tournaments) {
    // Collect unique participant names from groups
    const participantNames = new Set<string>();
    if (t.groups) {
      for (const group of t.groups) {
        if (group.matches) {
          totalMatches += group.matches.filter((m: any) => m.played).length;
        }
        if (group.members) {
          group.members.forEach((m: any) => {
            if (m.name) participantNames.add(m.name);
          });
        }
      }
    }
    // Also from qualifiedTeams
    if (t.qualifiedTeams) {
      t.qualifiedTeams.forEach((team: any) => {
        if (team.name) participantNames.add(team.name);
      });
    }
    // Count knockout matches
    if (t.knockoutBracket) {
      for (const tie of t.knockoutBracket) {
        if (tie.firstLeg?.played) totalMatches++;
        if (tie.secondLeg?.played) totalMatches++;
      }
    }
    // Map participant names to real player IDs
    for (const name of participantNames) {
      const realId = playerNameToId.get(name);
      if (realId) playerSet.add(realId);
    }
  }

  await updateDoc(doc(db, 'seasons', seasonId), {
    stats: {
      totalLeagues: leaguesSnap.size,
      totalTournaments: tournamentsSnap.size,
      totalMatches,
      activePlayers: playerSet.size,
    },
    updatedAt: serverTimestamp(),
  });
}
