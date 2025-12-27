"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { MatchCardProps } from '@/types/tournament';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from './StatusBadge';

export default function MatchCard({
  match,
  showGroup = true,
  showDate = true,
  onRecordResult,
  onClick
}: MatchCardProps) {
  const scheduledDate = new Date(match.scheduledDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  return (
    <Card
      variant="glass"
      hover={!!onClick}
      glow={isLive}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Group/Round + Status */}
        <div className="flex items-center justify-between">
          {showGroup && (match.groupId || match.round) && (
            <div className="flex items-center gap-2 text-sm text-light-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{match.round || `Group ${match.groupId?.slice(-1)}`}</span>
            </div>
          )}
          <StatusBadge status={match.status} />
        </div>

        {/* Match Details */}
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-right">
            <p className="text-base sm:text-lg font-bold text-light-900 dark:text-white truncate">
              {match.homeTeamName}
            </p>
          </div>

          {/* Score / VS */}
          <div className="flex items-center justify-center min-w-[80px]">
            {isCompleted ? (
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent"
                >
                  {match.homeScore}
                </motion.div>
                <span className="text-gray-500">-</span>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent"
                >
                  {match.awayScore}
                </motion.div>
              </div>
            ) : (
              <div className="text-lg font-semibold text-gray-500">VS</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1">
            <p className="text-base sm:text-lg font-bold text-light-900 dark:text-white truncate">
              {match.awayTeamName}
            </p>
          </div>
        </div>

        {/* Footer: Date + Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-light-300 dark:border-white/10">
          {showDate && (
            <div className="flex items-center gap-2 text-sm text-light-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(scheduledDate)} • {formatTime(scheduledDate)}
              </span>
            </div>
          )}

          {!isCompleted && onRecordResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRecordResult(match.id);
              }}
            >
              Record Result
            </Button>
          )}
        </div>

        {/* Two-Legged Match Indicator */}
        {(match.isFirstLeg || match.isSecondLeg) && (
          <div className="text-xs text-center text-cyber-400 bg-cyber-500/10 rounded px-2 py-1">
            {match.isFirstLeg ? '1st Leg' : '2nd Leg'}
          </div>
        )}
      </div>
    </Card>
  );
}
