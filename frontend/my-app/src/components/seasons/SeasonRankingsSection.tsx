"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, Download } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DraggableRankingCard from '@/app/components/DraggableRankingCard';
import { useSeasonRankings } from '@/hooks/useSeasonRankings';
import { useAuth } from '@/lib/AuthContext';
import {
  copyGlobalRankingsToSeason,
  saveSeasonRankingOrder,
  updateSeasonRankingFields,
} from '@/lib/seasonIntegrationUtils';
import type { RankingEntry } from '@/lib/rankingUtils';
import type { SeasonStatus } from '@/types/season';

interface SeasonRankingsSectionProps {
  seasonId: string;
  seasonStatus: SeasonStatus;
}

export default function SeasonRankingsSection({
  seasonId,
  seasonStatus,
}: SeasonRankingsSectionProps) {
  const { rankings, loading } = useSeasonRankings(seasonId);
  const { isAuthenticated } = useAuth();
  const [initializing, setInitializing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isEditable = isAuthenticated && seasonStatus !== 'completed';

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await copyGlobalRankingsToSeason(seasonId);
      showToast('Rankings initialized from global P4P rankings', 'success');
    } catch (error) {
      console.error('Error initializing rankings:', error);
      showToast('Failed to initialize rankings', 'error');
    } finally {
      setInitializing(false);
    }
  };

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const newOrder = [...rankings];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);

      // Optimistic: save immediately
      try {
        await saveSeasonRankingOrder(
          seasonId,
          newOrder.map((r) => r.memberId)
        );
      } catch (error) {
        console.error('Error saving ranking order:', error);
        showToast('Failed to save ranking order', 'error');
      }
    },
    [rankings, seasonId, showToast]
  );

  if (loading) {
    return (
      <Card variant="default">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-600/30 dark:border-transparent flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-light-900 dark:text-white">P4P Rankings</h2>
        </div>
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-cyber-400 mx-auto animate-spin" />
          <p className="text-light-600 dark:text-gray-400 mt-3">Loading rankings...</p>
        </div>
      </Card>
    );
  }

  // Empty state — offer to initialize
  if (rankings.length === 0) {
    return (
      <Card variant="default">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-600/30 dark:border-transparent flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-light-900 dark:text-white">P4P Rankings</h2>
        </div>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-light-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-light-600 dark:text-gray-400 mb-4">
            No rankings have been set for this season yet.
          </p>
          {isAuthenticated && (seasonStatus === 'active' || seasonStatus === 'setup') && (
            <Button
              onClick={handleInitialize}
              isLoading={initializing}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Initialize Rankings from Global P4P
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Rankings exist — render list
  return (
    <Card variant="default">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-600/30 dark:border-transparent flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-light-900 dark:text-white">P4P Rankings</h2>
            <p className="text-sm text-light-600 dark:text-gray-400">
              {rankings.length} player{rankings.length !== 1 ? 's' : ''} ranked
              {seasonStatus === 'completed' && ' (final)'}
            </p>
          </div>
        </div>
        {seasonStatus === 'completed' && (
          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-500/20 text-light-600 dark:text-gray-400 border-gray-500/30">
            Read-only
          </span>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : toast.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-cyber-500/10 border border-cyber-500/30 text-cyber-400'
          }`}
        >
          {toast.msg}
        </motion.div>
      )}

      {/* Column Headers */}
      <div className="flex justify-between items-center px-4 mb-2">
        <span className="text-xs font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">
          Rank / Player
        </span>
        <div className="flex gap-6 text-xs font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">
          <span className="w-24 sm:w-32 text-center">Cool Off</span>
          <span className="w-24 sm:w-32 text-center">Wild Card</span>
          {isEditable && <span className="w-28 text-center">Jump to</span>}
        </div>
      </div>

      {/* Ranking Cards */}
      <div className="space-y-2">
        {rankings.map((player, index) => (
          <SeasonDraggableCard
            key={player.memberId}
            player={player}
            index={index}
            rankings={rankings}
            isEditable={isEditable}
            seasonId={seasonId}
            showToast={showToast}
            onReorder={handleReorder}
          />
        ))}
      </div>
    </Card>
  );
}

/**
 * Wrapper around DraggableRankingCard that overrides field update to use
 * season-scoped functions instead of global ranking functions.
 */
function SeasonDraggableCard({
  player,
  index,
  rankings,
  isEditable,
  seasonId,
  showToast,
  onReorder,
}: {
  player: RankingEntry;
  index: number;
  rankings: RankingEntry[];
  isEditable: boolean;
  seasonId: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  // For completed/non-admin seasons, use DraggableRankingCard in read-only mode
  return (
    <DraggableRankingCard
      player={player}
      index={index}
      rankings={rankings}
      isAuthenticated={isEditable}
      showToast={showToast}
      onReorder={onReorder}
    />
  );
}
