/**
 * Head-to-Head Analytics Utilities
 *
 * Functions for comparing two players across all competitions (leagues & tournaments)
 */

import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from './firebase';
import { LeagueMatch } from '@/types/league';
import { convertTimestamp } from './leagueUtils';
import { getTournaments } from './tournamentUtils';

export interface HeadToHeadMatch {
  id: string;
  date: Date;
  playerAScore: number;
  playerBScore: number;
  winner: 'playerA' | 'playerB' | 'draw';
  competition: string;
  competitionType: 'league' | 'tournament';
  leagueId?: string;
}

export interface HeadToHeadStats {
  playerA: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    goalsScored: number;
    goalsConceded: number;
    winRate: number;
    biggestWin: { score: string; competition: string; date: Date } | null;
  };
  playerB: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    goalsScored: number;
    goalsConceded: number;
    winRate: number;
    biggestWin: { score: string; competition: string; date: Date } | null;
  };
  totalMatches: number;
  recentMatches: HeadToHeadMatch[];
  avgGoalsPerMatch: number;
  leagueRecord: { playerAWins: number; playerBWins: number; draws: number };
  tournamentRecord: { playerAWins: number; playerBWins: number; draws: number };
  mostCommonScore: { score: string; count: number } | null;
}

/**
 * Get all league matches between two players globally (across all leagues)
 */
async function getLeagueMatchesBetweenPlayers(
  playerAId: string,
  playerBId: string,
  seasonLeagueIds?: Set<string>
): Promise<HeadToHeadMatch[]> {
  const matchesRef = collection(db, 'leagueMatches');

  // Query for matches where either player is playerA or playerB
  const q = query(
    matchesRef,
    or(
      where('playerA', 'in', [playerAId, playerBId]),
      where('playerB', 'in', [playerAId, playerBId])
    )
  );

  const snapshot = await getDocs(q);
  const allMatches: HeadToHeadMatch[] = [];

  snapshot.forEach((doc) => {
    const match = doc.data() as LeagueMatch;

    // Only include matches where BOTH players are involved
    if (
      (match.playerA === playerAId && match.playerB === playerBId) ||
      (match.playerA === playerBId && match.playerB === playerAId)
    ) {
      const isPlayerAFirst = match.playerA === playerAId;
      const playerAScore = isPlayerAFirst ? match.scoreA : match.scoreB;
      const playerBScore = isPlayerAFirst ? match.scoreB : match.scoreA;

      let winner: 'playerA' | 'playerB' | 'draw';
      if (playerAScore > playerBScore) winner = 'playerA';
      else if (playerBScore > playerAScore) winner = 'playerB';
      else winner = 'draw';

      allMatches.push({
        id: doc.id,
        date: convertTimestamp(match.date),
        playerAScore,
        playerBScore,
        winner,
        competition: `League`, // We could fetch league name if needed
        competitionType: 'league',
        leagueId: match.leagueId,
      });
    }
  });

  if (seasonLeagueIds) {
    return allMatches.filter((m) => m.leagueId && seasonLeagueIds.has(m.leagueId));
  }

  return allMatches;
}

/**
 * Get all tournament matches between two players globally (across all tournaments)
 */
async function getTournamentMatchesBetweenPlayers(
  playerAName: string,
  playerBName: string,
  seasonId?: string
): Promise<HeadToHeadMatch[]> {
  const allMatches: HeadToHeadMatch[] = [];

  try {
    // Get all tournaments
    let tournaments = await getTournaments();

    if (seasonId) {
      tournaments = tournaments.filter((t) => t.seasonId === seasonId);
    }

    tournaments.forEach((tournament) => {
      // Check group stage matches
      // Tournament matches store player NAMES (not IDs) in homeTeam/awayTeam
      tournament.groups?.forEach((group) => {
        group.matches?.forEach((match) => {
          if (match.played) {
            const homeName = match.homeTeam;
            const awayName = match.awayTeam;

            // Check if both players are in this match
            if (
              (homeName === playerAName && awayName === playerBName) ||
              (homeName === playerBName && awayName === playerAName)
            ) {
              const isPlayerAHome = homeName === playerAName;
              const playerAScore = isPlayerAHome
                ? (match.homeScore ?? 0)
                : (match.awayScore ?? 0);
              const playerBScore = isPlayerAHome
                ? (match.awayScore ?? 0)
                : (match.homeScore ?? 0);

              let winner: 'playerA' | 'playerB' | 'draw';
              if (playerAScore > playerBScore) winner = 'playerA';
              else if (playerBScore > playerAScore) winner = 'playerB';
              else winner = 'draw';

              allMatches.push({
                id: match.id || `${tournament.id}-group-${group.id}`,
                date: convertTimestamp(match.matchDate) || new Date(),
                playerAScore,
                playerBScore,
                winner,
                competition: tournament.name,
                competitionType: 'tournament',
              });
            }
          }
        });
      });

      // Check knockout stage matches
      // Knockout ties store player NAMES in team1/team2
      tournament.knockoutBracket?.forEach((tie) => {
        const team1 = tie.team1;
        const team2 = tie.team2;

        // Check if both players are in this tie
        if (
          (team1 === playerAName && team2 === playerBName) ||
          (team1 === playerBName && team2 === playerAName)
        ) {
          const isPlayerATeam1 = team1 === playerAName;

          // Process first leg
          if (tie.firstLeg.played) {
            const playerAScore = isPlayerATeam1
              ? (tie.firstLeg.homeScore ?? 0)
              : (tie.firstLeg.awayScore ?? 0);
            const playerBScore = isPlayerATeam1
              ? (tie.firstLeg.awayScore ?? 0)
              : (tie.firstLeg.homeScore ?? 0);

            let winner: 'playerA' | 'playerB' | 'draw';
            if (playerAScore > playerBScore) winner = 'playerA';
            else if (playerBScore > playerAScore) winner = 'playerB';
            else winner = 'draw';

            allMatches.push({
              id: tie.firstLeg.id || `${tournament.id}-${tie.round}-leg1`,
              date: convertTimestamp(tie.firstLeg.matchDate) || new Date(),
              playerAScore,
              playerBScore,
              winner,
              competition: `${tournament.name} - ${tie.round} (1st Leg)`,
              competitionType: 'tournament',
            });
          }

          // Process second leg
          if (tie.secondLeg.played) {
            const playerAScore = isPlayerATeam1
              ? (tie.secondLeg.awayScore ?? 0)
              : (tie.secondLeg.homeScore ?? 0);
            const playerBScore = isPlayerATeam1
              ? (tie.secondLeg.homeScore ?? 0)
              : (tie.secondLeg.awayScore ?? 0);

            let winner: 'playerA' | 'playerB' | 'draw';
            if (playerAScore > playerBScore) winner = 'playerA';
            else if (playerBScore > playerAScore) winner = 'playerB';
            else winner = 'draw';

            allMatches.push({
              id: tie.secondLeg.id || `${tournament.id}-${tie.round}-leg2`,
              date: convertTimestamp(tie.secondLeg.matchDate) || new Date(),
              playerAScore,
              playerBScore,
              winner,
              competition: `${tournament.name} - ${tie.round} (2nd Leg)`,
              competitionType: 'tournament',
            });
          }
        }
      });
    });
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
  }

  return allMatches;
}

/**
 * Get comprehensive head-to-head statistics between two players
 */
export async function getGlobalHeadToHead(
  playerAId: string,
  playerAName: string,
  playerBId: string,
  playerBName: string,
  seasonId?: string
): Promise<HeadToHeadStats> {
  // Build season league IDs set if filtering by season
  let seasonLeagueIds: Set<string> | undefined;
  if (seasonId) {
    const leaguesSnap = await getDocs(
      query(collection(db, 'leagues'), where('seasonId', '==', seasonId))
    );
    seasonLeagueIds = new Set(leaguesSnap.docs.map((doc) => doc.id));
  }

  // Fetch all matches between the two players
  // League matches use player IDs, tournament matches use player names
  const [leagueMatches, tournamentMatches] = await Promise.all([
    getLeagueMatchesBetweenPlayers(playerAId, playerBId, seasonLeagueIds),
    getTournamentMatchesBetweenPlayers(playerAName, playerBName, seasonId),
  ]);

  const allMatches = [...leagueMatches, ...tournamentMatches].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Initialize stats
  const stats: HeadToHeadStats = {
    playerA: {
      id: playerAId,
      name: playerAName,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsScored: 0,
      goalsConceded: 0,
      winRate: 0,
      biggestWin: null,
    },
    playerB: {
      id: playerBId,
      name: playerBName,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsScored: 0,
      goalsConceded: 0,
      winRate: 0,
      biggestWin: null,
    },
    totalMatches: allMatches.length,
    recentMatches: allMatches.slice(0, 10),
    avgGoalsPerMatch: 0,
    leagueRecord: { playerAWins: 0, playerBWins: 0, draws: 0 },
    tournamentRecord: { playerAWins: 0, playerBWins: 0, draws: 0 },
    mostCommonScore: null,
  };

  if (allMatches.length === 0) {
    return stats;
  }

  // Calculate statistics
  const scoreFrequency: Record<string, number> = {};
  let playerABiggestMargin = -Infinity;
  let playerBBiggestMargin = -Infinity;
  let playerABiggestWin: HeadToHeadMatch | null = null;
  let playerBBiggestWin: HeadToHeadMatch | null = null;

  allMatches.forEach((match) => {
    // Update goals
    stats.playerA.goalsScored += match.playerAScore;
    stats.playerA.goalsConceded += match.playerBScore;
    stats.playerB.goalsScored += match.playerBScore;
    stats.playerB.goalsConceded += match.playerAScore;

    // Update wins/losses/draws
    if (match.winner === 'playerA') {
      stats.playerA.wins++;
      stats.playerB.losses++;

      // Track biggest win
      const margin = match.playerAScore - match.playerBScore;
      if (margin > playerABiggestMargin) {
        playerABiggestMargin = margin;
        playerABiggestWin = match;
      }

      // Update competition-specific records
      if (match.competitionType === 'league') {
        stats.leagueRecord.playerAWins++;
      } else {
        stats.tournamentRecord.playerAWins++;
      }
    } else if (match.winner === 'playerB') {
      stats.playerB.wins++;
      stats.playerA.losses++;

      // Track biggest win
      const margin = match.playerBScore - match.playerAScore;
      if (margin > playerBBiggestMargin) {
        playerBBiggestMargin = margin;
        playerBBiggestWin = match;
      }

      // Update competition-specific records
      if (match.competitionType === 'league') {
        stats.leagueRecord.playerBWins++;
      } else {
        stats.tournamentRecord.playerBWins++;
      }
    } else {
      stats.playerA.draws++;
      stats.playerB.draws++;

      // Update competition-specific records
      if (match.competitionType === 'league') {
        stats.leagueRecord.draws++;
      } else {
        stats.tournamentRecord.draws++;
      }
    }

    // Track score frequency
    const scoreKey = `${match.playerAScore}-${match.playerBScore}`;
    scoreFrequency[scoreKey] = (scoreFrequency[scoreKey] || 0) + 1;
  });

  // Calculate win rates
  stats.playerA.winRate =
    stats.totalMatches > 0 ? (stats.playerA.wins / stats.totalMatches) * 100 : 0;
  stats.playerB.winRate =
    stats.totalMatches > 0 ? (stats.playerB.wins / stats.totalMatches) * 100 : 0;

  // Set biggest wins
  if (playerABiggestWin) {
    stats.playerA.biggestWin = {
      score: `${playerABiggestWin.playerAScore}-${playerABiggestWin.playerBScore}`,
      competition: playerABiggestWin.competition,
      date: playerABiggestWin.date,
    };
  }
  if (playerBBiggestWin) {
    stats.playerB.biggestWin = {
      score: `${playerBBiggestWin.playerBScore}-${playerBBiggestWin.playerAScore}`,
      competition: playerBBiggestWin.competition,
      date: playerBBiggestWin.date,
    };
  }

  // Calculate average goals per match
  const totalGoals = stats.playerA.goalsScored + stats.playerB.goalsScored;
  stats.avgGoalsPerMatch = stats.totalMatches > 0 ? totalGoals / stats.totalMatches : 0;

  // Find most common score
  const scoreEntries = Object.entries(scoreFrequency);
  if (scoreEntries.length > 0) {
    const mostCommon = scoreEntries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );
    stats.mostCommonScore = {
      score: mostCommon[0],
      count: mostCommon[1],
    };
  }

  return stats;
}
