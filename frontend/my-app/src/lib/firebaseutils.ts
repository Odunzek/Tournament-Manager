// lib/firebaseUtils.ts - UPDATED with member support
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, League, Match } from "./firebase";

// Updated Team interface to include member information
export interface Team {
  id?: string;
  name: string;
  memberId?: string; // Added: Links to member ID
  psnId?: string; // Added: PSN ID from member
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  leagueId: string;
}

// Updated League interface to include status
export interface LeagueExtended extends League {
  status?: "active" | "ended";
  endedAt?: Date;
}

// League Functions
export const createLeague = async (name: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "leagues"), {
      name,
      createdAt: new Date(),
      status: "active", // Added: Default to active
      teams: [],
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating league:", error);
    throw error;
  }
};

export const getLeagues = async (): Promise<LeagueExtended[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "leagues"), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as LeagueExtended)
    );
  } catch (error) {
    console.error("Error getting leagues:", error);
    return [];
  }
};

export const deleteLeague = async (leagueId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "leagues", leagueId));

    // Also delete all teams for this league
    const teamsQuery = query(
      collection(db, "teams"),
      where("leagueId", "==", leagueId)
    );
    const teamsSnapshot = await getDocs(teamsQuery);

    const deletePromises = teamsSnapshot.docs.map((teamDoc) =>
      deleteDoc(doc(db, "teams", teamDoc.id))
    );

    // Delete all matches for this league
    const matchesQuery = query(
      collection(db, "matches"),
      where("leagueId", "==", leagueId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);

    const deleteMatchPromises = matchesSnapshot.docs.map((matchDoc) =>
      deleteDoc(doc(db, "matches", matchDoc.id))
    );

    await Promise.all([...deletePromises, ...deleteMatchPromises]);
  } catch (error) {
    console.error("Error deleting league:", error);
    throw error;
  }
};

export const updateLeague = async (
  leagueId: string,
  updates: Partial<LeagueExtended>
): Promise<void> => {
  try {
    const updateData: any = { ...updates };

    // Convert Date objects to Firestore Timestamps if needed
    if (updates.endedAt) {
      updateData.endedAt = updates.endedAt;
    }

    await updateDoc(doc(db, "leagues", leagueId), updateData);
  } catch (error) {
    console.error("Error updating league:", error);
    throw error;
  }
};

// Updated Team Functions with member support
export const createTeam = async (
  leagueId: string,
  teamName: string,
  memberInfo?: { memberId?: string; psnId?: string }
): Promise<string> => {
  try {
    const teamData: any = {
      leagueId,
      name: teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };

    // Add member information if provided
    if (memberInfo) {
      if (memberInfo.memberId) {
        teamData.memberId = memberInfo.memberId;
      }
      if (memberInfo.psnId) {
        teamData.psnId = memberInfo.psnId;
      }
    }

    const docRef = await addDoc(collection(db, "teams"), teamData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
};

export const getTeams = async (leagueId: string): Promise<Team[]> => {
  try {
    const q = query(collection(db, "teams"), where("leagueId", "==", leagueId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Team)
    );
  } catch (error) {
    console.error("Error getting teams:", error);
    return [];
  }
};

// Get all teams across all leagues (for checking member availability)
export const getAllTeams = async (): Promise<Team[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "teams"));
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Team)
    );
  } catch (error) {
    console.error("Error getting all teams:", error);
    return [];
  }
};

// Check if a member is in any active league
export const isMemberInActiveLeague = async (
  memberId: string
): Promise<{ inLeague: boolean; leagueName?: string }> => {
  try {
    // Get all active leagues
    const leaguesQuery = query(
      collection(db, "leagues"),
      where("status", "==", "active")
    );
    const leaguesSnapshot = await getDocs(leaguesQuery);

    // For each active league, check if member is in a team
    for (const leagueDoc of leaguesSnapshot.docs) {
      const teamsQuery = query(
        collection(db, "teams"),
        where("leagueId", "==", leagueDoc.id),
        where("memberId", "==", memberId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      if (!teamsSnapshot.empty) {
        return {
          inLeague: true,
          leagueName: leagueDoc.data().name,
        };
      }
    }

    return { inLeague: false };
  } catch (error) {
    console.error("Error checking member league status:", error);
    return { inLeague: false };
  }
};

export const updateTeamStats = async (
  teamId: string,
  stats: Partial<Team>
): Promise<void> => {
  try {
    await updateDoc(doc(db, "teams", teamId), stats);
  } catch (error) {
    console.error("Error updating team stats:", error);
    throw error;
  }
};

// Match Functions (updated to include leagueId)
export const saveMatch = async (match: {
  leagueName: string;
  leagueId?: string; // Added optional leagueId
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date;
}): Promise<string> => {
  try {
    const matchData: any = {
      ...match,
      date: new Date(match.date),
    };

    const docRef = await addDoc(collection(db, "matches"), matchData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving match:", error);
    throw error;
  }
};

export const getMatches = async (leagueName: string): Promise<Match[]> => {
  try {
    const q = query(
      collection(db, "matches"),
      where("leagueName", "==", leagueName),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Match)
    );
  } catch (error) {
    console.error("Error getting matches:", error);
    return [];
  }
};

// Get matches by league ID (alternative method)
export const getMatchesByLeagueId = async (
  leagueId: string
): Promise<Match[]> => {
  try {
    const q = query(
      collection(db, "matches"),
      where("leagueId", "==", leagueId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Match)
    );
  } catch (error) {
    console.error("Error getting matches by league ID:", error);
    return [];
  }
};

// Real-time listeners
export const subscribeToLeagues = (
  callback: (leagues: LeagueExtended[]) => void
) => {
  const q = query(collection(db, "leagues"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const leagues = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as LeagueExtended)
    );
    callback(leagues);
  });
};

export const subscribeToTeams = (
  leagueId: string,
  callback: (teams: Team[]) => void
) => {
  const q = query(collection(db, "teams"), where("leagueId", "==", leagueId));
  return onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Team)
    );
    callback(teams);
  });
};

// Subscribe to all teams (for checking member availability across leagues)
export const subscribeToAllTeams = (callback: (teams: Team[]) => void) => {
  return onSnapshot(collection(db, "teams"), (snapshot) => {
    const teams = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Team)
    );
    callback(teams);
  });
};

// ---- Matches (real-time) ----
export const subscribeToMatchesByLeagueId = (
  leagueId: string,
  callback: (matches: Match[]) => void
) => {
  const q = query(
    collection(db, "matches"),
    where("leagueId", "==", leagueId),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Match, "id">),
    }));
    callback(rows as Match[]);
  });
};

export const subscribeToMatchesByLeagueName = (
  leagueName: string,
  callback: (matches: Match[]) => void
) => {
  const q = query(
    collection(db, "matches"),
    where("leagueName", "==", leagueName),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Match, "id">),
    }));
    callback(rows as Match[]);
  });
};

export async function editLeagueMatch(
  leagueId: string,
  matchId: string,
  newHomeScore: number,
  newAwayScore: number,
  newHomeTeam: string,
  newAwayTeam: string
) {
  // 1. Update the match document
  const matchRef = doc(db, "matches", matchId);
  await updateDoc(matchRef, {
    homeTeam: newHomeTeam,
    awayTeam: newAwayTeam,
    homeScore: newHomeScore,
    awayScore: newAwayScore,
    editedAt: new Date(),
  });

  // 2. Fetch all matches for this league
  const q = query(collection(db, "matches"), where("leagueId", "==", leagueId));
  const snap = await getDocs(q);

  // 3. Aggregate stats from all matches
  const stats: Record<
    string,
    {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      gf: number;
      ga: number;
      points: number;
    }
  > = {};

  snap.forEach((d) => {
    const m = d.data();
    const { homeTeam, awayTeam, homeScore, awayScore } = m;

    [homeTeam, awayTeam].forEach((team) => {
      if (!stats[team]) {
        stats[team] = {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          points: 0,
        };
      }
    });

    stats[homeTeam].played++;
    stats[awayTeam].played++;
    stats[homeTeam].gf += homeScore;
    stats[homeTeam].ga += awayScore;
    stats[awayTeam].gf += awayScore;
    stats[awayTeam].ga += homeScore;

    if (homeScore > awayScore) {
      stats[homeTeam].won++;
      stats[awayTeam].lost++;
      stats[homeTeam].points += 3;
    } else if (awayScore > homeScore) {
      stats[awayTeam].won++;
      stats[homeTeam].lost++;
      stats[awayTeam].points += 3;
    } else {
      stats[homeTeam].drawn++;
      stats[awayTeam].drawn++;
      stats[homeTeam].points++;
      stats[awayTeam].points++;
    }
  });

  // 4. Push recalculated stats back to teams
  const teamsSnap = await getDocs(
    query(collection(db, "teams"), where("leagueId", "==", leagueId))
  );

  const updates = teamsSnap.docs.map((teamDoc) => {
    const team = teamDoc.data();
    const teamStats = stats[team.name] || {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    };

    return updateDoc(doc(db, "teams", teamDoc.id), {
      played: teamStats.played,
      won: teamStats.won,
      drawn: teamStats.drawn,
      lost: teamStats.lost,
      goalsFor: teamStats.gf,
      goalsAgainst: teamStats.ga,
      goalDifference: teamStats.gf - teamStats.ga,
      points: teamStats.points,
    });
  });

  await Promise.all(updates);
}
