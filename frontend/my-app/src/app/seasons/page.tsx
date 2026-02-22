"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Gamepad2, Loader2 } from 'lucide-react';
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

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'setup', 'completed'];
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  active: 'Active',
  setup: 'Setup',
  completed: 'Completed',
};

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

  const counts: Record<SeasonStatus, number> = {
    active: seasons.filter((s) => s.status === 'active').length,
    setup: seasons.filter((s) => s.status === 'setup').length,
    completed: seasons.filter((s) => s.status === 'completed').length,
  };

  const handleCreateSeason = async (data: SeasonFormData) => {
    await createSeason(data);
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        <PageHeader
          title="SEASONS"
          subtitle={`${seasons.length} season${seasons.length !== 1 ? 's' : ''} · ${counts.active} active`}
          gradient="cyber"
        />

        {/* Search + filters + create */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 mb-5 space-y-3"
        >
          {/* Search row */}
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search seasons…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                           bg-light-100/80 dark:bg-dark-100/60
                           border border-black/10 dark:border-white/8
                           text-light-900 dark:text-white placeholder-gray-500
                           focus:outline-none focus:border-cyber-500/50 transition-colors"
              />
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                           bg-gradient-to-r from-cyber-500 to-cyber-600
                           hover:from-cyber-600 hover:to-cyber-700
                           text-white transition-all hover:shadow-glow whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Season
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-cyber-500 to-electric-500 text-white'
                    : 'bg-light-200/80 dark:bg-white/8 text-light-700 dark:text-gray-400 hover:bg-light-300 dark:hover:bg-white/15'
                }`}
              >
                {STATUS_LABELS[status]}
                {status !== 'all' && counts[status] > 0 && (
                  <span className="ml-1 opacity-70">{counts[status]}</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Seasons list */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-10 h-10 text-cyber-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-light-600 dark:text-gray-400">Loading seasons…</p>
          </motion.div>
        ) : filteredSeasons.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            {filteredSeasons.map((season, index) => (
              <motion.div
                key={season.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
              >
                <SeasonCard
                  season={season}
                  onClick={() => router.push(`/seasons/${season.slug}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-light-700 dark:text-gray-400 mb-1">
              No seasons found
            </h3>
            <p className="text-sm text-light-600 dark:text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first season'}
            </p>
          </motion.div>
        )}
      </Container>

      <CreateSeasonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSeason}
      />
    </MainLayout>
  );
}
