"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Calendar, Loader2, Trophy } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlayerAvatar from '@/components/players/PlayerAvatar';
import TrophyDisplay from '@/components/players/TrophyDisplay';
import PlayerFormModal from '@/components/players/PlayerFormModal';
import { usePlayer } from '@/hooks/usePlayers';
import { useSeasons } from '@/hooks/useSeasons';
import { updatePlayer, deletePlayer, setSeasonAchievements } from '@/lib/playerUtils';
import { useAuth } from '@/lib/AuthContext';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  const { player, loading } = usePlayer(playerId);
  const { seasons } = useSeasons();
  const { isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isHallOfFame = player ? player.achievements.totalTitles >= 1 : false;

  const handleSubmitEdit = async (data: any) => {
    try {
      const { selectedSeasonId, achievements, ...basicInfo } = data;
      await updatePlayer(playerId, basicInfo);
      if (selectedSeasonId && achievements) {
        await setSeasonAchievements(
          playerId,
          selectedSeasonId,
          achievements.leagueWins,
          achievements.tournamentWins
        );
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }
    try {
      setIsDeleting(true);
      await deletePlayer(playerId);
      router.push('/players');
    } catch (error) {
      console.error('Error deleting player:', error);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-4 sm:py-8">
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading player...</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!player) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-4 sm:py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-400 mb-2">Player not found</h2>
            <button
              onClick={() => router.push('/players')}
              className="text-cyber-400 hover:text-cyber-300 transition-colors"
            >
              ← Back to Players
            </button>
          </div>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-4 sm:py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/players')}
          className="flex items-center gap-2 mb-6 text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Players</span>
        </motion.button>

        {/* Player Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card
            variant="gradient"
            glow={isHallOfFame}
            className={isHallOfFame ? 'border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : ''}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <PlayerAvatar
                src={player.avatar}
                alt={player.name}
                size="xl"
                showBorder={true}
                borderColor={isHallOfFame ? 'border-yellow-500/50' : 'border-cyber-500/50'}
              />

              {/* Player Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-light-900 dark:text-white mb-1">
                  {player.name}
                </h1>
                {player.psnId && player.psnId !== 'player' && (
                  <p className="text-sm text-light-600 dark:text-gray-400 mb-2">@{player.psnId}</p>
                )}

                {player.achievements.inductionDate && (
                  <div className="flex items-center gap-1.5 text-xs text-light-600 dark:text-gray-400 justify-center sm:justify-start">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Hall of Fame since{' '}
                      {new Date(player.achievements.inductionDate).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-light-600 dark:text-gray-400 mt-1 justify-center sm:justify-start">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Member since{' '}
                    {new Date(player.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Admin Action Buttons */}
              {isAuthenticated && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Edit className="w-4 h-4" />}
                    onClick={() => setIsEditModalOpen(true)}
                    title="Edit Player"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="Delete Player"
                  />
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Achievements
          </h2>
          <div className="overflow-x-auto">
            <TrophyDisplay
              leagueWins={player.achievements.leagueWins}
              tournamentWins={player.achievements.tournamentWins}
              totalTitles={player.achievements.totalTitles}
              layout="horizontal"
              size="sm"
              showLabels={true}
              animated={true}
            />
          </div>
        </motion.div>

        {/* Per-Season Breakdown */}
        {player.seasonAchievements && Object.keys(player.seasonAchievements).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyber-400" />
              Season Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(player.seasonAchievements)
                .sort(([, a], [, b]) => b.totalTitles - a.totalTitles)
                .map(([seasonId, achievements]) => {
                  const seasonName = seasons.find((s) => s.id === seasonId)?.name ?? seasonId;
                  return (
                    <div
                      key={seasonId}
                      className="bg-gradient-to-br from-light-200/50 to-light-300/50 dark:from-white/5 dark:to-white/10 border border-black/10 dark:border-white/10 rounded-2xl p-4 backdrop-blur-sm"
                    >
                      <h3 className="text-base font-bold text-light-900 dark:text-white mb-3">{seasonName}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-light-600 dark:text-gray-400">
                            <Trophy className="w-4 h-4 text-cyber-400" />
                            Leagues
                          </span>
                          <span className="font-bold text-cyber-600 dark:text-cyber-400">{achievements.leagueWins}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-light-600 dark:text-gray-400">
                            <Trophy className="w-4 h-4 text-electric-400" />
                            Tournaments
                          </span>
                          <span className="font-bold text-electric-600 dark:text-electric-400">{achievements.tournamentWins}</span>
                        </div>
                        <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                          <span className="text-sm font-semibold text-light-600 dark:text-gray-400">Total Titles</span>
                          <span className="font-black text-lg text-yellow-600 dark:text-yellow-400">{achievements.totalTitles}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Membership Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-sm"
        >
          <Card variant="default">
            <h3 className="text-sm font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyber-400" />
              Membership Info
            </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-light-600 dark:text-gray-300">Member Since</span>
                  <span className="text-cyber-600 dark:text-cyber-400 font-bold text-sm">
                    {new Date(player.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-light-600 dark:text-gray-300">Last Updated</span>
                  <span className="text-electric-600 dark:text-electric-400 font-bold text-sm">
                    {new Date(player.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
          </Card>
        </motion.div>
      </Container>

      {/* Edit Player Modal */}
      <PlayerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSubmitEdit}
        player={player}
        mode="edit"
      />
    </MainLayout>
  );
}
