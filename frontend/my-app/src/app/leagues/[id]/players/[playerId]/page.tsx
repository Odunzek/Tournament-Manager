"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, CheckCircle, Clock, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import Card from '@/components/ui/Card';
import { useLeague, useLeagueMatches } from '@/hooks/useLeagues';
import { usePlayers } from '@/hooks/usePlayers';
import { calculateStandings, getPlayerLeagueStats, convertTimestamp } from '@/lib/leagueUtils';
import { LeaguePlayer } from '@/types/league';

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

  // Calculate player stats
  useEffect(() => {
    const calculateData = async () => {
      if (!league?.id || players.length === 0) return;

      setIsCalculating(true);
      try {
        // Build league players list (support both new and old leagues)
        let leaguePlayers = [];

        if (league.playerIds && league.playerIds.length > 0) {
          // New league format - use playerIds
          leaguePlayers = players.filter((p) => league.playerIds.includes(p.id!));
        } else {
          // Old league format - extract player IDs from matches
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

          // Build player list: real players + virtual players for legacy IDs
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
        <Container maxWidth="2xl" className="py-8 sm:py-12">
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading player stats...</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!league || !playerStats) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-8 sm:py-12">
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-gray-400 mb-2">Player Not Found</h3>
            <p className="text-gray-500 mb-6">This player is not in this league</p>
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
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/30 rounded-full">
          <span className="text-2xl">🥇</span>
          <span className="font-bold text-yellow-400">1st Place</span>
        </div>
      );
    } else if (player.position === 2) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/30 rounded-full">
          <span className="text-2xl">🥈</span>
          <span className="font-bold text-gray-300">2nd Place</span>
        </div>
      );
    } else if (player.position === 3) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-500/30 rounded-full">
          <span className="text-2xl">🥉</span>
          <span className="font-bold text-orange-400">3rd Place</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-dark-100/50 border-2 border-white/10 rounded-full">
        <Trophy className="w-5 h-5 text-gray-400" />
        <span className="font-bold text-gray-400">{player.position}th Place</span>
      </div>
    );
  };

  const getFormIndicator = (form: ('W' | 'D' | 'L')[]) => {
    return (
      <div className="flex gap-2">
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
              className={`w-8 h-8 ${c.bg} ${c.text} rounded-lg flex items-center justify-center font-bold text-sm`}
              title={c.title}
            >
              {c.label}
            </div>
          );
        })}
      </div>
    );
  };

  const getMatchResultIcon = (match: any) => {
    const isPlayerA = match.playerA === playerId;
    const playerScore = isPlayerA ? match.scoreA : match.scoreB;
    const opponentScore = isPlayerA ? match.scoreB : match.scoreA;

    if (playerScore > opponentScore) {
      return { icon: <CheckCircle className="w-5 h-5 text-green-400" />, label: 'W', color: 'text-green-400' };
    } else if (playerScore < opponentScore) {
      return { icon: <span className="text-xl">❌</span>, label: 'L', color: 'text-red-400' };
    } else {
      return { icon: <span className="text-xl">🤝</span>, label: 'D', color: 'text-yellow-400' };
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/leagues/${leagueId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Standings</span>
        </button>

        {/* Player Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card variant="glass" className="bg-gradient-to-br from-cyber-500/20 to-electric-500/20 border-2 border-cyber-500/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-white mb-2">{player.name}</h1>
                <p className="text-lg text-gray-400">{league.name}</p>
              </div>
              {getPositionBadge()}
            </div>
          </Card>
        </motion.div>

        {/* League Stats Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">League Stats</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card variant="glass">
              <p className="text-xs text-gray-400 mb-1">Position</p>
              <p className="text-3xl font-bold text-cyber-400">{player.position || 0}</p>
            </Card>
            <Card variant="glass">
              <p className="text-xs text-gray-400 mb-1">Points</p>
              <p className="text-3xl font-bold text-electric-400">{player.points || 0}</p>
            </Card>
            <Card variant="glass">
              <p className="text-xs text-gray-400 mb-1">Played</p>
              <p className="text-3xl font-bold text-white">{player.played || 0}</p>
            </Card>
            <Card variant="glass">
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-green-400">{isNaN(winRate) ? 0 : winRate.toFixed(0)}%</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="glass" className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <p className="text-xs text-gray-400 mb-1">Won</p>
              <p className="text-2xl font-bold text-green-400">{player.won || 0}</p>
            </Card>
            <Card variant="glass" className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
              <p className="text-xs text-gray-400 mb-1">Draw</p>
              <p className="text-2xl font-bold text-yellow-400">{player.draw || 0}</p>
            </Card>
            <Card variant="glass" className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
              <p className="text-xs text-gray-400 mb-1">Lost</p>
              <p className="text-2xl font-bold text-red-400">{player.lost || 0}</p>
            </Card>
            <Card variant="glass" className="bg-gradient-to-br from-cyber-500/10 to-cyber-600/10 border-cyber-500/20">
              <p className="text-xs text-gray-400 mb-1">Goal Diff</p>
              <p className={`text-2xl font-bold ${(player.goalDifference || 0) > 0 ? 'text-green-400' : (player.goalDifference || 0) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {(player.goalDifference || 0) > 0 ? '+' : ''}{player.goalDifference || 0}
              </p>
            </Card>
          </div>

          {/* Form */}
          {player.form.length > 0 && (
            <Card variant="glass" className="mt-4">
              <p className="text-sm font-semibold text-gray-300 mb-3">Current Form (Last 5 Matches)</p>
              {getFormIndicator(player.form)}
            </Card>
          )}
        </div>

        {/* Matches Played */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Played Against ({matchesPlayed.length} {matchesPlayed.length === 1 ? 'player' : 'players'})
          </h2>

          {matchesPlayed.length > 0 ? (
            <div className="space-y-3">
              {matchesPlayed.map((match, index) => {
                const isPlayerA = match.playerA === playerId;
                const opponent = isPlayerA ? match.playerBName : match.playerAName;
                const playerScore = isPlayerA ? match.scoreA : match.scoreB;
                const opponentScore = isPlayerA ? match.scoreB : match.scoreA;
                const result = getMatchResultIcon(match);

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="glass">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {result.icon}
                          <div>
                            <p className="font-bold text-white">vs {opponent}</p>
                            <p className="text-xs text-gray-400">
                              {convertTimestamp(match.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${result.color}`}>
                            {playerScore} - {opponentScore}
                          </p>
                          <p className="text-xs text-gray-400">{result.label}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card variant="glass">
              <div className="text-center py-8">
                <p className="text-gray-400">No matches played yet</p>
              </div>
            </Card>
          )}
        </div>

        {/* Not Played Yet */}
        {notPlayedYetNames.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-400" />
              Not Played Yet ({notPlayedYetNames.length} {notPlayedYetNames.length === 1 ? 'player' : 'players'})
            </h2>

            <Card variant="glass">
              <div className="flex flex-wrap gap-2">
                {notPlayedYetNames.map((name, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-dark-100 border border-white/10 rounded-full text-sm text-gray-300"
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
