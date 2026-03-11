/**
 * RecordMatch Section — Admin-only tab for recording match results.
 *
 * Delegates the form UI to BulkMatchForm, which lets an admin enter
 * multiple match results in one submission. This component handles:
 *   - Converting the lightweight MatchFormData shape (from the form) into
 *     full LeagueMatch objects with Firestore Timestamps before writing.
 *   - Calling `recordBulkMatches` which writes each match to Firestore and
 *     increments the league's `matchesPlayed` counter.
 *   - Showing a transient success banner after submission (auto-clears after 5s).
 *   - Guard-rendering: shows a locked card if the user is not authenticated,
 *     or a "not enough players" card if fewer than 2 players are enrolled.
 *
 * Standings and streaks on the parent page update automatically through the
 * real-time `useLeagueMatches` hook — no manual refresh required.
 */
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
  players: Player[];     // Only the players enrolled in this league (pre-filtered by parent)
  isAuthenticated: boolean; // True only for authorized admins — controls rendering
}

export default function RecordMatch({ leagueId, players, isAuthenticated }: RecordMatchProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // All players prop is already scoped to this league by the parent
  const leaguePlayers = players;

  /**
   * Handle form submission from BulkMatchForm.
   *
   * Transforms each MatchFormData entry into a full LeagueMatch shape:
   * - Resolves player names by looking up IDs in the leaguePlayers array.
   * - Converts the ISO date string from the date picker into a Firestore Timestamp,
   *   falling back to server time (`Timestamp.now()`) if the date field is empty.
   * - Sets `played: true` on every match (these are completed results, not fixtures).
   *
   * Calls `recordBulkMatches` which writes all matches sequentially and updates
   * the league's `matchesPlayed` counter for each one.
   */
  const handleSubmit = async (matches: MatchFormData[]) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const matchesToRecord: Omit<LeagueMatch, 'id'>[] = matches.map((match) => {
        // Look up display names to denormalize into the match document
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
          // Use the selected date or fall back to "now" if the field was left empty
          date: match.date ? Timestamp.fromDate(new Date(match.date)) : Timestamp.now(),
          played: true,
        };
      });

      await recordBulkMatches(matchesToRecord);

      setSuccessMessage(
        `Successfully recorded ${matches.length} ${matches.length === 1 ? 'match' : 'matches'}!`
      );

      // Auto-dismiss the success banner after 5 seconds
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
          <h3 className="text-base sm:text-xl font-bold text-light-700 dark:text-gray-400 mb-1">Admin Access Required</h3>
          <p className="text-xs sm:text-sm text-light-500 dark:text-gray-500">You must be an admin to record match results</p>
        </div>
      </Card>
    );
  }

  if (leaguePlayers.length < 2) {
    return (
      <Card variant="glass" className="!p-6 sm:!p-8">
        <div className="text-center py-6 sm:py-10">
          <Edit3 className="w-10 h-10 sm:w-14 sm:h-14 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-xl font-bold text-light-700 dark:text-gray-400 mb-1">Not Enough Players</h3>
          <p className="text-xs sm:text-sm text-light-500 dark:text-gray-500">At least 2 players are required to record matches</p>
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
