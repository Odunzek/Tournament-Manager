"use client";

import React, { useState } from 'react';
import { Edit3, CheckCircle } from 'lucide-react';
import { Player } from '@/types/player';
import { MatchFormData, LeagueMatch } from '@/types/league';
import { recordBulkMatches } from '@/lib/leagueUtils';
import { Timestamp } from 'firebase/firestore';
import Card from '../../ui/Card';
import BulkMatchForm from '../BulkMatchForm';

interface RecordMatchProps {
  leagueId: string;
  players: Player[];
  isAuthenticated: boolean;
}

export default function RecordMatch({ leagueId, players, isAuthenticated }: RecordMatchProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter to only show players who are part of this league
  const leaguePlayers = players;

  const handleSubmit = async (matches: MatchFormData[]) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Convert MatchFormData to LeagueMatch format
      const matchesToRecord: Omit<LeagueMatch, 'id'>[] = matches.map((match) => {
        const playerA = leaguePlayers.find((p) => p.id === match.playerA);
        const playerB = leaguePlayers.find((p) => p.id === match.playerB);

        return {
          leagueId,
          playerA: match.playerA,
          playerAName: playerA?.name || 'Unknown',
          playerB: match.playerB,
          playerBName: playerB?.name || 'Unknown',
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          date: match.date ? Timestamp.fromDate(new Date(match.date)) : Timestamp.now(),
          played: true,
        };
      });

      await recordBulkMatches(matchesToRecord);

      setSuccessMessage(
        `Successfully recorded ${matches.length} ${matches.length === 1 ? 'match' : 'matches'}!`
      );

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error recording matches:', error);
      alert('Failed to record matches. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card variant="glass" className="!p-6 sm:!p-8">
        <div className="text-center py-6 sm:py-10">
          <Edit3 className="w-10 h-10 sm:w-14 sm:h-14 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-xl font-bold text-gray-400 mb-1">Admin Access Required</h3>
          <p className="text-xs sm:text-sm text-gray-500">You must be an admin to record match results</p>
        </div>
      </Card>
    );
  }

  if (leaguePlayers.length < 2) {
    return (
      <Card variant="glass" className="!p-6 sm:!p-8">
        <div className="text-center py-6 sm:py-10">
          <Edit3 className="w-10 h-10 sm:w-14 sm:h-14 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-xl font-bold text-gray-400 mb-1">Not Enough Players</h3>
          <p className="text-xs sm:text-sm text-gray-500">At least 2 players are required to record matches</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-2xl font-bold text-light-900 dark:text-white mb-0.5 sm:mb-1 flex items-center gap-2">
          <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-400" />
          Record Results
        </h2>
        <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400">
          All fields required. Add multiple matches at once.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-xs sm:text-sm text-green-400 font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Bulk Match Form */}
      <BulkMatchForm players={leaguePlayers} onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      {/* Compact tips */}
      <p className="text-[10px] sm:text-xs text-light-500 dark:text-gray-500">
        Win = 3pts · Draw = 1pt · Loss = 0pts. Standings update automatically.
      </p>
    </div>
  );
}
