"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, UserPlus, Trophy, Users, Loader2, Target } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/layouts/PageHeader';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerCard from '@/components/players/PlayerCard';
import PlayerFormModal from '@/components/players/PlayerFormModal';
import HeadToHeadModal from '@/components/players/HeadToHeadModal';
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

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.psnId.toLowerCase().includes(query)
      );
    }

    // Hall of Fame filter
    if (filters.hallOfFameOnly) {
      result = result.filter((p) => p.achievements.totalTitles >= 1);
    }

    // Sort
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

  const hallOfFameCount = players.filter((p) => p.achievements?.totalTitles >= 1).length || 0;

  const handlePlayerClick = (player: Player) => {
    router.push(`/players/${player.id}`);
  };

  const handleAddPlayer = () => {
    setIsModalOpen(true);
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
          subtitle={`Manage your ${players.length || 0} registered players`}
          gradient="electric"
        />

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-cyber-500/20 to-cyber-600/20 border-2 border-cyber-500/30 rounded-tech-lg p-4 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-3">
              <Users className="w-6 h-6 text-cyber-400" />
              <div className="text-2xl font-bold text-white">{players.length || 0}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/30 rounded-tech-lg p-4 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div className="text-2xl font-bold text-white">{hallOfFameCount || 0}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-2 border-electric-500/30 rounded-tech-lg p-4 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-3">
              <Filter className="w-6 h-6 text-electric-400" />
              <div className="text-2xl font-bold text-white">{filteredPlayers.length || 0}</div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or PSN ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-12 pr-4 py-3
                  bg-gray-900/50 border-2 border-white/10
                  rounded-tech-lg
                  text-white placeholder-gray-500
                  focus:outline-none focus:border-cyber-500/50
                  transition-colors
                  backdrop-blur-xl
                "
              />
            </div>

            {/* Compare Players Button */}
            <button
              onClick={() => setIsH2HModalOpen(true)}
              disabled={players.length < 2}
              className="
                px-6 py-3
                bg-gradient-to-r from-electric-500 to-pink-600
                hover:from-electric-600 hover:to-pink-700
                text-white font-bold
                rounded-tech-lg
                transition-all duration-300
                hover:shadow-glow-purple
                flex items-center justify-center gap-2
                whitespace-nowrap
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Target className="w-5 h-5" />
              <span className="hidden sm:inline">Compare Players</span>
              <span className="sm:hidden">Compare</span>
            </button>

            {/* Add Player Button - Admin Only */}
            {isAuthenticated && (
              <button
                onClick={handleAddPlayer}
                className="
                  px-6 py-3
                  bg-gradient-to-r from-cyber-500 to-cyber-600
                  hover:from-cyber-600 hover:to-cyber-700
                  text-white font-bold
                  rounded-tech-lg
                  transition-all duration-300
                  hover:shadow-glow
                  flex items-center justify-center gap-2
                  whitespace-nowrap
                "
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Player</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-3 mt-4">
            {/* Hall of Fame Filter */}
            <button
              onClick={() => setFilters({ ...filters, hallOfFameOnly: !filters.hallOfFameOnly })}
              className={`
                px-4 py-2 rounded-full
                font-semibold text-sm
                transition-all duration-300
                ${
                  filters.hallOfFameOnly
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }
              `}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Hall of Fame Only
            </button>

            {/* Sort Options */}
            <div className="flex gap-2">
              <span className="text-gray-400 text-sm self-center">Sort by:</span>
              {(['titles', 'name', 'recent'] as const).map((sortOption) => (
                <button
                  key={sortOption}
                  onClick={() => setFilters({ ...filters, sortBy: sortOption })}
                  className={`
                    px-4 py-2 rounded-full
                    font-semibold text-sm
                    transition-all duration-300
                    ${
                      filters.sortBy === sortOption
                        ? 'bg-gradient-to-r from-cyber-500 to-electric-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }
                  `}
                >
                  {sortOption === 'titles' && 'Titles'}
                  {sortOption === 'name' && 'Name'}
                  {sortOption === 'recent' && 'Recent'}
                </button>
              ))}
            </div>
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
            transition={{ delay: 0.4 }}
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
            transition={{ delay: 0.4 }}
            className="text-center py-16"
          >
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No players found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first player'}
            </p>
          </motion.div>
        )}
      </Container>

      {/* Add Player Modal */}
      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitPlayer}
        mode="add"
      />

      {/* Head-to-Head Comparison Modal */}
      <HeadToHeadModal
        isOpen={isH2HModalOpen}
        onClose={() => setIsH2HModalOpen(false)}
        players={players}
      />
    </MainLayout>
  );
}
