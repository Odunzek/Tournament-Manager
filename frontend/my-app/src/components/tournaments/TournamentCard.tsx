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
        return 'Champions League';
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
      glow={tournament.status === 'group_stage' || tournament.status === 'knockout'}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-light-900 dark:text-white line-clamp-1 pr-2 mb-1">
            {tournament.name}
          </h3>
          <p className="text-xs text-light-600 dark:text-gray-400">
            {getTournamentTypeLabel()} · {tournament.currentTeams}/{tournament.maxTeams} teams
          </p>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={tournament.status} />
        </div>
      </div>
    </Card>
  );
}
