"use client";

import React from 'react';
import { Trophy } from 'lucide-react';
import { League } from '@/types/league';
import Card from '../ui/Card';

interface LeagueCardProps {
  league: League;
  onClick?: () => void;
  leagueLeader?: string;
}

export default function LeagueCard({ league, onClick, leagueLeader }: LeagueCardProps) {
  const getStatusBadge = () => {
    const badges = {
      active: {
        label: 'Active',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
      },
      upcoming: {
        label: 'Upcoming',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      },
      completed: {
        label: 'Completed',
        className: 'bg-gray-500/20 text-light-600 dark:text-gray-400 border-gray-500/30',
      },
    };

    const badge = badges[league.status];

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <Card
      variant="gradient"
      hover
      glow={league.status === 'active'}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-light-900 dark:text-white line-clamp-1 pr-2 mb-1">
              {league.name}
            </h3>
            <p className="text-xs text-light-600 dark:text-gray-400">{league.season}</p>
          </div>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>

        {/* League leader — only when active, single compact line */}
        {leagueLeader && league.status === 'active' && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-black/10 dark:border-white/10">
            <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <p className="text-xs text-light-600 dark:text-gray-400">Leader:</p>
            <p className="text-xs font-semibold text-yellow-500 dark:text-yellow-400 truncate">
              {leagueLeader}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
