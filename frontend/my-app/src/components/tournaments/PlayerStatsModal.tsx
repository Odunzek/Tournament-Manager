"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Shield, Swords, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Modal from '../ui/Modal';
import { Tournament, KnockoutTie } from '@/lib/tournamentUtils';
import { UCLMatch, computeLeagueStandings, applyZones, computeUCLCutoffs, UCLStanding } from '@/lib/uclUtils';

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

interface UCLLeaguePhaseStats {
  standing: UCLStanding;
  pairings: Array<{
    opponentName: string;
    home: UCLMatch | null;
    away: UCLMatch | null;
  }>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROUND_HIERARCHY: Record<string, number> = {
  playoff: -1,
  round_16: 0,
  quarter_final: 1,
  semi_final: 2,
  final: 3,
};

const ROUND_LABELS: Record<string, string> = {
  playoff: 'Playoff',
  round_16: 'Round of 16',
  quarter_final: 'Quarter Finals',
  semi_final: 'Semi Finals',
  final: 'Final',
};

const ROUND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  playoff: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  round_16: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  quarter_final: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  semi_final: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  final: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

const ZONE_STYLES = {
  direct:   { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30',  label: 'Direct Qualifier' },
  playoff:  { bg: 'bg-cyber-500/15',  text: 'text-cyber-400',  border: 'border-cyber-500/30',  label: 'Playoff' },
  eliminated: { bg: 'bg-red-500/15', text: 'text-red-400',    border: 'border-red-500/30',    label: 'Eliminated' },
};

// ─── UCL League Phase Stats ──────────────────────────────────────────────────

function computeUCLLeaguePhaseStats(
  uclMatches: UCLMatch[],
  playerName: string
): UCLLeaguePhaseStats | null {
  // Build players list from all matches
  const playerMap = new Map<string, string>();
  for (const m of uclMatches) {
    playerMap.set(m.playerAId, m.playerAName);
    playerMap.set(m.playerBId, m.playerBName);
  }
  const players = Array.from(playerMap.entries()).map(([id, name]) => ({ id, name }));
  const playerId = players.find(p => p.name === playerName)?.id;
  if (!playerId) return null;

  // Compute standings without pot info (not needed here)
  const raw = computeLeagueStandings(uclMatches, players, {});
  const cutoffs = computeUCLCutoffs(players.length);
  const standings = applyZones(raw, cutoffs);
  const standing = standings.find(s => s.memberId === playerId);
  if (!standing) return null;

  // Build H/A pairings per opponent
  const pairingMap = new Map<string, { opponentName: string; home: UCLMatch | null; away: UCLMatch | null }>();
  for (const m of uclMatches) {
    const isA = m.playerAId === playerId;
    const isB = m.playerBId === playerId;
    if (!isA && !isB) continue;

    const oppId = isA ? m.playerBId : m.playerAId;
    const oppName = isA ? m.playerBName : m.playerAName;
    if (!pairingMap.has(oppId)) pairingMap.set(oppId, { opponentName: oppName, home: null, away: null });
    const pair = pairingMap.get(oppId)!;
    if (isA) pair.home = m;
    else pair.away = m;
  }

  const pairings = Array.from(pairingMap.values())
    .sort((a, b) => a.opponentName.localeCompare(b.opponentName));

  return { standing, pairings };
}

// ─── Champions-League Stats Computation ─────────────────────────────────────

function computePlayerTournamentStats(
  tournament: Tournament,
  playerName: string
): PlayerTournamentStats {
  // --- Group Stage ---
  let groupStats: PlayerTournamentStats['group'] = null;

  if (tournament.groups) {
    for (const group of tournament.groups) {
      const standing = group.standings.find(s => s.teamName === playerName);
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

    let highestRoundValue = -2;
    let highestRound = '';
    let eliminatedBy: string | null = null;
    let isWinner = false;
    let knockoutGoalsFor = 0;
    let knockoutGoalsAgainst = 0;

    for (const tie of tournament.knockoutBracket) {
      if (tie.originalTieId) continue;

      const isTeam1 = tie.team1 === playerName;
      const isTeam2 = tie.team2 === playerName;
      if (!isTeam1 && !isTeam2) continue;

      const opponent = isTeam1 ? tie.team2 : tie.team1;
      const round = tie.round;

      const roundValue = ROUND_HIERARCHY[round] ?? -1;
      if (roundValue > highestRoundValue) {
        highestRoundValue = roundValue;
        highestRound = round;
      }

      let playerGoals = 0;
      let opponentGoals = 0;

      if (tie.firstLeg?.played) {
        playerGoals += tie.firstLeg.homeTeam === playerName
          ? (tie.firstLeg.homeScore ?? 0) : (tie.firstLeg.awayScore ?? 0);
        opponentGoals += tie.firstLeg.homeTeam === playerName
          ? (tie.firstLeg.awayScore ?? 0) : (tie.firstLeg.homeScore ?? 0);
      }
      if (tie.secondLeg?.played) {
        playerGoals += tie.secondLeg.homeTeam === playerName
          ? (tie.secondLeg.homeScore ?? 0) : (tie.secondLeg.awayScore ?? 0);
        opponentGoals += tie.secondLeg.homeTeam === playerName
          ? (tie.secondLeg.awayScore ?? 0) : (tie.secondLeg.homeScore ?? 0);
      }

      knockoutGoalsFor += playerGoals;
      knockoutGoalsAgainst += opponentGoals;

      const anyLegPlayed = !!tie.firstLeg?.played || !!tie.secondLeg?.played;
      let effectiveWinner: string | undefined;
      let tieCompleted = tie.completed && anyLegPlayed;

      if (tie.awaitingReplay && tie.replayTieId) {
        const replayTie = tournament.knockoutBracket.find(t => t.id === tie.replayTieId);
        if (replayTie) {
          if (replayTie.firstLeg?.played) {
            const rpGoals = replayTie.firstLeg.homeTeam === playerName
              ? (replayTie.firstLeg.homeScore ?? 0) : (replayTie.firstLeg.awayScore ?? 0);
            const rpOppGoals = replayTie.firstLeg.homeTeam === playerName
              ? (replayTie.firstLeg.awayScore ?? 0) : (replayTie.firstLeg.homeScore ?? 0);
            knockoutGoalsFor += rpGoals;
            knockoutGoalsAgainst += rpOppGoals;
            playerGoals += rpGoals;
            opponentGoals += rpOppGoals;
          }
          if (replayTie.secondLeg?.played) {
            const rpGoals = replayTie.secondLeg.homeTeam === playerName
              ? (replayTie.secondLeg.homeScore ?? 0) : (replayTie.secondLeg.awayScore ?? 0);
            const rpOppGoals = replayTie.secondLeg.homeTeam === playerName
              ? (replayTie.secondLeg.awayScore ?? 0) : (replayTie.secondLeg.homeScore ?? 0);
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
        effectiveWinner = tieCompleted ? tie.winner : undefined;
      }

      const won = !!effectiveWinner && effectiveWinner === playerName;
      if (tieCompleted && !won && effectiveWinner) eliminatedBy = effectiveWinner;
      if (tieCompleted && won && round === 'final') isWinner = true;

      playerTies.push({ tie, round, opponent, playerAgg: playerGoals, opponentAgg: opponentGoals, won, completed: tieCompleted });
    }

    if (playerTies.length > 0) {
      playerTies.sort((a, b) => (ROUND_HIERARCHY[a.round] ?? 0) - (ROUND_HIERARCHY[b.round] ?? 0));
      knockoutStats = {
        highestRound,
        knockoutGoalsFor,
        knockoutGoalsAgainst,
        eliminatedBy,
        isWinner,
        ties: playerTies.map(t => ({
          round: t.round, opponent: t.opponent,
          playerAgg: t.playerAgg, opponentAgg: t.opponentAgg,
          won: t.won, completed: t.completed,
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

  let koWon = 0, koLost = 0, koPlayed = 0;
  if (knockoutStats) {
    for (const t of knockoutStats.ties) {
      if (t.completed) { koPlayed++; if (t.won) koWon++; else koLost++; }
    }
  }

  let tournamentResult = 'Group Stage';
  if (knockoutStats) {
    if (knockoutStats.isWinner) tournamentResult = 'Winner';
    else if (knockoutStats.highestRound === 'final') tournamentResult = 'Runner-up';
    else tournamentResult = ROUND_LABELS[knockoutStats.highestRound] ?? 'Knockout';
  } else if (!groupStats) {
    tournamentResult = 'No Data';
  }

  return {
    group: groupStats,
    knockout: knockoutStats,
    totalGoalsFor: groupGF + (knockoutStats?.knockoutGoalsFor ?? 0),
    totalGoalsAgainst: groupGA + (knockoutStats?.knockoutGoalsAgainst ?? 0),
    totalPlayed: groupPlayed + koPlayed,
    totalWon: groupWon + koWon,
    totalDrawn: groupDrawn,
    totalLost: groupLost + koLost,
    tournamentResult,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

interface PlayerStatsModalProps {
  tournament: Tournament;
  playerName: string;
  onClose: () => void;
  uclMatches?: UCLMatch[];
}

export default function PlayerStatsModal({ tournament, playerName, onClose, uclMatches }: PlayerStatsModalProps) {
  const isUCL = tournament.type === 'ucl';

  const uclLeague = useMemo(
    () => isUCL && uclMatches ? computeUCLLeaguePhaseStats(uclMatches, playerName) : null,
    [isUCL, uclMatches, playerName]
  );

  const stats = useMemo(
    () => computePlayerTournamentStats(tournament, playerName),
    [tournament, playerName]
  );

  // For UCL, derive totals from league standing + knockout
  const totalPlayed = isUCL
    ? (uclLeague?.standing.played ?? 0) + (stats.totalPlayed)
    : stats.totalPlayed;
  const totalWon = isUCL
    ? (uclLeague?.standing.won ?? 0) + (stats.totalWon)
    : stats.totalWon;
  const totalDrawn = isUCL
    ? (uclLeague?.standing.drawn ?? 0) + (stats.totalDrawn)
    : stats.totalDrawn;
  const totalLost = isUCL
    ? (uclLeague?.standing.lost ?? 0) + (stats.totalLost)
    : stats.totalLost;
  const totalGF = isUCL
    ? (uclLeague?.standing.goalsFor ?? 0) + (stats.totalGoalsFor)
    : stats.totalGoalsFor;
  const totalGA = isUCL
    ? (uclLeague?.standing.goalsAgainst ?? 0) + (stats.totalGoalsAgainst)
    : stats.totalGoalsAgainst;

  // Tournament result label
  let tournamentResult = stats.tournamentResult;
  if (isUCL && !stats.knockout) {
    const zone = uclLeague?.standing.zone;
    tournamentResult = zone === 'direct' ? 'Direct Qualifier' : zone === 'playoff' ? 'Playoff' : zone === 'eliminated' ? 'Eliminated' : 'League Phase';
  }

  const resultBadge = getResultBadge(tournamentResult);

  return (
    <Modal isOpen onClose={onClose} size="lg" title={playerName}>
      <div className="space-y-6">

        {/* Result Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${resultBadge.bg} ${resultBadge.text} border ${resultBadge.border}`}>
            {resultBadge.icon} {tournamentResult}
          </span>
          <span className="text-sm text-light-600 dark:text-gray-400">{tournament.name}</span>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatCard label="Played" value={totalPlayed} icon={<Swords className="w-4 h-4 text-cyber-400" />} />
          <StatCard label="Won"    value={totalWon}    icon={<TrendingUp className="w-4 h-4 text-green-400" />} />
          <StatCard label="Drawn"  value={totalDrawn}  icon={<Minus className="w-4 h-4 text-amber-400" />} />
          <StatCard label="Lost"   value={totalLost}   icon={<TrendingDown className="w-4 h-4 text-red-400" />} />
          <StatCard label="GF"     value={totalGF}     icon={<Target className="w-4 h-4 text-electric-400" />} />
          <StatCard label="GA"     value={totalGA}     icon={<Shield className="w-4 h-4 text-pink-400" />} />
        </div>

        {/* UCL: League Phase */}
        {isUCL && uclLeague && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-light-900 dark:text-white uppercase tracking-wider">League Phase</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ZONE_STYLES[uclLeague.standing.zone].bg} ${ZONE_STYLES[uclLeague.standing.zone].text} ${ZONE_STYLES[uclLeague.standing.zone].border}`}>
                {ZONE_STYLES[uclLeague.standing.zone].label}
              </span>
            </div>

            {/* Mini stats row */}
            <div className="bg-light-200/50 dark:bg-white/5 rounded-tech p-3 border border-black/10 dark:border-white/10 mb-3">
              <div className="grid grid-cols-8 gap-1 text-center text-xs">
                {[
                  { label: 'Pos', value: getOrdinal(uclLeague.standing.position), color: 'text-light-900 dark:text-white' },
                  { label: 'P',   value: uclLeague.standing.played,              color: 'text-light-900 dark:text-white' },
                  { label: 'W',   value: uclLeague.standing.won,                 color: 'text-green-400' },
                  { label: 'D',   value: uclLeague.standing.drawn,               color: 'text-amber-400' },
                  { label: 'L',   value: uclLeague.standing.lost,                color: 'text-red-400' },
                  { label: 'GD',  value: (uclLeague.standing.goalDifference > 0 ? '+' : '') + uclLeague.standing.goalDifference, color: uclLeague.standing.goalDifference > 0 ? 'text-green-400' : uclLeague.standing.goalDifference < 0 ? 'text-red-400' : 'text-light-900 dark:text-white' },
                  { label: 'Pts', value: uclLeague.standing.points,              color: 'text-light-900 dark:text-white font-bold' },
                  { label: 'Form', value: null, color: '' },
                ].map(({ label, value, color }) =>
                  label === 'Form' ? (
                    <div key="form">
                      <p className="text-light-500 dark:text-gray-500 mb-1">Form</p>
                      <div className="flex gap-0.5 justify-center">
                        {uclLeague.standing.form.length
                          ? uclLeague.standing.form.map((r, i) => (
                              <div key={i} className={`w-2 h-3 rounded-sm ${r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                            ))
                          : <span className="text-light-500 dark:text-gray-600 text-[10px]">—</span>
                        }
                      </div>
                    </div>
                  ) : (
                    <div key={label}>
                      <p className="text-light-500 dark:text-gray-500 mb-1">{label}</p>
                      <p className={`font-bold ${color}`}>{value}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* H/A results per opponent */}
            <div className="space-y-1">
              {uclLeague.pairings.map(pair => {
                const hMatch = pair.home;
                const aMatch = pair.away;
                return (
                  <div key={pair.opponentName} className="flex items-center justify-between px-3 py-2 rounded-tech bg-light-100/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <span className="text-sm font-semibold text-light-900 dark:text-white truncate min-w-0 flex-1">vs {pair.opponentName}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {hMatch && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black text-cyber-400 uppercase">H</span>
                          {hMatch.played
                            ? <ScoreSpan myScore={hMatch.scoreA} oppScore={hMatch.scoreB} />
                            : <span className="text-[10px] text-light-400 dark:text-gray-600">TBP</span>
                          }
                        </div>
                      )}
                      {aMatch && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black text-electric-400 uppercase">A</span>
                          {aMatch.played
                            ? <ScoreSpan myScore={aMatch.scoreB} oppScore={aMatch.scoreA} />
                            : <span className="text-[10px] text-light-400 dark:text-gray-600">TBP</span>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Non-UCL: Group Stage */}
        {!isUCL && stats.group && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-light-900 dark:text-white uppercase tracking-wider">Group Stage</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyber-500/20 text-cyber-400 border border-cyber-500/30">{stats.group.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stats.group.qualified ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {stats.group.qualified ? 'Qualified' : 'Eliminated'}
              </span>
            </div>
            <div className="bg-light-200/50 dark:bg-white/5 rounded-tech p-3 border border-black/10 dark:border-white/10">
              <div className="grid grid-cols-9 gap-2 text-center text-xs">
                {[
                  { label: 'Pos', value: getOrdinal(stats.group.position), color: '' },
                  { label: 'P',   value: stats.group.played,              color: '' },
                  { label: 'W',   value: stats.group.won,                 color: 'text-green-400' },
                  { label: 'D',   value: stats.group.drawn,               color: 'text-amber-400' },
                  { label: 'L',   value: stats.group.lost,                color: 'text-red-400' },
                  { label: 'GF',  value: stats.group.goalsFor,            color: '' },
                  { label: 'GA',  value: stats.group.goalsAgainst,        color: '' },
                  { label: 'GD',  value: (stats.group.goalDifference > 0 ? '+' : '') + stats.group.goalDifference, color: stats.group.goalDifference > 0 ? 'text-green-400' : stats.group.goalDifference < 0 ? 'text-red-400' : '' },
                  { label: 'Pts', value: stats.group.points,              color: 'text-cyber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-light-500 dark:text-gray-500 mb-1">{label}</p>
                    <p className={`font-bold text-light-900 dark:text-white ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Knockout Journey */}
        {stats.knockout && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-light-900 dark:text-white uppercase tracking-wider">Knockout Journey</h3>
              {stats.knockout.highestRound && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ROUND_COLORS[stats.knockout.highestRound]?.bg ?? 'bg-gray-500/20'} ${ROUND_COLORS[stats.knockout.highestRound]?.text ?? 'text-gray-400'} ${ROUND_COLORS[stats.knockout.highestRound]?.border ?? 'border-gray-500/30'}`}>
                  {ROUND_LABELS[stats.knockout.highestRound] ?? stats.knockout.highestRound}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {stats.knockout.ties.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-tech border ${t.completed ? (t.won ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20') : 'bg-light-100/50 dark:bg-white/5 border-black/10 dark:border-white/10'}`}
                >
                  <div>
                    <p className="text-xs font-semibold text-light-500 dark:text-gray-500 uppercase">{ROUND_LABELS[t.round] ?? t.round}</p>
                    <p className="text-sm font-bold text-light-900 dark:text-white">vs {t.opponent}</p>
                  </div>
                  {t.completed ? (
                    <div className="text-right">
                      <p className={`text-lg font-black tabular-nums ${t.won ? 'text-green-400' : 'text-red-400'}`}>{t.playerAgg}–{t.opponentAgg}</p>
                      <p className={`text-xs font-bold ${t.won ? 'text-green-400' : 'text-red-400'}`}>{t.won ? 'Advanced' : 'Eliminated'}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-light-500 dark:text-gray-500">Ongoing</span>
                  )}
                </motion.div>
              ))}
            </div>

            {stats.knockout.eliminatedBy && (
              <p className="mt-3 text-sm text-red-400">
                Knocked out by <span className="font-semibold">{stats.knockout.eliminatedBy}</span>
                {' '}in the {ROUND_LABELS[stats.knockout.highestRound] ?? stats.knockout.highestRound}
              </p>
            )}
            {stats.knockout.isWinner && (
              <p className="mt-3 text-sm text-yellow-400 font-semibold flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Tournament Winner
              </p>
            )}
          </section>
        )}

        {/* No data */}
        {!stats.group && !stats.knockout && !uclLeague && (
          <div className="text-center py-8">
            <p className="text-light-600 dark:text-gray-400">No match data available yet.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ScoreSpan({ myScore, oppScore }: { myScore: number | null; oppScore: number | null }) {
  const won = (myScore ?? 0) > (oppScore ?? 0);
  const lost = (myScore ?? 0) < (oppScore ?? 0);
  return (
    <span className={`text-xs font-bold tabular-nums ${won ? 'text-green-400' : lost ? 'text-red-400' : 'text-yellow-400'}`}>
      {myScore}–{oppScore}
    </span>
  );
}

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
    case 'Winner':           return { bg: 'bg-yellow-500/20', text: 'text-yellow-400',  border: 'border-yellow-500/30',  icon: '🏆' };
    case 'Runner-up':        return { bg: 'bg-gray-300/20',   text: 'text-light-700 dark:text-gray-300', border: 'border-gray-300/30', icon: '🥈' };
    case 'Semi Finals':      return { bg: 'bg-amber-500/20',  text: 'text-amber-400',   border: 'border-amber-500/30',   icon: '🥅' };
    case 'Quarter Finals':   return { bg: 'bg-pink-500/20',   text: 'text-pink-400',    border: 'border-pink-500/30',    icon: '🎖️' };
    case 'Round of 16':      return { bg: 'bg-cyan-500/20',   text: 'text-cyan-400',    border: 'border-cyan-500/30',    icon: '⚽' };
    case 'Playoff':          return { bg: 'bg-orange-500/20', text: 'text-orange-400',  border: 'border-orange-500/30',  icon: '⚔️' };
    case 'Direct Qualifier': return { bg: 'bg-green-500/20',  text: 'text-green-400',   border: 'border-green-500/30',   icon: '✅' };
    case 'Eliminated':       return { bg: 'bg-red-500/20',    text: 'text-red-400',     border: 'border-red-500/30',     icon: '✗' };
    case 'Group Stage':      return { bg: 'bg-gray-500/20',   text: 'text-light-700 dark:text-gray-400', border: 'border-gray-500/30', icon: '📋' };
    default:                 return { bg: 'bg-gray-500/20',   text: 'text-light-700 dark:text-gray-400', border: 'border-gray-500/30', icon: '➖' };
  }
}
