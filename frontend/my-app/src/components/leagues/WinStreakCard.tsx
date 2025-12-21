"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';
import { WinStreak } from '@/types/league';
import { convertTimestamp } from '@/lib/leagueUtils';
import Card from '../ui/Card';

interface WinStreakCardProps {
  streak: WinStreak;
  rank: number;
  showCurrent?: boolean;
}

export default function WinStreakCard({ streak, rank, showCurrent = true }: WinStreakCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-amber-600/20 border-yellow-500/30';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
    return 'from-cyber-500/20 to-electric-500/20 border-cyber-500/30';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getFlameEmojis = (count: number) => {
    if (count >= 5) return '🔥🔥🔥';
    if (count >= 3) return '🔥🔥';
    if (count >= 1) return '🔥';
    return '';
  };

  const streakValue = showCurrent ? (streak.currentStreak || 0) : (streak.longestStreak || 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${getRankColor(rank)}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Rank & Player */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-2xl">{getRankBadge(rank)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{streak.playerName}</p>
              {!showCurrent && streak.longestStreakDate && (
                <p className="text-xs text-gray-400">
                  {convertTimestamp(streak.longestStreakDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Streak Count */}
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-2xl font-black text-cyber-400">{streakValue}</div>
              <div className="text-xs text-gray-400">
                {streakValue === 1 ? 'win' : 'wins'}
              </div>
            </div>
            {showCurrent && streakValue > 0 && (
              <div className="text-2xl">{getFlameEmojis(streakValue)}</div>
            )}
          </div>
        </div>

        {/* Progress Bar for Current Streaks */}
        {showCurrent && streakValue > 0 && (
          <div className="mt-3">
            <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((streakValue / 10) * 100, 100)}%` }}
                transition={{ duration: 0.8, delay: rank * 0.05 }}
                className="h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
