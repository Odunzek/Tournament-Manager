/**
 * Player League Detail Page — `/leagues/[id]/players/[playerId]`
 *
 * Shows comprehensive stats for a single player within a specific league.
 * Accessible by clicking any player name in the StandingsTable.
 *
 * Data fetched (all client-side from Firestore via hooks + utils):
 *   - Full league data (`useLeague`) and all matches (`useLeagueMatches`).
 *   - Standings are recalculated to find this player's rank and stats.
 *   - `getPlayerLeagueStats` returns the player's match history, unfaced opponents,
 *     and win rate.
 *
 * Head-to-head section (OpponentRow component):
 *   - Groups all matches by opponent with aggregate W/D/L summary visible at a glance.
 *   - Expanding an opponent row shows individual match scores and dates.
 *   - "Leg N" labels appear when multiple matches were played against the same opponent.
 *
 * The page also shows:
 *   - League position (with Crown/Medal icons for top 3)
 *   - Full P/W/D/L/GF/GA/GD/Pts stat line
 *   - Win rate percentage
 *   - Players not yet faced (remaining round-robin fixtures)
 */
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, CheckCircle, Clock, Loader2, Crown, Medal, ChevronDown, ChevronUp } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import Card from '@/components/ui/Card';
import { useLeague, useLeagueMatches } from '@/hooks/useLeagues';
import { usePlayers } from '@/hooks/usePlayers';
import { calculateStandings, getPlayerLeagueStats, convertTimestamp } from '@/lib/leagueUtils';
import { LeaguePlayer } from '@/types/league';

/**
 * OpponentRow — Collapsible row showing H2H record against a single opponent.
 *
 * The collapsed state shows the opponent's name and aggregate W/D/L stats inline.
 * Expanding reveals individual match rows with score, result badge, and leg number
 * (when there are multiple legs, e.g., if the round-robin has home+away matches).
 *
 * `getMatchResult` is passed from the parent so it can determine W/D/L from the
 * perspective of the player being viewed (not always playerA in the match record).
 */
function OpponentRow({
  group,
  playerId,
  wins,
  draws,
  losses,
  getMatchResult,
}: {
  group: { id: string; name: string; matches: any[] };
  playerId: string;
  wins: number;
  draws: number;
  losses: number;
  getMatchResult: (match: any) => { label: string; color: string; bg: string };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-light-100/50 dark:bg-white/5 rounded-xl transition-colors hover:bg-light-200/50 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-light-900 dark:text-white truncate">vs {group.name}</span>
          <div className="flex items-center gap-1.5 text-[10px] shrink-0">
            <span className="text-green-400 font-semibold">{wins}W</span>
            <span className="text-yellow-400 font-semibold">{draws}D</span>
            <span className="text-red-400 font-semibold">{losses}L</span>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-light-500 dark:text-gray-500 shrink-0 ml-2" />
          : <ChevronDown className="w-4 h-4 text-light-500 dark:text-gray-500 shrink-0 ml-2" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 pl-2 space-y-1.5">
              {group.matches.map((match, legIndex) => {
                const isPlayerA = match.playerA === playerId;
                const playerScore = isPlayerA ? match.scoreA : match.scoreB;
                const opponentScore = isPlayerA ? match.scoreB : match.scoreA;
                const result = getMatchResult(match);
                return (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg border ${result.bg}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold w-4 text-center ${result.color}`}>{result.label}</span>
                      {group.matches.length > 1 && (
                        <span className="text-xs text-light-500 dark:text-gray-500">Leg {legIndex + 1}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${result.color}`}>
                        {playerScore} – {opponentScore}
                      </span>
                      <span className="text-xs text-light-500 dark:text-gray-400">
                        {convertTimestamp(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlayerLeagueStatsPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;
  const playerId = params.playerId as string;

  const { league, loading: leagueLoading } = useLeague(leagueId);
  const { matches, loading: matchesLoading } = useLeagueMatches(leagueId);
  const { players } = usePlayers();

  const [playerStats, setPlayerStats] = useState<{
    player: LeaguePlayer;
    matchesPlayed: any[];
    notPlayedYetNames: string[];
    winRate: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    const calculateData = async () => {
      if (!league?.id || players.length === 0) return;

      setIsCalculating(true);
      try {
        let leaguePlayers = [];

        if (league.playerIds && league.playerIds.length > 0) {
          leaguePlayers = players.filter((p) => league.playerIds.includes(p.id!));
        } else {
          const playerIdsFromMatches = new Set<string>();
          const playerNamesMap = new Map<string, string>();

          matches.forEach((match) => {
            if (match.playerA) {
              playerIdsFromMatches.add(match.playerA);
              if (match.playerAName) playerNamesMap.set(match.playerA, match.playerAName);
            }
            if (match.playerB) {
              playerIdsFromMatches.add(match.playerB);
              if (match.playerBName) playerNamesMap.set(match.playerB, match.playerBName);
            }
          });

          playerIdsFromMatches.forEach((pId) => {
            const realPlayer = players.find((player) => player.id === pId);
            if (realPlayer) {
              leaguePlayers.push(realPlayer);
            } else if (pId.startsWith('legacy_')) {
              const playerName = playerNamesMap.get(pId) || pId.replace('legacy_', '').replace(/_/g, ' ');
              leaguePlayers.push({
                id: pId,
                name: playerName,
                psnId: playerName,
                createdAt: null,
                updatedAt: null,
              });
            }
          });
        }

        const standings = await calculateStandings(league.id, leaguePlayers);
        const stats = await getPlayerLeagueStats(league.id, playerId, standings, players);

        setPlayerStats(stats);
      } catch (error) {
        console.error('Error calculating player stats:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateData();
  }, [league, players, playerId, matches]);

  const loading = leagueLoading || matchesLoading || isCalculating;

  if (loading) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-4 sm:py-8">
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-light-600 dark:text-gray-400">Loading player stats...</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!league || !playerStats) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-4 sm:py-8">
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-light-700 dark:text-gray-400 mb-2">Player Not Found</h3>
            <p className="text-light-500 dark:text-gray-500 mb-6">This player is not in this league</p>
            <button
              onClick={() => router.push(`/leagues/${leagueId}`)}
              className="px-6 py-2 bg-cyber-500 hover:bg-cyber-600 text-white rounded-tech-lg transition-colors"
            >
              Back to League
            </button>
          </div>
        </Container>
      </MainLayout>
    );
  }

  const { player, matchesPlayed, notPlayedYetNames, winRate } = playerStats;

  const getPositionBadge = () => {
    if (player.position === 1) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full">
          <Crown className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-bold text-yellow-400 text-xs">1st Place</span>
        </div>
      );
    } else if (player.position === 2) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30 rounded-full">
          <Medal className="w-3.5 h-3.5 text-light-600 dark:text-gray-300" />
          <span className="font-bold text-light-600 dark:text-gray-300 text-xs">2nd Place</span>
        </div>
      );
    } else if (player.position === 3) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-full">
          <Medal className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-bold text-orange-400 text-xs">3rd Place</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 rounded-full">
        <Trophy className="w-3.5 h-3.5 text-light-500 dark:text-gray-400" />
        <span className="font-bold text-light-500 dark:text-gray-400 text-xs">{player.position}th Place</span>
      </div>
    );
  };

  const getFormIndicator = (form: ('W' | 'D' | 'L')[]) => {
    return (
      <div className="flex gap-1.5">
        {form.slice(0, 5).map((result, index) => {
          const config = {
            W: { label: 'W', bg: 'bg-green-500', text: 'text-white', title: 'Win' },
            D: { label: 'D', bg: 'bg-yellow-500', text: 'text-white', title: 'Draw' },
            L: { label: 'L', bg: 'bg-red-500', text: 'text-white', title: 'Loss' },
          };
          const c = config[result];
          return (
            <div
              key={index}
              className={`w-7 h-7 ${c.bg} ${c.text} rounded-lg flex items-center justify-center font-bold text-xs`}
              title={c.title}
            >
              {c.label}
            </div>
          );
        })}
      </div>
    );
  };

  const getMatchResult = (match: any) => {
    const isPlayerA = match.playerA === playerId;
    const playerScore = isPlayerA ? match.scoreA : match.scoreB;
    const opponentScore = isPlayerA ? match.scoreB : match.scoreA;

    if (playerScore > opponentScore) {
      return { label: 'W', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
    } else if (playerScore < opponentScore) {
      return { label: 'L', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    } else {
      return { label: 'D', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' };
    }
  };

  // Group matches by opponent for H&A pairing
  const opponentGroups = matchesPlayed.reduce<{ id: string; name: string; matches: typeof matchesPlayed }[]>((groups, match) => {
    const isPlayerA = match.playerA === playerId;
    const oppId = isPlayerA ? match.playerB : match.playerA;
    const oppName = isPlayerA ? match.playerBName : match.playerAName;
    const group = groups.find((g) => g.id === oppId);
    if (group) group.matches.push(match);
    else groups.push({ id: oppId, name: oppName, matches: [match] });
    return groups;
  }, []);

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-2 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/leagues/${leagueId}?section=standings`)}
          className="flex items-center gap-2 text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors mb-1 sm:mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Standings</span>
        </button>

        {/* Player Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 sm:mb-6"
        >
          <Card variant="glass" className="bg-gradient-to-br from-cyber-500/20 to-electric-500/20 border border-cyber-500/30">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-3xl font-bold text-light-900 dark:text-white mb-0.5 sm:mb-1 truncate">{player.name}</h1>
                <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400">{league.name}</p>
              </div>
              {getPositionBadge()}
            </div>
          </Card>
        </motion.div>

        {/* League Stats Summary */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-light-900 dark:text-white mb-2 sm:mb-3">League Stats</h2>

          <Card variant="glass" className="mb-3">
            <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10">
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Position</p>
                <p className="text-base sm:text-2xl font-bold text-cyber-400">{player.position || 0}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Points</p>
                <p className="text-base sm:text-2xl font-bold text-electric-400">{player.points || 0}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Played</p>
                <p className="text-base sm:text-2xl font-bold text-light-900 dark:text-white">{player.played || 0}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Win Rate</p>
                <p className="text-base sm:text-2xl font-bold text-green-400">{isNaN(winRate) ? 0 : winRate.toFixed(0)}%</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10">
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Won</p>
                <p className="text-base sm:text-2xl font-bold text-green-400">{player.won || 0}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Draw</p>
                <p className="text-base sm:text-2xl font-bold text-yellow-400">{player.draw || 0}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Lost</p>
                <p className="text-base sm:text-2xl font-bold text-red-400">{player.lost || 0}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">GD</p>
                <p className={`text-base sm:text-2xl font-bold ${(player.goalDifference || 0) > 0 ? 'text-green-400' : (player.goalDifference || 0) < 0 ? 'text-red-400' : 'text-light-500 dark:text-gray-400'}`}>
                  {(player.goalDifference || 0) > 0 ? '+' : ''}{player.goalDifference || 0}
                </p>
              </div>
            </div>
          </Card>

          {player.form.length > 0 && (
            <Card variant="glass" className="mt-3 ">
              <p className="text-xs font-semibold text-light-600 dark:text-gray-300 mb-2">Last 5 Matches</p>
              {getFormIndicator(player.form)}
            </Card>
          )}
        </div>

        {/* Played Against — collapsible H&A rows */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Played Against ({opponentGroups.length} {opponentGroups.length === 1 ? 'player' : 'players'})
          </h2>

          {opponentGroups.length > 0 ? (
            <div className="space-y-2">
              {opponentGroups.map((group) => {
                const groupWins = group.matches.filter((m) => getMatchResult(m).label === 'W').length;
                const groupDraws = group.matches.filter((m) => getMatchResult(m).label === 'D').length;
                const groupLosses = group.matches.filter((m) => getMatchResult(m).label === 'L').length;
                return (
                  <OpponentRow
                    key={group.id}
                    group={group}
                    playerId={playerId}
                    wins={groupWins}
                    draws={groupDraws}
                    losses={groupLosses}
                    getMatchResult={getMatchResult}
                  />
                );
              })}
            </div>
          ) : (
            <Card variant="glass">
              <div className="text-center py-8">
                <p className="text-light-600 dark:text-gray-400 text-sm">No matches played yet</p>
              </div>
            </Card>
          )}
        </div>

        {/* Not Played Yet */}
        {notPlayedYetNames.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Not Played Yet ({notPlayedYetNames.length} {notPlayedYetNames.length === 1 ? 'player' : 'players'})
            </h2>

            <Card variant="glass">
              <div className="flex flex-wrap gap-2">
                {notPlayedYetNames.map((name, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-light-200/50 dark:bg-dark-100 border border-black/10 dark:border-white/10 rounded-full text-xs text-light-700 dark:text-gray-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Container>
    </MainLayout>
  );
}
