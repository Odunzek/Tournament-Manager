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
      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${badge.className}`}>
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
      className="cursor-pointer !p-3 sm:!p-4 !rounded-xl !h-[60px] sm:!h-[68px] flex flex-col justify-center"
    >
      {/* Row 1: Name + Badge */}
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <h3 className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">
          {league.name}
        </h3>
        <div className="flex-shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Row 2: Season + optional Leader */}
      <div className="flex items-center gap-1">
        <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 shrink-0">{league.season}</p>
        {leagueLeader && (league.status === 'active' || league.status === 'completed') && (
          <>
            <span className="text-light-300 dark:text-gray-600">·</span>
            <Trophy className={`w-3 h-3 shrink-0 ${league.status === 'completed' ? 'text-amber-400' : 'text-yellow-400'}`} />
            <p className={`text-[10px] sm:text-xs font-semibold truncate ${league.status === 'completed' ? 'text-amber-400' : 'text-yellow-500 dark:text-yellow-400'}`}>
              {leagueLeader}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
