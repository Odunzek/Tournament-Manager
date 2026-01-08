"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerAvatar from '@/components/players/PlayerAvatar';
import TrophyDisplay from '@/components/players/TrophyDisplay';
import PlayerFormModal from '@/components/players/PlayerFormModal';
import { usePlayer } from '@/hooks/usePlayers';
import { updatePlayer, deletePlayer } from '@/lib/playerUtils';
import { useAuth } from '@/lib/AuthContext';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  const { player, loading } = usePlayer(playerId);
  const { isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isHallOfFame = player ? player.achievements.totalTitles >= 3 : false;

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (data: any) => {
    try {
      await updatePlayer(playerId, data);
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
        <Container maxWidth="2xl" className="py-8 sm:py-12">
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
        <Container maxWidth="2xl" className="py-8 sm:py-12">
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
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/players')}
          className="
            flex items-center gap-2 mb-6
            text-gray-400 hover:text-white
            transition-colors duration-200
          "
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Players</span>
        </motion.button>

        {/* Player Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`
            relative overflow-hidden
            bg-gradient-to-br ${
              isHallOfFame
                ? 'from-yellow-500/10 via-amber-600/10 to-yellow-500/10 border-yellow-500/30'
                : 'from-gray-800/50 to-gray-900/50 border-white/10'
            }
            border-2 rounded-tech-lg
            p-6 sm:p-8 mb-8
            backdrop-blur-xl
            ${isHallOfFame ? 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' : ''}
          `}
        >
          {/* Background Gradient Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-50" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
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
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                {player.name}
              </h1>
              {player.psnId && player.psnId !== 'player' && (
                <p className="text-xl text-gray-400 mb-4">@{player.psnId}</p>
              )}

              {/* Induction Date */}
              {player.achievements.inductionDate && (
                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center sm:justify-start mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Hall of Fame since{' '}
                    {new Date(player.achievements.inductionDate).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - Admin Only */}
            {isAuthenticated && (
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="
                    p-3 rounded-lg
                    bg-cyber-500/20 border-2 border-cyber-500/30
                    hover:bg-cyber-500/30 hover:border-cyber-500/50
                    text-cyber-400 hover:text-cyber-300
                    transition-all duration-300
                    hover:shadow-glow
                  "
                  title="Edit Player"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="
                    p-3 rounded-lg
                    bg-red-500/20 border-2 border-red-500/30
                    hover:bg-red-500/30 hover:border-red-500/50
                    text-red-400 hover:text-red-300
                    transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Delete Player"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Achievements
          </h2>
          <TrophyDisplay
            leagueWins={player.achievements.leagueWins}
            tournamentWins={player.achievements.tournamentWins}
            totalTitles={player.achievements.totalTitles}
            layout="horizontal"
            size="lg"
            showLabels={true}
            animated={true}
          />
        </motion.div>


        {/* Career Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Career Stats
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Win Rate Card */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 rounded-tech-lg p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4">Competition Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">League Win Rate</span>
                  <span className="text-green-400 font-bold">
                    {player.achievements.leagueWins > 0 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Tournament Win Rate</span>
                  <span className="text-green-400 font-bold">
                    {player.achievements.tournamentWins > 0 ? '100%' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Member Since Card */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-500/30 rounded-tech-lg p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-4">Membership Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Member Since</span>
                  <span className="text-purple-400 font-bold">
                    {new Date(player.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Updated</span>
                  <span className="text-purple-400 font-bold">
                    {new Date(player.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
