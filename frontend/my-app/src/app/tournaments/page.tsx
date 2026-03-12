/**
 * Tournaments List Page
 *
 * Displays all tournaments with Firebase real-time updates.
 * Features search, filtering, and admin-only tournament creation.
 *
 * @page
 * @features
 * - Real-time tournament list from Firebase
 * - Search by tournament name
 * - Filter by status (Setup, Groups, Knockout, Completed)
 * - Admin-only create tournament button
 * - Click to view tournament details
 * - Loading states and empty states
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Loader2, Calendar } from 'lucide-react';
import MainLayout from '../../components/layouts/MainLayout';
import PageHeader from '../../components/layouts/PageHeader';
import Container from '../../components/layouts/Container';
import GlobalNavigation from '../../components/layouts/GlobalNavigation';
import TournamentCard from '../../components/tournaments/TournamentCard';
import CreateTournamentModal from '../../components/tournaments/CreateTournamentModal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Tournament, subscribeToTournaments } from '@/lib/tournamentUtils';
import { AuthProvider, AuthModal, useAuth } from '@/lib/AuthContext';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { useSeasons } from '@/hooks/useSeasons';
import CustomDropdown from '@/components/ui/CustomDropdown';

// Firebase Tournament status types for filtering
type TournamentStatusFilter = 'setup' | 'group_stage' | 'knockout' | 'completed' | 'all';

function TournamentsContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth(); // Get admin authentication status
  const { activeSeason } = useActiveSeason();
  const { seasons } = useSeasons();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatusFilter>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('active_season');
  const [showCreateModal, setShowCreateModal] = useState(false); // Modal visibility state

  // Subscribe to Firebase tournaments in real-time
  useEffect(() => {
    const unsubscribe = subscribeToTournaments((fetchedTournaments) => {
      setTournaments(fetchedTournaments);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const filteredTournaments = tournaments.filter(tournament => {
    // Filter by season
    if (seasonFilter === 'active_season' && activeSeason?.id) {
      if (tournament.seasonId !== activeSeason.id) return false;
    } else if (seasonFilter !== 'all' && seasonFilter !== 'active_season') {
      if (tournament.seasonId !== seasonFilter) return false;
    }

    // Filter by status
    if (statusFilter !== 'all' && tournament.status !== statusFilter) return false;

    // Filter by search
    if (searchQuery) {
      return tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  /**
   * Navigate to tournament detail page
   */
  const handleTournamentClick = (tournamentId: string) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  /**
   * Open create tournament modal (admin only)
   */
  const handleCreateTournament = () => {
    setShowCreateModal(true);
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-4 sm:py-8">
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
          className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6"
        >
          <div className="flex-1">
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Season Filter */}
            {seasons.length > 0 && (
              <>
                <CustomDropdown
                  value={seasonFilter}
                  onChange={(val) => setSeasonFilter(val as string)}
                  options={[
                    ...(activeSeason ? [{ value: 'active_season', label: `● ${activeSeason.name}` }] : []),
                    { value: 'all', label: 'All Seasons' },
                    ...seasons
                      .filter((s) => s.id !== activeSeason?.id)
                      .map((s) => ({ value: s.id!, label: s.name })),
                  ]}
                  className="w-40 sm:w-48"
                />
                <div className="w-px bg-white/10 mx-1 self-stretch" />
              </>
            )}

            {/* Status Filter */}
            {([
              { value: 'all', label: 'All' },
              { value: 'setup', label: 'Setup' },
              { value: 'group_stage', label: 'Groups' },
              { value: 'knockout', label: 'Knockout' },
              { value: 'completed', label: 'Completed' }
            ] as const).map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>

          {/* Admin-only: Create Tournament Button */}
          {isAuthenticated && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleCreateTournament}
              glow
            >
              Create
            </Button>
          )}
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 sm:py-20">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-cyber-400 animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length > 0 ? (
          /* Tournaments Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="h-full"
              >
                <TournamentCard
                  tournament={tournament}
                  onClick={() => handleTournamentClick(tournament.id || '')}
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
            className="text-center py-10 sm:py-20"
          >
            <Filter className="w-12 h-12 sm:w-20 sm:h-20 text-gray-600 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-2xl font-bold text-light-900 dark:text-white mb-1 sm:mb-2">No tournaments found</h3>
            <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400 mb-4 sm:mb-8">
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

        {/* Stats Footer — inline glass grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 bg-white/90 dark:bg-white/5 backdrop-blur-xl border-2 border-cyber-500/30 dark:border-white/10 rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10">
            {[
              { label: 'Total', value: filteredTournaments.length },
              { label: 'Active', value: filteredTournaments.filter(t => t.status === 'group_stage' || t.status === 'knockout').length },
              { label: 'Setup', value: filteredTournaments.filter(t => t.status === 'setup').length },
              { label: 'Done', value: filteredTournaments.filter(t => t.status === 'completed').length },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2.5 sm:py-3 px-1">
                <p className="text-base sm:text-xl font-bold text-light-900 dark:text-white">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Create Tournament Modal (Admin Only) */}
        <CreateTournamentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Modal will close automatically and tournaments list will update via real-time listener
          }}
        />
      </Container>
    </MainLayout>
  );
}

export default function TournamentsPage() {
  return (
    <AuthProvider>
      <TournamentsContent />
      <AuthModal />
    </AuthProvider>
  );
}
