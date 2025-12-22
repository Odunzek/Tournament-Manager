"use client";

import React from 'react';
import { Calendar, Users, Trophy } from 'lucide-react';
import { Tournament, convertTimestamp } from '@/lib/tournamentUtils';
import Card from '../ui/Card';
import StatusBadge from './StatusBadge';

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}

export default function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const startDate = tournament.startDate ? convertTimestamp(tournament.startDate) : null;
  const endDate = tournament.endDate ? convertTimestamp(tournament.endDate) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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

  // Calculate number of groups
  const numberOfGroups = tournament.groups?.length || 0;

  return (
    <Card
      variant="gradient"
      hover
      glow={tournament.status === 'group_stage' || tournament.status === 'knockout'}
      onClick={onClick}
      className="cursor-pointer min-h-[280px]"
    >
      <div className="flex flex-col h-full min-h-[232px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 pr-2">
              {tournament.name}
            </h3>
            <p className="text-sm text-gray-400">{getTournamentTypeLabel()}</p>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={tournament.status} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Teams */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyber-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Teams</p>
              <p className="text-sm font-semibold text-white">
                {tournament.currentTeams}/{tournament.maxTeams}
              </p>
            </div>
          </div>

          {/* Groups */}
          {numberOfGroups > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-electric-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Groups</p>
                <p className="text-sm font-semibold text-white">{numberOfGroups}</p>
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-300 mt-auto pt-4 border-t border-white/10">
          <Calendar className="w-4 h-4" />
          <span>
            {startDate ? formatDate(startDate) : 'No date set'}
            {endDate && ` - ${formatDate(endDate)}`}
          </span>
        </div>
      </div>
    </Card>
  );
}
