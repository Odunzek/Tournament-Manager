"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Trophy, TrendingUp, Target, Calendar,
  Loader2, ChevronDown, Swords,
} from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Player } from '@/types/player';
import { getGlobalHeadToHead, HeadToHeadStats } from '@/lib/headToHeadUtils';
import { usePlayers } from '@/hooks/usePlayers';
import { useSeasons } from '@/hooks/useSeasons';
import { useActiveSeason } from '@/hooks/useActiveSeason';

// ── Date formatter ──────────────────────────────────────────────
const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatDateShort = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ── Inner component (uses useSearchParams → needs Suspense) ─────
function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { players, loading: playersLoading } = usePlayers();
  const { seasons } = useSeasons();
  const { activeSeason } = useActiveSeason();

  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [matchesExpanded, setMatchesExpanded] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const playerOptions = players.map((p) => ({
    value: p.id!,
    label: p.name,
  }));

  // ── URL helpers ───────────────────────────────────────────────
  const updateURL = (aId: string | null, bId: string | null) => {
    const params = new URLSearchParams();
    if (aId) params.set('a', aId);
    if (bId) params.set('b', bId);
    const qs = params.toString();
    router.replace(`/players/compare${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // ── Init from URL params once players load ────────────────────
  useEffect(() => {
    if (playersLoading || players.length === 0 || initialized) return;
    const aId = searchParams.get('a');
    const bId = searchParams.get('b');
    if (aId) {
      const found = players.find((p) => p.id === aId);
      if (found) setPlayerA(found);
    }
    if (bId) {
      const found = players.find((p) => p.id === bId);
      if (found) setPlayerB(found);
    }
    setInitialized(true);
  }, [players, playersLoading, initialized, searchParams]);

  // ── Default to active season ──────────────────────────────────
  useEffect(() => {
    if (activeSeason?.id && seasonFilter === 'all') {
      setSeasonFilter(activeSeason.id);
    }
  }, [activeSeason]);

  // ── Fetch stats when both players selected ────────────────────
  useEffect(() => {
    if (playerA && playerB && playerA.id !== playerB.id) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [playerA, playerB, seasonFilter]);

  // ── Auto-expand/collapse accordion based on match count ───────
  useEffect(() => {
    if (stats?.recentMatches) {
      setMatchesExpanded(stats.recentMatches.length <= 5);
    }
  }, [stats]);

  const fetchStats = async () => {
    if (!playerA || !playerB || !playerA.id || !playerB.id) return;
    setLoading(true);
    try {
      const result = await getGlobalHeadToHead(
        playerA.id,
        playerA.name,
        playerB.id,
        playerB.name,
        seasonFilter !== 'all' ? seasonFilter : undefined
      );
      setStats(result);
    } catch (error) {
      console.error('Error fetching head-to-head stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerAChange = (value: string) => {
    const selected = players.find((p) => p.id === value);
    if (selected) {
      setPlayerA(selected);
      updateURL(value, playerB?.id || null);
    }
  };

  const handlePlayerBChange = (value: string) => {
    const selected = players.find((p) => p.id === value);
    if (selected) {
      setPlayerB(selected);
      updateURL(playerA?.id || null, value);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <Container maxWidth="2xl">
      <div className="py-4 sm:py-8">
        {/* Back button + Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <button
            onClick={() => router.push('/players')}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Players</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow shrink-0">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-light-900 dark:text-white">Head-to-Head</h1>
              <p className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400">
                {seasonFilter === 'all'
                  ? 'All competitions'
                  : `${seasons.find((s) => s.id === seasonFilter)?.name || 'Season'}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Player Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-end mb-3 sm:mb-6"
        >
          <div>
            <label className="block text-xs sm:text-sm font-bold text-light-700 dark:text-gray-300 mb-1 sm:mb-2">Player 1</label>
            <CustomDropdown
              value={playerA?.id || ''}
              onChange={handlePlayerAChange}
              options={playerOptions.filter((p) => p.value !== playerB?.id)}
              placeholder="Select..."
              searchable
            />
          </div>
          <div className="pb-2 sm:pb-2.5">
            <span className="text-xs sm:text-sm font-bold text-light-500 dark:text-gray-500">VS</span>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-light-700 dark:text-gray-300 mb-1 sm:mb-2">Player 2</label>
            <CustomDropdown
              value={playerB?.id || ''}
              onChange={handlePlayerBChange}
              options={playerOptions.filter((p) => p.value !== playerA?.id)}
              placeholder="Select..."
              searchable
            />
          </div>
        </motion.div>

        {/* Season Filter */}
        {seasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-4 sm:mb-6"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <span className="text-light-600 dark:text-gray-400 text-[10px] sm:text-sm font-semibold">Season:</span>
            <CustomDropdown
              value={seasonFilter}
              onChange={(val) => setSeasonFilter(val as string)}
              options={[
                ...(activeSeason ? [{ value: activeSeason.id!, label: `● ${activeSeason.name}` }] : []),
                { value: 'all', label: 'All Time' },
                ...seasons
                  .filter((s) => s.id !== activeSeason?.id)
                  .map((s) => ({ value: s.id!, label: s.name })),
              ]}
              className="w-36 sm:w-48"
            />
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 sm:py-16"
          >
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyber-400 mx-auto mb-3 animate-spin" />
            <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400">Analyzing matches...</p>
          </motion.div>
        )}

        {/* Empty — No Selection */}
        {!loading && !stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 sm:py-16"
          >
            <Target className="w-10 h-10 sm:w-14 sm:h-14 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base sm:text-xl font-bold text-light-600 dark:text-gray-400 mb-1">Select Two Players</h3>
            <p className="text-xs sm:text-sm text-gray-500">Choose two players to compare their head-to-head record</p>
          </motion.div>
        )}

        {/* No Matches Found */}
        {!loading && stats && stats.totalMatches === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 sm:py-16"
          >
            <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base sm:text-xl font-bold text-light-600 dark:text-gray-400 mb-1">No Matches Found</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {playerA?.name} and {playerB?.name} haven't faced each other yet
            </p>
          </motion.div>
        )}

        {/* ── Stats Display ────────────────────────────────────── */}
        {!loading && stats && stats.totalMatches > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 sm:space-y-5"
          >
            {/* Overall Record */}
            <div className="bg-gradient-to-br from-cyber-500/10 to-electric-500/10 border-2 border-cyber-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-6">
              <h3 className="text-sm sm:text-lg font-bold text-light-900 dark:text-white mb-2 sm:mb-4 text-center">Overall Record</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                {/* Player A */}
                <div>
                  <div className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">{stats.playerA.name}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-cyber-400 mb-0.5 sm:mb-1">{stats.playerA.wins}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{stats.playerA.winRate.toFixed(0)}% wins</div>
                </div>
                {/* Draws */}
                <div>
                  <div className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400 mb-1 sm:mb-2">Draws</div>
                  <div className="text-2xl sm:text-3xl font-bold text-light-600 dark:text-gray-400 mb-0.5 sm:mb-1">{stats.playerA.draws}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{stats.totalMatches} total</div>
                </div>
                {/* Player B */}
                <div>
                  <div className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">{stats.playerB.name}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-electric-400 mb-0.5 sm:mb-1">{stats.playerB.wins}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{stats.playerB.winRate.toFixed(0)}% wins</div>
                </div>
              </div>
            </div>

            {/* Goals & Competition Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {/* Goals */}
              <div className="bg-light-200/50 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-400" />
                  <h4 className="font-bold text-sm text-light-900 dark:text-white">Goals</h4>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-light-600 dark:text-gray-400 truncate mr-2">{stats.playerA.name}:</span>
                    <span className="text-light-900 dark:text-white font-semibold">{stats.playerA.goalsScored}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-600 dark:text-gray-400 truncate mr-2">{stats.playerB.name}:</span>
                    <span className="text-light-900 dark:text-white font-semibold">{stats.playerB.goalsScored}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 sm:pt-2 border-t border-black/10 dark:border-white/10">
                    <span className="text-light-600 dark:text-gray-400">Avg/match:</span>
                    <span className="text-cyber-400 font-semibold">{stats.avgGoalsPerMatch.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-light-200/50 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-electric-400" />
                  <h4 className="font-bold text-sm text-light-900 dark:text-white">Breakdown</h4>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-light-600 dark:text-gray-400">Leagues:</span>
                    <span className="text-light-900 dark:text-white font-mono">
                      {stats.leagueRecord.playerAWins}-{stats.leagueRecord.draws}-{stats.leagueRecord.playerBWins}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-600 dark:text-gray-400">Tournaments:</span>
                    <span className="text-light-900 dark:text-white font-mono">
                      {stats.tournamentRecord.playerAWins}-{stats.tournamentRecord.draws}-{stats.tournamentRecord.playerBWins}
                    </span>
                  </div>
                  {stats.mostCommonScore && (
                    <div className="flex justify-between pt-1.5 sm:pt-2 border-t border-black/10 dark:border-white/10">
                      <span className="text-light-600 dark:text-gray-400">Most common:</span>
                      <span className="text-electric-400 font-semibold">
                        {stats.mostCommonScore.score} ({stats.mostCommonScore.count}x)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Biggest Wins */}
            {(stats.playerA.biggestWin || stats.playerB.biggestWin) && (
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {stats.playerA.biggestWin && (
                  <div className="bg-gradient-to-br from-cyber-500/10 to-cyber-600/10 border border-cyber-500/30 rounded-xl p-3 sm:p-4">
                    <div className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">
                      {stats.playerA.name}'s Best
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-cyber-400 mb-0.5">
                      {stats.playerA.biggestWin.score}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                      {stats.playerA.biggestWin.competition}
                    </div>
                  </div>
                )}
                {stats.playerB.biggestWin && (
                  <div className="bg-gradient-to-br from-electric-500/10 to-electric-600/10 border border-electric-500/30 rounded-xl p-3 sm:p-4">
                    <div className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">
                      {stats.playerB.name}'s Best
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-electric-400 mb-0.5">
                      {stats.playerB.biggestWin.score}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                      {stats.playerB.biggestWin.competition}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Recent Matches Accordion ──────────────────────── */}
            {stats.recentMatches.length > 0 && (
              <div className="bg-light-200/50 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => setMatchesExpanded(!matchesExpanded)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-light-600 dark:text-gray-400" />
                    <h4 className="font-bold text-sm text-light-900 dark:text-white">Match History</h4>
                    <span className="text-[10px] sm:text-xs bg-cyber-500/20 text-cyber-600 dark:text-cyber-400 px-1.5 py-0.5 rounded-full font-semibold">
                      {stats.recentMatches.length}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: matchesExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-light-500 dark:text-gray-400" />
                  </motion.div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence initial={false}>
                  {matchesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2 sm:px-4 sm:pb-4 space-y-1 sm:space-y-1.5">
                        {stats.recentMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-1.5 sm:p-2.5 bg-light-100 dark:bg-dark-100/50 rounded-lg"
                          >
                            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                              <span className="text-[10px] sm:text-xs text-gray-500 w-14 sm:w-20 shrink-0">
                                <span className="sm:hidden">{formatDateShort(match.date)}</span>
                                <span className="hidden sm:inline">{formatDate(match.date)}</span>
                              </span>
                              <span className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 truncate">
                                {match.competition}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              <span
                                className={`text-xs sm:text-sm font-bold ${
                                  match.winner === 'playerA'
                                    ? 'text-cyber-400'
                                    : match.winner === 'playerB'
                                    ? 'text-electric-400'
                                    : 'text-light-600 dark:text-gray-400'
                                }`}
                              >
                                {match.playerAScore}-{match.playerBScore}
                              </span>
                              {match.winner !== 'draw' && (
                                <Trophy className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-yellow-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Container>
  );
}

// ── Page skeleton while Suspense loads ───────────────────────────
function ComparePageSkeleton() {
  return (
    <Container maxWidth="2xl">
      <div className="py-4 sm:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </Container>
  );
}

// ── Page export ─────────────────────────────────────────────────
export default function ComparePage() {
  return (
    <MainLayout>
      <GlobalNavigation />
      <Suspense fallback={<ComparePageSkeleton />}>
        <CompareContent />
      </Suspense>
    </MainLayout>
  );
}
