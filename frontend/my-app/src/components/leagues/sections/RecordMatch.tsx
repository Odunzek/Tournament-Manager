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
      <Card variant="glass">
        <div className="text-center py-16">
          <Edit3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">Admin Access Required</h3>
          <p className="text-gray-500">You must be an admin to record match results</p>
        </div>
      </Card>
    );
  }

  if (leaguePlayers.length < 2) {
    return (
      <Card variant="glass">
        <div className="text-center py-16">
          <Edit3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">Not Enough Players</h3>
          <p className="text-gray-500">At least 2 players are required to record matches</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-cyber-400" />
          Record Match Results
        </h2>
        <p className="text-gray-400">
          Record multiple match results at once. All fields are required.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card variant="glass" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <p className="text-green-400 font-semibold">{successMessage}</p>
          </div>
        </Card>
      )}

      {/* Bulk Match Form */}
      <BulkMatchForm players={leaguePlayers} onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      {/* Info Card */}
      <Card variant="glass">
        <h4 className="text-sm font-bold text-white mb-3">Recording Tips</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-cyber-400 mt-0.5">•</span>
            <span>
              Standings are automatically calculated based on match results (Win = 3pts, Draw = 1pt, Loss = 0pts)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyber-400 mt-0.5">•</span>
            <span>
              You can record multiple matches at once by clicking "Add Another Match"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyber-400 mt-0.5">•</span>
            <span>A player cannot play against themselves</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyber-400 mt-0.5">•</span>
            <span>All scores must be non-negative numbers</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
