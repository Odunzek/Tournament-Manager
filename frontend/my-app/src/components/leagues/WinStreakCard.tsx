"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Crown, Medal } from 'lucide-react';
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
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-orange-400" />;
    return <span className="text-xs font-bold text-light-600 dark:text-gray-400">{rank}</span>;
  };

  const streakValue = showCurrent ? (streak.currentStreak || 0) : (streak.longestStreak || 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${getRankColor(rank)} !p-3`}>
        <div className="flex items-center justify-between gap-3">
          {/* Rank & Player */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
              {getRankBadge(rank)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-light-900 dark:text-white truncate">{streak.playerName}</p>
              {!showCurrent && streak.longestStreakDate && (
                <p className="text-xs text-light-600 dark:text-gray-400">
                  {convertTimestamp(streak.longestStreakDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Streak Count */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-center">
              <div className="text-lg font-black text-cyber-400 leading-none">{streakValue}</div>
              <div className="text-[10px] text-light-600 dark:text-gray-400">
                {streakValue === 1 ? 'win' : 'wins'}
              </div>
            </div>
            {showCurrent && streakValue >= 3 && (
              <Flame className="w-4 h-4 text-orange-400" />
            )}
          </div>
        </div>

        {/* Progress Bar for Current Streaks */}
        {showCurrent && streakValue > 0 && (
          <div className="mt-2.5">
            <div className="w-full bg-light-300 dark:bg-dark-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((streakValue / 10) * 100, 100)}%` }}
                transition={{ duration: 0.8, delay: rank * 0.05 }}
                className="h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
