"use client";

import React from 'react';
import { Trophy, Target, Users, ChevronRight } from 'lucide-react';
import { Season } from '@/types/season';

interface SeasonCardProps {
  season: Season;
  onClick?: () => void;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    dot: 'bg-green-400 animate-pulse',
    badge: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25',
  },
  setup: {
    label: 'Setup',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25',
  },
  completed: {
    label: 'Done',
    dot: 'bg-gray-400',
    badge: 'bg-gray-500/15 text-light-600 dark:text-gray-400 border-gray-500/25',
  },
};

export default function SeasonCard({ season, onClick }: SeasonCardProps) {
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const sc = STATUS_CONFIG[season.status];
  const stats = season.stats || {
    totalLeagues: 0,
    totalTournaments: 0,
    totalMatches: 0,
    activePlayers: 0,
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left
                 bg-light-100/80 dark:bg-dark-100/60
                 border border-black/8 dark:border-white/8
                 hover:border-cyber-500/30 dark:hover:border-cyber-500/30
                 hover:bg-light-200/60 dark:hover:bg-dark-100/80
                 transition-all group"
    >
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-light-900 dark:text-white truncate">
            {season.name}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${sc.badge}`}>
            {sc.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-light-500 dark:text-gray-500">
          <span>{season.gameVersion}</span>
          <span>·</span>
          <span>{formatDate(season.startDate)}</span>
        </div>
      </div>

      {/* Stats — hidden on smallest screens */}
      <div className="hidden sm:flex items-center gap-3.5 shrink-0 text-xs text-light-500 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-cyber-500 dark:text-cyber-400" />
          {stats.totalLeagues}
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-electric-500 dark:text-electric-400" />
          {stats.totalTournaments}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          {stats.activePlayers}
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyber-500 dark:group-hover:text-cyber-400 transition-colors shrink-0" />
    </button>
  );
}
