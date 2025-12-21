"use client";

import React from 'react';
import { Trophy } from 'lucide-react';
import { LeaguePlayer } from '@/types/league';
import Card from '../../ui/Card';
import StandingsTable from '../StandingsTable';

interface StandingsProps {
  standings: LeaguePlayer[];
  leagueId: string;
  currentUserId?: string;
  isLoading: boolean;
}

export default function Standings({ standings, leagueId, currentUserId, isLoading }: StandingsProps) {
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Loading standings...</p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <Card variant="glass">
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">No Standings Yet</h3>
          <p className="text-gray-500">Standings will appear after matches are recorded</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-cyber-400" />
          League Standings
        </h2>
        <div className="text-sm text-gray-400">
          {standings.length} {standings.length === 1 ? 'player' : 'players'}
        </div>
      </div>

      {/* Standings Table */}
      <Card variant="glass">
        <StandingsTable players={standings} leagueId={leagueId} currentUserId={currentUserId} />
      </Card>

      {/* Legend */}
      <Card variant="glass">
        <h4 className="text-sm font-bold text-white mb-3">Table Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="font-semibold text-gray-400">P</span>
            <span className="text-gray-500"> - Played</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">W</span>
            <span className="text-gray-500"> - Won</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">D</span>
            <span className="text-gray-500"> - Draw</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">L</span>
            <span className="text-gray-500"> - Lost</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">GF</span>
            <span className="text-gray-500"> - Goals For</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">GA</span>
            <span className="text-gray-500"> - Goals Against</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">GD</span>
            <span className="text-gray-500"> - Goal Difference</span>
          </div>
          <div>
            <span className="font-semibold text-gray-400">Pts</span>
            <span className="text-gray-500"> - Points</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-gray-400">Form</span>
            <span className="text-gray-500"> - Last 5 matches</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500">
            <span className="text-green-400 font-semibold">Win = 3 points</span>,{' '}
            <span className="text-yellow-400 font-semibold">Draw = 1 point</span>,{' '}
            <span className="text-red-400 font-semibold">Loss = 0 points</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
