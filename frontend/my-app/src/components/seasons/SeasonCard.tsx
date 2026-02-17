"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Gamepad2, Users, Calendar } from 'lucide-react';
import { Season } from '@/types/season';
import Card from '../ui/Card';

interface SeasonCardProps {
  season: Season;
  onClick?: () => void;
}

export default function SeasonCard({ season, onClick }: SeasonCardProps) {
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'No date set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = () => {
    const badges = {
      active: {
        label: 'Active',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
      },
      setup: {
        label: 'Setup',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      completed: {
        label: 'Completed',
        className: 'bg-gray-500/20 text-light-600 dark:text-gray-400 border-gray-500/30',
      },
    };

    const badge = badges[season.status];

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const stats = season.stats || {
    totalLeagues: 0,
    totalTournaments: 0,
    totalMatches: 0,
    activePlayers: 0,
  };

  return (
    <Card
      variant="gradient"
      hover
      glow={season.status === 'active'}
      onClick={onClick}
      className="cursor-pointer min-h-[260px]"
    >
      <div className="flex flex-col h-full min-h-[212px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-light-900 dark:text-white mb-1 line-clamp-2 pr-2">
              {season.name}
            </h3>
            <p className="text-sm text-light-600 dark:text-gray-400">
              <Gamepad2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {season.gameVersion}
            </p>
          </div>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyber-500/20 border border-cyber-600/30 dark:border-transparent flex items-center justify-center">
              <Trophy className="w-4 h-4 text-cyber-600 dark:text-cyber-400" />
            </div>
            <div>
              <p className="text-xs text-light-600 dark:text-gray-400">Leagues</p>
              <p className="text-sm font-semibold text-light-900 dark:text-white">{stats.totalLeagues}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-electric-500/20 border border-electric-600/30 dark:border-transparent flex items-center justify-center">
              <Target className="w-4 h-4 text-electric-600 dark:text-electric-400" />
            </div>
            <div>
              <p className="text-xs text-light-600 dark:text-gray-400">Tournaments</p>
              <p className="text-sm font-semibold text-light-900 dark:text-white">{stats.totalTournaments}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-600/30 dark:border-transparent flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-light-600 dark:text-gray-400">Matches</p>
              <p className="text-sm font-semibold text-light-900 dark:text-white">{stats.totalMatches}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-600/30 dark:border-transparent flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-light-600 dark:text-gray-400">Players</p>
              <p className="text-sm font-semibold text-light-900 dark:text-white">{stats.activePlayers}</p>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-light-700 dark:text-gray-300 mt-auto pt-4 border-t border-black/10 dark:border-white/10">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(season.startDate)}</span>
        </div>
      </div>
    </Card>
  );
}
