"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy } from 'lucide-react';
import { LeagueMatch } from '@/types/league';
import { convertTimestamp } from '@/lib/leagueUtils';
import Card from '../ui/Card';

interface MatchResultCardProps {
  match: LeagueMatch;
  index?: number;
}

export default function MatchResultCard({ match, index = 0 }: MatchResultCardProps) {
  const matchDate = convertTimestamp(match.date);
  const scoreA = match.scoreA || 0;
  const scoreB = match.scoreB || 0;
  const isDraw = scoreA === scoreB;
  const playerAWon = scoreA > scoreB;
  const playerBWon = scoreB > scoreA;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card variant="glass">
        <div className="flex items-center justify-between gap-4">
          {/* Player A */}
          <div className={`flex-1 text-right ${playerAWon ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center justify-end gap-2">
              {playerAWon && <Trophy className="w-4 h-4 text-yellow-400" />}
              <span className="font-bold text-white">{match.playerAName}</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3 px-4">
            <div
              className={`text-2xl font-black ${
                playerAWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              {scoreA}
            </div>
            <div className="text-gray-500 font-bold">-</div>
            <div
              className={`text-2xl font-black ${
                playerBWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              {scoreB}
            </div>
          </div>

          {/* Player B */}
          <div className={`flex-1 text-left ${playerBWon ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{match.playerBName}</span>
              {playerBWon && <Trophy className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-3 pt-3 border-t border-white/10">
          <Calendar className="w-3 h-3" />
          <span>
            {matchDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Result Badge */}
        {isDraw && (
          <div className="text-center mt-2">
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
              Draw
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
