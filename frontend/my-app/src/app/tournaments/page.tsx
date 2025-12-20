"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import MainLayout from '../../components/layouts/MainLayout';
import PageHeader from '../../components/layouts/PageHeader';
import Container from '../../components/layouts/Container';
import TournamentCard from '../../components/tournaments/TournamentCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Tournament, TournamentStatus } from '@/types/tournament';

// Mock data - replace with Firebase data later
const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Champions League 2024',
    type: 'groups_knockout',
    status: 'active',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-15'),
    numberOfTeams: 32,
    numberOfGroups: 8,
    currentRound: 'Group Stage - Matchday 3',
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-10-15'),
  },
  {
    id: '2',
    name: 'Premier League Tournament',
    type: 'league',
    status: 'active',
    startDate: new Date('2024-08-10'),
    endDate: new Date('2025-05-20'),
    numberOfTeams: 20,
    currentRound: 'Matchday 12',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-10-10'),
  },
  {
    id: '3',
    name: 'FA Cup 2024',
    type: 'knockout',
    status: 'upcoming',
    startDate: new Date('2025-01-05'),
    endDate: new Date('2025-05-25'),
    numberOfTeams: 64,
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: '4',
    name: 'Europa League 2023',
    type: 'groups_knockout',
    status: 'completed',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-12-20'),
    numberOfTeams: 32,
    numberOfGroups: 8,
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2023-12-20'),
  },
];

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments] = useState(mockTournaments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all');

  const filteredTournaments = tournaments.filter(tournament => {
    // Filter by status
    if (statusFilter !== 'all' && tournament.status !== statusFilter) return false;

    // Filter by search
    if (searchQuery) {
      return tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const handleTournamentClick = (tournamentId: string) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  const handleCreateTournament = () => {
    // TODO: Open create tournament modal
    console.log('Create tournament');
  };

  return (
    <MainLayout>
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Header */}
        <PageHeader
          title="Tournaments"
          subtitle="Manage your football tournaments"
          gradient="electric"
        />

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="flex-1">
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'upcoming', 'completed'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleCreateTournament}
            glow
          >
            Create
          </Button>
        </motion.div>

        {/* Tournaments Grid */}
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <TournamentCard
                  tournament={tournament}
                  onClick={() => handleTournamentClick(tournament.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          // Empty State
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <Filter className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="text-gray-400 mb-8">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first tournament to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={handleCreateTournament}
                glow
              >
                Create Tournament
              </Button>
            )}
          </motion.div>
        )}

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Tournaments', value: tournaments.length },
            {
              label: 'Active',
              value: tournaments.filter(t => t.status === 'active').length,
            },
            {
              label: 'Upcoming',
              value: tournaments.filter(t => t.status === 'upcoming').length,
            },
            {
              label: 'Completed',
              value: tournaments.filter(t => t.status === 'completed').length,
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-4 bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-tech"
            >
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent">
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      </Container>
    </MainLayout>
  );
}
