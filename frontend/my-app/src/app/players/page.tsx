"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Trophy, Users, Loader2, Target, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/layouts/PageHeader';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerAvatar from '@/components/players/PlayerAvatar';
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

        {/* Players List */}
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
            className="rounded-xl overflow-hidden border border-black/8 dark:border-white/8
                       grid grid-cols-1 sm:grid-cols-2 gap-px
                       bg-black/8 dark:bg-white/8"
          >
            {filteredPlayers.map((player, index) => {
              const titles = player.achievements.totalTitles;
              const leagueWins = player.achievements.leagueWins;
              const tournamentWins = player.achievements.tournamentWins;
              const tier = player.achievements.tier;

              const accentBorder =
                tier === 'legend'   ? 'border-l-yellow-500' :
                tier === 'champion' ? 'border-l-electric-500' :
                tier === 'veteran'  ? 'border-l-orange-400' :
                                     'border-l-transparent';

              const tierBadge =
                tier === 'legend'   ? { label: 'Legend',  className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' } :
                tier === 'champion' ? { label: 'Champ',   className: 'bg-electric-500/10 text-electric-600 dark:text-electric-400 border-electric-500/30' } :
                tier === 'veteran'  ? { label: 'Veteran', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' } :
                                     null;

              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.02 * index }}
                  onClick={() => handlePlayerClick(player)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-left w-full group
                             bg-light-50 dark:bg-dark-50
                             hover:bg-light-100 dark:hover:bg-white/5
                             transition-colors border-l-2 ${accentBorder}`}
                >
                  <PlayerAvatar
                    src={player.avatar}
                    alt={player.name}
                    size="sm"
                    className="!w-8 !h-8 shrink-0"
                    showBorder={titles >= 1}
                    borderColor="border-yellow-500/50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-light-900 dark:text-white truncate leading-tight">
                      {player.name}
                    </p>
                    {player.psnId && player.psnId !== 'player' && (
                      <p className="text-xs text-light-500 dark:text-gray-500 truncate leading-tight">
                        @{player.psnId}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {tierBadge && (
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border ${tierBadge.className}`}>
                        {tierBadge.label}
                      </span>
                    )}
                    {titles > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {leagueWins > 0 && (
                          <span className="flex items-center gap-0.5 text-cyber-600 dark:text-cyber-400">
                            <Trophy className="w-3 h-3" />
                            {leagueWins}
                          </span>
                        )}
                        {tournamentWins > 0 && (
                          <span className="flex items-center gap-0.5 text-electric-600 dark:text-electric-400">
                            <Target className="w-3 h-3" />
                            {tournamentWins}
                          </span>
                        )}
                      </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-light-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              );
            })}
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
