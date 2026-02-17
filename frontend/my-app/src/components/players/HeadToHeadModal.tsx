/**
 * HeadToHeadModal Component
 *
 * Global player comparison modal that shows head-to-head statistics
 * across all leagues and tournaments between two selected players.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, Target, Calendar, Loader2 } from 'lucide-react';
import { Player } from '@/types/player';
import { getGlobalHeadToHead, HeadToHeadStats } from '@/lib/headToHeadUtils';
import { useSeasons } from '@/hooks/useSeasons';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import CustomDropdown from '../ui/CustomDropdown';
import Button from '../ui/Button';

interface HeadToHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

export default function HeadToHeadModal({ isOpen, onClose, players }: HeadToHeadModalProps) {
  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const { seasons } = useSeasons();
  const { activeSeason } = useActiveSeason();

  // Player dropdown options
  const playerOptions = players.map((player) => ({
    value: player.id!,
    label: player.name,
  }));

  // Default to active season when it loads
  useEffect(() => {
    if (activeSeason?.id && seasonFilter === 'all') {
      setSeasonFilter(activeSeason.id);
    }
  }, [activeSeason]);

  // Fetch stats when both players are selected or season filter changes
  useEffect(() => {
    if (playerA && playerB && playerA.id !== playerB.id) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [playerA, playerB, seasonFilter]);

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
    if (selected) setPlayerA(selected);
  };

  const handlePlayerBChange = (value: string) => {
    const selected = players.find((p) => p.id === value);
    if (selected) setPlayerB(selected);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-light-50 to-light-100 dark:from-dark-100 dark:to-dark-200 rounded-2xl shadow-card-light dark:shadow-glow border-2 border-cyber-500/20 dark:border-cyber-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow">
                <Target className="w-6 h-6 text-light-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-light-900 dark:text-white">Head-to-Head Comparison</h2>
                <p className="text-sm text-light-600 dark:text-gray-400">
                  {seasonFilter === 'all'
                    ? 'Compare players across all competitions'
                    : `Comparing in ${seasons.find((s) => s.id === seasonFilter)?.name || 'selected season'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-light-600 dark:text-gray-400 hover:text-light-900 dark:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Player Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-light-700 dark:text-gray-300 mb-2">Player 1</label>
                <CustomDropdown
                  value={playerA?.id || ''}
                  onChange={handlePlayerAChange}
                  options={playerOptions.filter((p) => p.value !== playerB?.id)}
                  placeholder="Select player..."
                  searchable
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-light-700 dark:text-gray-300 mb-2">Player 2</label>
                <CustomDropdown
                  value={playerB?.id || ''}
                  onChange={handlePlayerBChange}
                  options={playerOptions.filter((p) => p.value !== playerA?.id)}
                  placeholder="Select player..."
                  searchable
                />
              </div>
            </div>

            {/* Season Filter */}
            {seasons.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-light-600 dark:text-gray-400 text-sm font-semibold">Season:</span>
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
                  className="w-48"
                />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
                <p className="text-light-600 dark:text-gray-400">Analyzing matches...</p>
              </div>
            )}

            {/* No Selection State */}
            {!loading && !stats && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-light-600 dark:text-gray-400 mb-2">Select Two Players</h3>
                <p className="text-gray-500">Choose two players to compare their head-to-head record</p>
              </div>
            )}

            {/* Stats Display */}
            {!loading && stats && stats.totalMatches > 0 && (
              <div className="space-y-6">
                {/* Overall Record */}
                <div className="bg-gradient-to-br from-cyber-500/10 to-electric-500/10 border-2 border-cyber-500/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-light-900 dark:text-white mb-4 text-center">Overall Record</h3>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {/* Player A */}
                    <div>
                      <div className="text-sm text-light-600 dark:text-gray-400 mb-2">{stats.playerA.name}</div>
                      <div className="text-3xl font-bold text-cyber-400 mb-1">
                        {stats.playerA.wins}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.playerA.winRate.toFixed(1)}% wins
                      </div>
                    </div>

                    {/* Draws */}
                    <div>
                      <div className="text-sm text-light-600 dark:text-gray-400 mb-2">Draws</div>
                      <div className="text-3xl font-bold text-light-600 dark:text-gray-400 mb-1">
                        {stats.playerA.draws}
                      </div>
                      <div className="text-xs text-gray-500">{stats.totalMatches} total</div>
                    </div>

                    {/* Player B */}
                    <div>
                      <div className="text-sm text-light-600 dark:text-gray-400 mb-2">{stats.playerB.name}</div>
                      <div className="text-3xl font-bold text-electric-400 mb-1">
                        {stats.playerB.wins}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.playerB.winRate.toFixed(1)}% wins
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goals Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-light-200/50 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-5 h-5 text-cyber-400" />
                      <h4 className="font-bold text-light-900 dark:text-white">Goals</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-light-600 dark:text-gray-400">{stats.playerA.name}:</span>
                        <span className="text-light-900 dark:text-white font-semibold">{stats.playerA.goalsScored}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-light-600 dark:text-gray-400">{stats.playerB.name}:</span>
                        <span className="text-light-900 dark:text-white font-semibold">{stats.playerB.goalsScored}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-black/10 dark:border-white/10">
                        <span className="text-light-600 dark:text-gray-400">Avg per match:</span>
                        <span className="text-cyber-400 font-semibold">
                          {stats.avgGoalsPerMatch.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-light-200/50 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-electric-400" />
                      <h4 className="font-bold text-light-900 dark:text-white">Competition Breakdown</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-light-600 dark:text-gray-400">Leagues:</span>
                        <span className="text-light-900 dark:text-white font-mono">
                          {stats.leagueRecord.playerAWins}-{stats.leagueRecord.draws}-
                          {stats.leagueRecord.playerBWins}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-light-600 dark:text-gray-400">Tournaments:</span>
                        <span className="text-light-900 dark:text-white font-mono">
                          {stats.tournamentRecord.playerAWins}-{stats.tournamentRecord.draws}-
                          {stats.tournamentRecord.playerBWins}
                        </span>
                      </div>
                      {stats.mostCommonScore && (
                        <div className="flex justify-between pt-2 border-t border-black/10 dark:border-white/10">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.playerA.biggestWin && (
                      <div className="bg-gradient-to-br from-cyber-500/10 to-cyber-600/10 border border-cyber-500/30 rounded-xl p-4">
                        <div className="text-xs text-light-600 dark:text-gray-400 mb-1">
                          {stats.playerA.name}'s Biggest Win
                        </div>
                        <div className="text-2xl font-bold text-cyber-400 mb-1">
                          {stats.playerA.biggestWin.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.playerA.biggestWin.competition}
                        </div>
                      </div>
                    )}
                    {stats.playerB.biggestWin && (
                      <div className="bg-gradient-to-br from-electric-500/10 to-electric-600/10 border border-electric-500/30 rounded-xl p-4">
                        <div className="text-xs text-light-600 dark:text-gray-400 mb-1">
                          {stats.playerB.name}'s Biggest Win
                        </div>
                        <div className="text-2xl font-bold text-electric-400 mb-1">
                          {stats.playerB.biggestWin.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.playerB.biggestWin.competition}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Matches */}
                {stats.recentMatches.length > 0 && (
                  <div className="bg-light-200/50 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-light-600 dark:text-gray-400" />
                      <h4 className="font-bold text-light-900 dark:text-white">Recent Matches</h4>
                      <span className="text-xs text-gray-500 ml-auto">
                        Last {Math.min(stats.recentMatches.length, 10)}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {stats.recentMatches.map((match, index) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-light-100 dark:bg-dark-100/50 rounded-lg hover:bg-light-100 dark:bg-dark-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20">
                              {formatDate(match.date)}
                            </span>
                            <span className="text-sm text-light-600 dark:text-gray-400">{match.competition}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold ${
                                match.winner === 'playerA'
                                  ? 'text-cyber-400'
                                  : match.winner === 'playerB'
                                  ? 'text-electric-400'
                                  : 'text-light-600 dark:text-gray-400'
                              }`}
                            >
                              {match.playerAScore} - {match.playerBScore}
                            </span>
                            {match.winner !== 'draw' && (
                              <Trophy className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Matches Found */}
            {!loading && stats && stats.totalMatches === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-light-600 dark:text-gray-400 mb-2">No Matches Found</h3>
                <p className="text-gray-500">
                  {playerA?.name} and {playerB?.name} haven't faced each other yet
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-black/10 dark:border-white/10">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
