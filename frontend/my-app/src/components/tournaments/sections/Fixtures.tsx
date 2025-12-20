"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { TournamentSectionProps, Match } from '@/types/tournament';
import MatchCard from '../MatchCard';
import RecordResultModal from '../RecordResultModal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

// Mock data - replace with Firebase data later
const mockMatches: Match[] = [
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
    id: '2',
    tournamentId: '1',
    homeTeamId: '3',
    homeTeamName: 'Bayern Munich',
    awayTeamId: '4',
    awayTeamName: 'PSG',
    status: 'scheduled',
    scheduledDate: new Date('2024-10-20T18:00:00'),
    groupId: 'group-a',
    round: 'Matchday 4',
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
    id: '4',
    tournamentId: '1',
    homeTeamId: '7',
    homeTeamName: 'Inter Milan',
    awayTeamId: '8',
    awayTeamName: 'Atletico Madrid',
    status: 'scheduled',
    scheduledDate: new Date('2024-10-21T20:00:00'),
    groupId: 'group-b',
    round: 'Matchday 4',
  },
];

export default function Fixtures({ tournamentId }: TournamentSectionProps) {
  const [matches] = useState(mockMatches);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const handleRecordResult = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setShowRecordModal(true);
    }
  };

  const handleSubmitResult = async (result: any) => {
    console.log('Submitting result:', result);
    // TODO: Submit to Firebase
    setShowRecordModal(false);
  };

  const filteredMatches = matches.filter(match => {
    // Filter by status
    if (filter === 'upcoming' && match.status === 'completed') return false;
    if (filter === 'completed' && match.status !== 'completed') return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        match.homeTeamName.toLowerCase().includes(query) ||
        match.awayTeamName.toLowerCase().includes(query) ||
        match.round?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const upcomingMatches = filteredMatches.filter(m => m.status !== 'completed');
  const completedMatches = filteredMatches.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by team or round..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className="capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </div>

      {/* Upcoming Matches */}
      {(filter === 'all' || filter === 'upcoming') && upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-400 animate-pulse" />
            Upcoming Matches
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchCard
                  match={match}
                  showGroup
                  showDate
                  onRecordResult={handleRecordResult}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {(filter === 'all' || filter === 'completed') && completedMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Completed Matches</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchCard
                  match={match}
                  showGroup
                  showDate
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredMatches.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No matches found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters or search query
          </p>
        </motion.div>
      )}

      {/* Record Result Modal */}
      {selectedMatch && (
        <RecordResultModal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          match={selectedMatch}
          onSubmit={handleSubmitResult}
        />
      )}
    </div>
  );
}
