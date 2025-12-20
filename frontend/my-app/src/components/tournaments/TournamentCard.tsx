"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy } from 'lucide-react';
import { TournamentCardProps } from '@/types/tournament';
import Card from '../ui/Card';
import StatusBadge from './StatusBadge';

export default function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const startDate = new Date(tournament.startDate);
  const endDate = tournament.endDate ? new Date(tournament.endDate) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTournamentTypeLabel = () => {
    switch (tournament.type) {
      case 'league':
        return 'League';
      case 'knockout':
        return 'Knockout';
      case 'groups_knockout':
        return 'Groups + Knockout';
      default:
        return 'Tournament';
    }
  };

  return (
    <Card
      variant="gradient"
      hover
      glow={tournament.status === 'active'}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
              {tournament.name}
            </h3>
            <p className="text-sm text-gray-400">{getTournamentTypeLabel()}</p>
          </div>
          <StatusBadge status={tournament.status} />
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
              <p className="text-sm font-semibold text-white">{tournament.numberOfTeams}</p>
            </div>
          </div>

          {/* Groups */}
          {tournament.numberOfGroups && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-electric-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Groups</p>
                <p className="text-sm font-semibold text-white">{tournament.numberOfGroups}</p>
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-300 mt-auto pt-4 border-t border-white/10">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(startDate)}
            {endDate && ` - ${formatDate(endDate)}`}
          </span>
        </div>

        {/* Current Round (if active) */}
        {tournament.status === 'active' && tournament.currentRound && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="mt-3 px-3 py-1.5 bg-gradient-to-r from-cyber-500/20 to-electric-500/20 rounded-lg border border-cyber-500/30"
          >
            <p className="text-xs text-center text-cyber-300">
              Current: {tournament.currentRound}
            </p>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
