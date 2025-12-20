"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter as FilterIcon } from 'lucide-react';
import { TournamentSectionProps, Match } from '@/types/tournament';
import MatchCard from '../MatchCard';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

// Mock completed matches
const mockCompletedMatches: Match[] = [
  {
    id: '1',
    tournamentId: '1',
    homeTeamId: '1',
    homeTeamName: 'Manchester City',
    awayTeamId: '2',
    awayTeamName: 'Real Madrid',
    homeScore: 3,
    awayScore: 1,
    status: 'completed',
    scheduledDate: new Date('2024-10-01T20:00:00'),
    groupId: 'group-a',
    round: 'Matchday 1',
    playedAt: new Date('2024-10-01T22:00:00'),
  },
  {
    id: '3',
    tournamentId: '1',
    homeTeamId: '5',
    homeTeamName: 'Barcelona',
    awayTeamId: '6',
    awayTeamName: 'Liverpool',
    homeScore: 2,
    awayScore: 2,
    status: 'completed',
    scheduledDate: new Date('2024-10-02T20:00:00'),
    groupId: 'group-b',
    round: 'Matchday 1',
    playedAt: new Date('2024-10-02T22:00:00'),
  },
  {
    id: '5',
    tournamentId: '1',
    homeTeamId: '3',
    homeTeamName: 'Bayern Munich',
    awayTeamId: '4',
    awayTeamName: 'PSG',
    homeScore: 4,
    awayScore: 0,
    status: 'completed',
    scheduledDate: new Date('2024-10-08T20:00:00'),
    groupId: 'group-a',
    round: 'Matchday 2',
    playedAt: new Date('2024-10-08T22:00:00'),
  },
  {
    id: '6',
    tournamentId: '1',
    homeTeamId: '1',
    homeTeamName: 'Manchester City',
    awayTeamId: '3',
    awayTeamName: 'Bayern Munich',
    homeScore: 1,
    awayScore: 0,
    status: 'completed',
    scheduledDate: new Date('2024-10-09T20:00:00'),
    groupId: 'group-a',
    round: 'Matchday 2',
    playedAt: new Date('2024-10-09T22:00:00'),
  },
];

export default function Results({ tournamentId }: TournamentSectionProps) {
  const [matches] = useState(mockCompletedMatches);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRound, setSelectedRound] = useState<string>('all');

  const filteredMatches = matches.filter(match => {
    // Filter by round
    if (selectedRound !== 'all' && match.round !== selectedRound) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        match.homeTeamName.toLowerCase().includes(query) ||
        match.awayTeamName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const rounds = Array.from(new Set(matches.map(m => m.round).filter(Boolean)));

  // Group matches by date
  const matchesByDate = filteredMatches.reduce((acc, match) => {
    const date = new Date(match.playedAt || match.scheduledDate).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting results...');
  };

  const totalGoals = filteredMatches.reduce((sum, match) => {
    return sum + (match.homeScore || 0) + (match.awayScore || 0);
  }, 0);

  const averageGoals = filteredMatches.length > 0
    ? (totalGoals / filteredMatches.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Matches', value: filteredMatches.length },
          { label: 'Total Goals', value: totalGoals },
          { label: 'Avg Goals/Match', value: averageGoals },
          { label: 'Highest Score', value: '4-0' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-tech p-4"
          >
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<FilterIcon className="w-4 h-4" />}
          />
        </div>

        <select
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
          className="px-4 py-2.5 bg-dark-100/50 backdrop-blur-sm border-2 border-white/10 rounded-tech text-gray-100 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20 transition-all duration-200"
        >
          <option value="all">All Rounds</option>
          {rounds.map(round => (
            <option key={round} value={round}>
              {round}
            </option>
          ))}
        </select>

        <Button
          variant="outline"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Export
        </Button>
      </div>

      {/* Results by Date */}
      {Object.entries(matchesByDate)
        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
        .map(([date, dateMatches], groupIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-cyber-400" />
              <h3 className="text-lg font-bold text-white">{date}</h3>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {dateMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                >
                  <MatchCard
                    match={match}
                    showGroup
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

      {/* Empty State */}
      {filteredMatches.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FilterIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No results found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters or search query
          </p>
        </motion.div>
      )}
    </div>
  );
}
