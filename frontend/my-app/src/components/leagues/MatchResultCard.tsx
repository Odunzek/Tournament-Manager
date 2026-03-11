/**
 * MatchResultCard
 *
 * Displays a single completed league match result. Adapts its layout based
 * on screen size:
 *   - **Mobile (< sm)**: Compact inline row with truncated names and tiny scores.
 *     Fits 3+ results on a 375px screen without scrolling.
 *   - **Desktop (sm+)**: Full-width Card with large score display, date footer,
 *     and an edit button for admins.
 *
 * The winner's name receives full opacity; the loser's name is dimmed (opacity-50/60).
 * Drawn matches colour both scores yellow.
 *
 * Admins see an edit icon/button that opens EditMatchModal for score correction.
 * On success, `onMatchUpdated` is called so the parent page can recalculate standings.
 *
 * Animation: staggered fade-in based on `index` prop (0.05s delay per card).
 */
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Edit3 } from 'lucide-react';
import { LeagueMatch } from '@/types/league';
import { convertTimestamp } from '@/lib/leagueUtils';
import { useAuth } from '@/lib/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EditMatchModal from './EditMatchModal';

interface MatchResultCardProps {
  match: LeagueMatch;             // The completed match to display
  index?: number;                 // Card index in the list (used for animation stagger)
  onMatchUpdated?: () => void;    // Callback to refresh standings after editing a score
}

export default function MatchResultCard({ match, index = 0, onMatchUpdated }: MatchResultCardProps) {
  const { isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
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
      {/* Mobile: compact inline row */}
      <div className="sm:hidden">
        <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-light-100/50 dark:bg-white/[0.03] border border-light-200 dark:border-white/5">
          {/* Player A */}
          <div className={`flex-1 text-right min-w-0 ${playerAWon ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center justify-end gap-1">
              {playerAWon && <Trophy className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
              <span className="font-semibold text-light-900 dark:text-white text-[11px] truncate">{match.playerAName}</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 px-1.5 shrink-0">
            <span className={`text-sm font-black ${playerAWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-500 dark:text-gray-500'}`}>{scoreA}</span>
            <span className="text-[10px] text-light-500 dark:text-gray-500">-</span>
            <span className={`text-sm font-black ${playerBWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-500 dark:text-gray-500'}`}>{scoreB}</span>
          </div>

          {/* Player B */}
          <div className={`flex-1 text-left min-w-0 ${playerBWon ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-light-900 dark:text-white text-[11px] truncate">{match.playerBName}</span>
              {playerBWon && <Trophy className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
            </div>
          </div>

          {/* Edit icon */}
          {isAuthenticated && (
            <button onClick={() => setShowEditModal(true)} className="p-1 text-light-500 dark:text-gray-500 hover:text-cyber-400 shrink-0">
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop: full card */}
      <div className="hidden sm:block">
        <Card variant="glass" className="!p-5">
          <div className="flex items-center justify-between gap-4">
            <div className={`flex-1 text-right ${playerAWon ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center justify-end gap-2">
                {playerAWon && <Trophy className="w-4 h-4 text-yellow-400" />}
                <span className="font-bold text-light-900 dark:text-white text-sm">{match.playerAName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4">
              <div className={`text-2xl font-black ${playerAWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>{scoreA}</div>
              <div className="text-light-500 dark:text-gray-500 font-bold">-</div>
              <div className={`text-2xl font-black ${playerBWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>{scoreB}</div>
            </div>

            <div className={`flex-1 text-left ${playerBWon ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-light-900 dark:text-white text-sm">{match.playerBName}</span>
                {playerBWon && <Trophy className="w-4 h-4 text-yellow-400" />}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-light-600 dark:text-gray-400 mt-2 pt-2 border-t border-light-300 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>{matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)} leftIcon={<Edit3 className="w-3 h-3" />} className="text-xs">Edit</Button>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Match Modal */}
      <EditMatchModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        match={match}
        onSuccess={() => {
          if (onMatchUpdated) {
            onMatchUpdated();
          }
        }}
      />
    </motion.div>
  );
}
