/**
 * PlayerStatsModal — Detailed tournament stats for a single participant.
 *
 * Opens as a modal dialog and aggregates all available stats for the selected
 * player across both the group stage and knockout stage of a tournament.
 *
 * Stats computed client-side via `useMemo` from the full Tournament object:
 *
 * Group stage:
 *   - Position in their group, P/W/D/L/GF/GA/GD/Pts
 *   - Whether they qualified for the knockout stage
 *
 * Knockout stage:
 *   - Each knockout tie (round label, opponent, aggregate score, outcome)
 *   - Highest round reached (round_16, quarter_final, semi_final, final)
 *   - Whether they won the tournament
 *   - Who eliminated them (if applicable)
 *
 * Combined totals:
 *   - Overall goals scored/conceded across the whole tournament
 *   - Overall W/D/L/played record
 *
 * `ROUND_HIERARCHY` maps round keys to numeric values for comparison,
 * allowing the "highest round" to be determined from the list of ties.
 */
"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Shield, Swords, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Modal from '../ui/Modal';
import { Tournament, KnockoutTie } from '@/lib/tournamentUtils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlayerTournamentStats {
  group: {
    name: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    qualified: boolean;
  } | null;

  knockout: {
    highestRound: string;
    knockoutGoalsFor: number;
    knockoutGoalsAgainst: number;
    eliminatedBy: string | null;
    isWinner: boolean;
    ties: Array<{
      round: string;
      opponent: string;
      playerAgg: number;
      opponentAgg: number;
      won: boolean;
      completed: boolean;
    }>;
  } | null;

  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalPlayed: number;
  totalWon: number;
  totalDrawn: number;
  totalLost: number;
  tournamentResult: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROUND_HIERARCHY: Record<string, number> = {
  round_16: 0,
  quarter_final: 1,
  semi_final: 2,
  final: 3,
};

const ROUND_LABELS: Record<string, string> = {
  round_16: 'Round of 16',
  quarter_final: 'Quarter Finals',
  semi_final: 'Semi Finals',
  final: 'Final',
};

const ROUND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  round_16: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  quarter_final: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  semi_final: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  final: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

// ─── Pure Stats Computation ─────────────────────────────────────────────────

function computePlayerTournamentStats(
  tournament: Tournament,
  playerName: string
): PlayerTournamentStats {
  // --- Group Stage ---
  let groupStats: PlayerTournamentStats['group'] = null;

  if (tournament.groups) {
    for (const group of tournament.groups) {
      const standing = group.standings.find(
        (s) => s.teamName === playerName
      );
      if (standing) {
        const teamsAdvance = tournament.settings.teamsAdvanceFromGroup ?? 2;
        groupStats = {
          name: group.name,
          position: standing.position,
          played: standing.played,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDifference: standing.goalDifference,
          points: standing.points,
          qualified: standing.position <= teamsAdvance,
        };
        break;
      }
    }
  }

  // --- Knockout Stage ---
  let knockoutStats: PlayerTournamentStats['knockout'] = null;

  if (tournament.knockoutBracket && tournament.knockoutBracket.length > 0) {
    const playerTies: Array<{
      tie: KnockoutTie;
      round: string;
      opponent: string;
      playerAgg: number;
      opponentAgg: number;
      won: boolean;
      completed: boolean;
    }> = [];

    let highestRoundValue = -1;
    let highestRound = '';
    let eliminatedBy: string | null = null;
    let isWinner = false;
    let knockoutGoalsFor = 0;
    let knockoutGoalsAgainst = 0;

    for (const tie of tournament.knockoutBracket) {
      // Skip replay ties — we process them via the original tie
      if (tie.originalTieId) continue;

      const isTeam1 = tie.team1 === playerName;
      const isTeam2 = tie.team2 === playerName;
      if (!isTeam1 && !isTeam2) continue;

      const opponent = isTeam1 ? tie.team2 : tie.team1;
      const round = tie.round;

      // Track highest round reached
      const roundValue = ROUND_HIERARCHY[round] ?? -1;
      if (roundValue > highestRoundValue) {
        highestRoundValue = roundValue;
        highestRound = round;
      }

      // Calculate goals from legs
      let playerGoals = 0;
      let opponentGoals = 0;

      if (tie.firstLeg?.played) {
        if (isTeam1) {
          playerGoals += tie.firstLeg.homeTeam === playerName
            ? (tie.firstLeg.homeScore ?? 0)
            : (tie.firstLeg.awayScore ?? 0);
          opponentGoals += tie.firstLeg.homeTeam === playerName
            ? (tie.firstLeg.awayScore ?? 0)
            : (tie.firstLeg.homeScore ?? 0);
        } else {
          playerGoals += tie.firstLeg.homeTeam === playerName
            ? (tie.firstLeg.homeScore ?? 0)
            : (tie.firstLeg.awayScore ?? 0);
          opponentGoals += tie.firstLeg.homeTeam === playerName
            ? (tie.firstLeg.awayScore ?? 0)
            : (tie.firstLeg.homeScore ?? 0);
        }
      }

      if (tie.secondLeg?.played) {
        playerGoals += tie.secondLeg.homeTeam === playerName
          ? (tie.secondLeg.homeScore ?? 0)
          : (tie.secondLeg.awayScore ?? 0);
        opponentGoals += tie.secondLeg.homeTeam === playerName
          ? (tie.secondLeg.awayScore ?? 0)
          : (tie.secondLeg.homeScore ?? 0);
      }

      knockoutGoalsFor += playerGoals;
      knockoutGoalsAgainst += opponentGoals;

      // Determine winner — check for replay chain
      // Only trust completion status if at least one leg was actually played
      const anyLegPlayed = !!tie.firstLeg?.played || !!tie.secondLeg?.played;
      let effectiveWinner: string | undefined;
      let tieCompleted = tie.completed && anyLegPlayed;

      if (tie.awaitingReplay && tie.replayTieId) {
        const replayTie = tournament.knockoutBracket.find(
          (t) => t.id === tie.replayTieId
        );
        if (replayTie) {
          // Add replay goals
          if (replayTie.firstLeg?.played) {
            const rpGoals = replayTie.firstLeg.homeTeam === playerName
              ? (replayTie.firstLeg.homeScore ?? 0)
              : (replayTie.firstLeg.awayScore ?? 0);
            const rpOppGoals = replayTie.firstLeg.homeTeam === playerName
              ? (replayTie.firstLeg.awayScore ?? 0)
              : (replayTie.firstLeg.homeScore ?? 0);
            knockoutGoalsFor += rpGoals;
            knockoutGoalsAgainst += rpOppGoals;
            playerGoals += rpGoals;
            opponentGoals += rpOppGoals;
          }
          if (replayTie.secondLeg?.played) {
            const rpGoals = replayTie.secondLeg.homeTeam === playerName
              ? (replayTie.secondLeg.homeScore ?? 0)
              : (replayTie.secondLeg.awayScore ?? 0);
            const rpOppGoals = replayTie.secondLeg.homeTeam === playerName
              ? (replayTie.secondLeg.awayScore ?? 0)
              : (replayTie.secondLeg.homeScore ?? 0);
            knockoutGoalsFor += rpGoals;
            knockoutGoalsAgainst += rpOppGoals;
            playerGoals += rpGoals;
            opponentGoals += rpOppGoals;
          }
          if (replayTie.completed) {
            effectiveWinner = replayTie.winner;
            tieCompleted = true;
          }
        }
      } else {
        // Only trust the winner field if the tie is genuinely completed
        effectiveWinner = tieCompleted ? tie.winner : undefined;
      }

      const won = !!effectiveWinner && effectiveWinner === playerName;

      // Track elimination — only when tie is fully completed with a valid winner
      if (tieCompleted && !won && effectiveWinner) {
        eliminatedBy = effectiveWinner;
      }

      // Track tournament winner
      if (tieCompleted && won && round === 'final') {
        isWinner = true;
      }

      playerTies.push({
        tie,
        round,
        opponent,
        playerAgg: playerGoals,
        opponentAgg: opponentGoals,
        won,
        completed: tieCompleted,
      });
    }

    if (playerTies.length > 0) {
      // Sort ties by round hierarchy
      playerTies.sort(
        (a, b) => (ROUND_HIERARCHY[a.round] ?? 0) - (ROUND_HIERARCHY[b.round] ?? 0)
      );

      knockoutStats = {
        highestRound,
        knockoutGoalsFor,
        knockoutGoalsAgainst,
        eliminatedBy,
        isWinner,
        ties: playerTies.map((t) => ({
          round: t.round,
          opponent: t.opponent,
          playerAgg: t.playerAgg,
          opponentAgg: t.opponentAgg,
          won: t.won,
          completed: t.completed,
        })),
      };
    }
  }

  // --- Overall ---
  const groupPlayed = groupStats?.played ?? 0;
  const groupWon = groupStats?.won ?? 0;
  const groupDrawn = groupStats?.drawn ?? 0;
  const groupLost = groupStats?.lost ?? 0;
  const groupGF = groupStats?.goalsFor ?? 0;
  const groupGA = groupStats?.goalsAgainst ?? 0;

  // Knockout W/D/L: count from completed ties
  let koWon = 0;
  let koLost = 0;
  let koPlayed = 0;
  if (knockoutStats) {
    for (const t of knockoutStats.ties) {
      if (t.completed) {
        koPlayed++;
        if (t.won) koWon++;
        else koLost++;
      }
    }
  }

  const totalPlayed = groupPlayed + koPlayed;
  const totalWon = groupWon + koWon;
  const totalDrawn = groupDrawn;
  const totalLost = groupLost + koLost;
  const totalGoalsFor = groupGF + (knockoutStats?.knockoutGoalsFor ?? 0);
  const totalGoalsAgainst = groupGA + (knockoutStats?.knockoutGoalsAgainst ?? 0);

  // Tournament result
  let tournamentResult = 'Group Stage';
  if (knockoutStats) {
    if (knockoutStats.isWinner) {
      tournamentResult = 'Winner';
    } else if (knockoutStats.highestRound === 'final' && !knockoutStats.isWinner) {
      tournamentResult = 'Runner-up';
    } else {
      tournamentResult = ROUND_LABELS[knockoutStats.highestRound] ?? 'Knockout';
    }
  } else if (!groupStats) {
    tournamentResult = 'No Data';
  }

  return {
    group: groupStats,
    knockout: knockoutStats,
    totalGoalsFor,
    totalGoalsAgainst,
    totalPlayed,
    totalWon,
    totalDrawn,
    totalLost,
    tournamentResult,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

interface PlayerStatsModalProps {
  tournament: Tournament;
  playerName: string;
  onClose: () => void;
}

export default function PlayerStatsModal({
  tournament,
  playerName,
  onClose,
}: PlayerStatsModalProps) {
  const stats = useMemo(
    () => computePlayerTournamentStats(tournament, playerName),
    [tournament, playerName]
  );

  const resultBadge = getResultBadge(stats.tournamentResult);

  return (
    <Modal isOpen onClose={onClose} size="lg" title={playerName}>
      <div className="space-y-6">
        {/* Tournament Result Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-bold ${resultBadge.bg} ${resultBadge.text} border ${resultBadge.border}`}
          >
            {resultBadge.icon} {stats.tournamentResult}
          </span>
          <span className="text-sm text-light-600 dark:text-gray-400">
            {tournament.name}
          </span>
        </div>

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatCard label="Played" value={stats.totalPlayed} icon={<Swords className="w-4 h-4 text-cyber-400" />} />
          <StatCard label="Won" value={stats.totalWon} icon={<TrendingUp className="w-4 h-4 text-green-400" />} />
          <StatCard label="Drawn" value={stats.totalDrawn} icon={<Minus className="w-4 h-4 text-amber-400" />} />
          <StatCard label="Lost" value={stats.totalLost} icon={<TrendingDown className="w-4 h-4 text-red-400" />} />
          <StatCard label="GF" value={stats.totalGoalsFor} icon={<Target className="w-4 h-4 text-electric-400" />} />
          <StatCard label="GA" value={stats.totalGoalsAgainst} icon={<Shield className="w-4 h-4 text-pink-400" />} />
        </div>

        {/* Group Stage Section */}
        {stats.group && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-light-900 dark:text-white uppercase tracking-wider">
                Group Stage
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyber-500/20 text-cyber-400 border border-cyber-500/30">
                {stats.group.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  stats.group.qualified
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {stats.group.qualified ? 'Qualified' : 'Eliminated'}
              </span>
            </div>

            {/* Mini standings row */}
            <div className="bg-light-200/50 dark:bg-white/5 rounded-tech p-3 border border-black/10 dark:border-white/10">
              <div className="grid grid-cols-9 gap-2 text-center text-xs">
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">Pos</p>
                  <p className="font-bold text-light-900 dark:text-white">{getOrdinal(stats.group.position)}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">P</p>
                  <p className="font-bold text-light-900 dark:text-white">{stats.group.played}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">W</p>
                  <p className="font-bold text-green-400">{stats.group.won}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">D</p>
                  <p className="font-bold text-amber-400">{stats.group.drawn}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">L</p>
                  <p className="font-bold text-red-400">{stats.group.lost}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">GF</p>
                  <p className="font-bold text-light-900 dark:text-white">{stats.group.goalsFor}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">GA</p>
                  <p className="font-bold text-light-900 dark:text-white">{stats.group.goalsAgainst}</p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">GD</p>
                  <p className={`font-bold ${stats.group.goalDifference > 0 ? 'text-green-400' : stats.group.goalDifference < 0 ? 'text-red-400' : 'text-light-900 dark:text-white'}`}>
                    {stats.group.goalDifference > 0 ? '+' : ''}{stats.group.goalDifference}
                  </p>
                </div>
                <div>
                  <p className="text-light-500 dark:text-gray-500 mb-1">Pts</p>
                  <p className="font-bold text-cyber-400">{stats.group.points}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Knockout Journey Section */}
        {stats.knockout && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-light-900 dark:text-white uppercase tracking-wider">
                Knockout Journey
              </h3>
              {stats.knockout.highestRound && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    ROUND_COLORS[stats.knockout.highestRound]?.bg ?? 'bg-gray-500/20'
                  } ${ROUND_COLORS[stats.knockout.highestRound]?.text ?? 'text-gray-400'} border ${
                    ROUND_COLORS[stats.knockout.highestRound]?.border ?? 'border-gray-500/30'
                  }`}
                >
                  {ROUND_LABELS[stats.knockout.highestRound] ?? stats.knockout.highestRound}
                </span>
              )}
            </div>

            {/* Eliminated by / Winner */}
            {stats.knockout.eliminatedBy && (
              <p className="mt-3 text-sm text-red-400">
                Knocked out by <span className="font-semibold">{stats.knockout.eliminatedBy}</span> in the {ROUND_LABELS[stats.knockout.highestRound] ?? stats.knockout.highestRound}
              </p>
            )}
            {stats.knockout.isWinner && (
              <p className="mt-3 text-sm text-yellow-400 font-semibold flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Tournament Winner
              </p>
            )}
          </section>
        )}

        {/* No data state */}
        {!stats.group && !stats.knockout && (
          <div className="text-center py-8">
            <p className="text-light-600 dark:text-gray-400">
              No match data available for this player yet.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-light-200/50 dark:bg-white/5 rounded-tech p-2.5 border border-black/10 dark:border-white/10 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-light-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-light-500 dark:text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getResultBadge(result: string): { bg: string; text: string; border: string; icon: string } {
  switch (result) {
    case 'Winner':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '\u{1F3C6}' };
    case 'Runner-up':
      return { bg: 'bg-gray-300/20', text: 'text-light-700 dark:text-gray-300', border: 'border-gray-300/30', icon: '\u{1F948}' };
    case 'Semi Finals':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: '\u{1F3C5}' };
    case 'Quarter Finals':
      return { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', icon: '\u{1F396}' };
    case 'Round of 16':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', icon: '\u{26BD}' };
    case 'Group Stage':
      return { bg: 'bg-gray-500/20', text: 'text-light-700 dark:text-gray-400', border: 'border-gray-500/30', icon: '\u{1F4CB}' };
    default:
      return { bg: 'bg-gray-500/20', text: 'text-light-700 dark:text-gray-400', border: 'border-gray-500/30', icon: '\u{2796}' };
  }
}
