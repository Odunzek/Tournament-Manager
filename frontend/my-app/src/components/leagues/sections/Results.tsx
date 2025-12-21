"use client";

import React, { useState, useMemo } from 'react';
import { ListChecks, Filter } from 'lucide-react';
import { LeagueMatch } from '@/types/league';
import { Player } from '@/types/player';
import Card from '../../ui/Card';
import MatchResultCard from '../MatchResultCard';

interface ResultsProps {
  matches: LeagueMatch[];
  players: Player[];
  isLoading: boolean;
}

export default function Results({ matches, players, isLoading }: ResultsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

  const filteredMatches = useMemo(() => {
    if (selectedPlayer === 'all') {
      return matches;
    }
    return matches.filter(
      (match) => match.playerA === selectedPlayer || match.playerB === selectedPlayer
    );
  }, [matches, selectedPlayer]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Loading results...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card variant="glass">
        <div className="text-center py-16">
          <ListChecks className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">No Results Yet</h3>
          <p className="text-gray-500">Match results will appear here after they are recorded</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-cyber-400" />
          Match Results
        </h2>

        {/* Player Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="px-3 py-2 bg-dark-100 border border-white/10 rounded-tech text-white text-sm focus:outline-none focus:border-cyber-500/50"
          >
            <option value="all">All Players</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredMatches.length} of {matches.length} matches
      </div>

      {/* Match Results */}
      {filteredMatches.length > 0 ? (
        <div className="space-y-3">
          {filteredMatches.map((match, index) => (
            <MatchResultCard key={match.id} match={match} index={index} />
          ))}
        </div>
      ) : (
        <Card variant="glass">
          <div className="text-center py-12">
            <p className="text-gray-400">No matches found for this player</p>
          </div>
        </Card>
      )}
    </div>
  );
}
