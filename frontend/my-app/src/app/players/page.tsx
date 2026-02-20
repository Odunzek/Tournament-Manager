"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Trophy, Users, Loader2, Target } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/layouts/PageHeader';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerCard from '@/components/players/PlayerCard';
import PlayerFormModal from '@/components/players/PlayerFormModal';
import HeadToHeadModal from '@/components/players/HeadToHeadModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Player, PlayerFilters } from '@/types/player';
import { useRouter } from 'next/navigation';
import { usePlayers } from '@/hooks/usePlayers';
import { createPlayer } from '@/lib/playerUtils';
import { useAuth } from '@/lib/AuthContext';

export default function PlayersPage() {
  const router = useRouter();
  const { players, loading } = usePlayers();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isH2HModalOpen, setIsH2HModalOpen] = useState(false);
  const [filters, setFilters] = useState<PlayerFilters>({
    search: '',
    hallOfFameOnly: false,
    sortBy: 'titles',
  });

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.psnId.toLowerCase().includes(query)
      );
    }

    if (filters.hallOfFameOnly) {
      result = result.filter((p) => p.achievements.totalTitles >= 1);
    }

    switch (filters.sortBy) {
      case 'titles':
        result.sort((a, b) => b.achievements.totalTitles - a.achievements.totalTitles);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    return result;
  }, [searchQuery, filters, players]);

  const handlePlayerClick = (player: Player) => {
    router.push(`/players/${player.id}`);
  };

  const handleSubmitPlayer = async (data: any) => {
    try {
      await createPlayer(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Header */}
        <PageHeader
          title="PLAYERS"
          subtitle={`${players.length || 0} registered players`}
          gradient="electric"
        />

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="flex-1">
            <Input
              placeholder="Search by name or PSN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {/* HOF filter */}
            <Button
              variant={filters.hallOfFameOnly ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={<Trophy className="w-3.5 h-3.5" />}
              onClick={() => setFilters({ ...filters, hallOfFameOnly: !filters.hallOfFameOnly })}
            >
              HOF
            </Button>

            {/* Sort pills */}
            {(['titles', 'name', 'recent'] as const).map((sortOption) => (
              <Button
                key={sortOption}
                variant={filters.sortBy === sortOption ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilters({ ...filters, sortBy: sortOption })}
              >
                {sortOption === 'titles' ? 'Titles' : sortOption === 'name' ? 'Name' : 'Recent'}
              </Button>
            ))}

            <div className="w-px bg-black/10 dark:bg-white/10 self-stretch" />

            {/* Compare */}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Target className="w-3.5 h-3.5" />}
              onClick={() => setIsH2HModalOpen(true)}
              disabled={players.length < 2}
            >
              Compare
            </Button>

            {/* Add Player - admin only */}
            {isAuthenticated && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setIsModalOpen(true)}
                glow
              >
                Add
              </Button>
            )}
          </div>
        </motion.div>

        {/* Players Grid */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading players...</p>
          </motion.div>
        ) : filteredPlayers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4"
          >
            {filteredPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
              >
                <PlayerCard
                  player={player}
                  onClick={() => handlePlayerClick(player)}
                  size="sm"
                  showTier={true}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No players found</h3>
            <p className="text-gray-500">
              {searchQuery || filters.hallOfFameOnly
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first player'}
            </p>
          </motion.div>
        )}
      </Container>

      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitPlayer}
        mode="add"
      />

      <HeadToHeadModal
        isOpen={isH2HModalOpen}
        onClose={() => setIsH2HModalOpen(false)}
        players={players}
      />
    </MainLayout>
  );
}
