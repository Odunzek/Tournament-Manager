"use client";

import React from 'react';
import { Tournament } from '@/lib/tournamentUtils';
import Card from '../ui/Card';
import StatusBadge from './StatusBadge';

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}

export default function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const getTournamentTypeLabel = () => {
    switch (tournament.type) {
      case 'league':
        return 'League';
      case 'knockout':
        return 'Knockout';
      case 'champions_league':
        return 'Groups & Knockout';
      case 'ucl':
        return 'UCL';
      case 'custom':
        return 'Custom';
      default:
        return 'Tournament';
    }
  };

  return (
    <Card
      variant="gradient"
      hover
      glow={['group_stage', 'league_phase', 'playoff', 'knockout'].includes(tournament.status)}
      onClick={onClick}
      className="cursor-pointer !p-3 sm:!p-4 !rounded-xl !h-[60px] sm:!h-[68px] flex flex-col justify-center"
    >
      {/* Row 1: Name + Badge */}
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <h3 className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">
          {tournament.name}
        </h3>
        <div className="flex-shrink-0">
          <StatusBadge status={tournament.status} size="sm" />
        </div>
      </div>

      {/* Row 2: Type + Team count */}
      <div className="flex items-center gap-1">
        <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">
          {getTournamentTypeLabel()} · {tournament.currentTeams}/{tournament.maxTeams} teams
        </p>
      </div>
    </Card>
  );
}
