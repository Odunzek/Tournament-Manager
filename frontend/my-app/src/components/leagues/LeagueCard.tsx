"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { League } from '@/types/league';
import { convertTimestamp } from '@/lib/tournamentUtils';
import Card from '../ui/Card';

interface LeagueCardProps {
  league: League;
  onClick?: () => void;
  leagueLeader?: string;
}

export default function LeagueCard({ league, onClick, leagueLeader }: LeagueCardProps) {
  const startDate = league.startDate ? convertTimestamp(league.startDate) : null;
  const endDate = league.endDate ? convertTimestamp(league.endDate) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      },
    };

    const badge = badges[league.status];

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const matchesPlayed = league.matchesPlayed || 0;
  const totalMatches = league.totalMatches || 0;
  const matchProgress = totalMatches > 0 ? (matchesPlayed / totalMatches) * 100 : 0;
  const playerCount = league.playerIds?.length || 0;

  return (
    <Card
      variant="gradient"
      hover
      glow={league.status === 'active'}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2 pr-2">
              {league.name}
            </h3>
            <p className="text-sm text-gray-400">{league.season}</p>
          </div>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>

        {/* League Leader */}
        {leagueLeader && league.status === 'active' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-tech">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">League Leader</p>
                <p className="text-sm font-bold text-yellow-400">{leagueLeader}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Players */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyber-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Players</p>
              <p className="text-sm font-semibold text-white">{playerCount}</p>
            </div>
          </div>

          {/* Matches */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-electric-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Matches</p>
              <p className="text-sm font-semibold text-white">
                {matchesPlayed}/{totalMatches}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {league.status === 'active' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(matchProgress)}%</span>
            </div>
            <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-2 bg-gradient-to-r from-cyber-400 to-electric-500"
              />
            </div>
          </div>
        )}

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
