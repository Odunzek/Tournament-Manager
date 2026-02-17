"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Gamepad2, Loader2, Calendar, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/layouts/PageHeader';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import SeasonCard from '@/components/seasons/SeasonCard';
import CreateSeasonModal from '@/components/seasons/CreateSeasonModal';
import { useSeasons } from '@/hooks/useSeasons';
import { useAuth } from '@/lib/AuthContext';
import { createSeason } from '@/lib/seasonUtils';
import { SeasonFormData, SeasonStatus } from '@/types/season';

type StatusFilter = 'all' | SeasonStatus;

export default function SeasonsPage() {
  const router = useRouter();
  const { seasons, loading } = useSeasons();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredSeasons = useMemo(() => {
    let result = [...seasons];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.gameVersion.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    return result;
  }, [searchQuery, statusFilter, seasons]);

  const activeCount = seasons.filter((s) => s.status === 'active').length;
  const setupCount = seasons.filter((s) => s.status === 'setup').length;
  const completedCount = seasons.filter((s) => s.status === 'completed').length;

  const handleSeasonClick = (slug: string) => {
    router.push(`/seasons/${slug}`);
  };

  const handleCreateSeason = async (data: SeasonFormData) => {
    await createSeason(data);
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Header */}
        <PageHeader
          title="SEASONS"
          subtitle={`Manage your ${seasons.length} seasons`}
          gradient="cyber"
        />

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-light-900 dark:text-white">{activeCount}</div>
                <div className="text-sm text-light-600 dark:text-gray-400">Active</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/30 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-light-900 dark:text-white">{setupCount}</div>
                <div className="text-sm text-light-600 dark:text-gray-400">Setup</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-2 border-gray-500/30 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-light-900 dark:text-white">{completedCount}</div>
                <div className="text-sm text-light-600 dark:text-gray-400">Completed</div>
              </div>
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
                placeholder="Search by name, game version, or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-12 pr-4 py-3
                  bg-light-100/80 dark:bg-gray-900/50 border-2 border-black/10 dark:border-white/10
                  rounded-2xl
                  text-light-900 dark:text-white placeholder-gray-500
                  focus:outline-none focus:border-cyber-500/50
                  transition-colors
                  backdrop-blur-xl
                "
              />
            </div>

            {/* Create Season Button - Admin Only */}
            {isAuthenticated && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="
                  px-6 py-3
                  bg-gradient-to-r from-cyber-500 to-cyber-600
                  hover:from-cyber-600 hover:to-cyber-700
                  text-white font-bold
                  rounded-2xl
                  transition-all duration-300
                  hover:shadow-glow
                  flex items-center justify-center gap-2
                  whitespace-nowrap
                "
              >
                <Plus className="w-5 h-5" />
                <span>Create Season</span>
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-light-600 dark:text-gray-400" />
              <span className="text-light-600 dark:text-gray-400 text-sm">Status:</span>
              {(['all', 'active', 'setup', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    px-4 py-2 rounded-full
                    font-semibold text-sm
                    transition-all duration-300
                    ${
                      statusFilter === status
                        ? 'bg-gradient-to-r from-cyber-500 to-electric-500 text-white'
                        : 'bg-light-200/80 dark:bg-white/10 text-light-700 dark:text-gray-300 hover:bg-light-300 dark:hover:bg-white/20'
                    }
                  `}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Seasons Grid */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-light-600 dark:text-gray-400">Loading seasons...</p>
          </motion.div>
        ) : filteredSeasons.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredSeasons.map((season, index) => (
              <motion.div
                key={season.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
              >
                <SeasonCard
                  season={season}
                  onClick={() => handleSeasonClick(season.slug)}
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
            <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-light-700 dark:text-gray-400 mb-2">No seasons found</h3>
            <p className="text-light-600 dark:text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first season'}
            </p>
          </motion.div>
        )}
      </Container>

      {/* Create Season Modal */}
      <CreateSeasonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSeason}
      />
    </MainLayout>
  );
}
