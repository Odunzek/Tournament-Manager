"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Star, Award, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerAvatar from '@/components/players/PlayerAvatar';
import PlayerCard from '@/components/players/PlayerCard';
import { Player } from '@/types/player';
import { useHallOfFame, useAllTimeRecords } from '@/hooks/usePlayers';
import { convertTimestamp } from '@/lib/tournamentUtils';

export default function HallOfFamePage() {
  const router = useRouter();
  const { players: hallOfFameMembers, loading: hofLoading } = useHallOfFame();
  const { records: allTimeRecords, loading: recordsLoading } = useAllTimeRecords();

  // Get recent inductees (last 3 by induction date)
  const recentInductees = [...hallOfFameMembers]
    .filter((p) => p.achievements.inductionDate)
    .sort((a, b) => {
      const dateA = convertTimestamp(a.achievements.inductionDate!).getTime();
      const dateB = convertTimestamp(b.achievements.inductionDate!).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  const handlePlayerClick = (player: Player) => {
    router.push(`/players/${player.id}`);
  };

  const loading = hofLoading || recordsLoading;

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 relative"
        >
          {/* Animated Background Glow */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 blur-3xl -z-10"
          />

          {/* Crown Icon */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <Crown className="w-20 h-20 text-yellow-400 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="
              text-5xl sm:text-6xl md:text-7xl
              font-black mb-4
              bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400
              bg-clip-text text-transparent
              drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]
              tracking-tight
            "
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            HALL OF FAME
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300 mb-6"
          >
            Honoring the legends who have achieved greatness
          </motion.p>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{hallOfFameMembers.length} Members</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading Hall of Fame...</p>
          </motion.div>
        )}

        {/* All-Time Records Section */}
        {!loading && hallOfFameMembers.length > 0 && allTimeRecords.mostTitles && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              All-Time Records
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Most Titles */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.mostTitles)}
                className="
                  bg-gradient-to-br from-yellow-500/20 to-amber-600/20
                  border-2 border-yellow-500/30
                  rounded-2xl p-5
                  backdrop-blur-xl
                  hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]
                  transition-all duration-300
                  cursor-pointer
                "
              >
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <span className="text-sm text-gray-400 font-semibold">Most Titles</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    src={allTimeRecords.mostTitles.avatar}
                    alt={allTimeRecords.mostTitles.name}
                    size="sm"
                    showBorder={true}
                    borderColor="border-yellow-500/50"
                  />
                  <div>
                    <div className="font-bold text-white">{allTimeRecords.mostTitles.name}</div>
                    <div className="text-2xl font-black text-yellow-400">
                      {allTimeRecords.mostTitles.achievements.totalTitles}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Most Leagues */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.mostLeagues)}
                className="
                  bg-gradient-to-br from-cyber-500/20 to-cyber-600/20
                  border-2 border-cyber-500/30
                  rounded-2xl p-5
                  backdrop-blur-xl
                  hover:shadow-glow
                  transition-all duration-300
                  cursor-pointer
                "
              >
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-cyber-400" />
                  <span className="text-sm text-gray-400 font-semibold">Most Leagues</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    src={allTimeRecords.mostLeagues.avatar}
                    alt={allTimeRecords.mostLeagues.name}
                    size="sm"
                    showBorder={true}
                    borderColor="border-cyber-500/50"
                  />
                  <div>
                    <div className="font-bold text-white">{allTimeRecords.mostLeagues.name}</div>
                    <div className="text-2xl font-black text-cyber-400">
                      {allTimeRecords.mostLeagues.achievements.leagueWins}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Most Tournaments */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.mostTournaments)}
                className="
                  bg-gradient-to-br from-electric-500/20 to-electric-600/20
                  border-2 border-electric-500/30
                  rounded-2xl p-5
                  backdrop-blur-xl
                  hover:shadow-glow-purple
                  transition-all duration-300
                  cursor-pointer
                "
              >
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-electric-400" />
                  <span className="text-sm text-gray-400 font-semibold">Most Tournaments</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    src={allTimeRecords.mostTournaments.avatar}
                    alt={allTimeRecords.mostTournaments.name}
                    size="sm"
                    showBorder={true}
                    borderColor="border-electric-500/50"
                  />
                  <div>
                    <div className="font-bold text-white">{allTimeRecords.mostTournaments.name}</div>
                    <div className="text-2xl font-black text-electric-400">
                      {allTimeRecords.mostTournaments.achievements.tournamentWins}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Current Champion */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.currentChampion)}
                className="
                  bg-gradient-to-br from-green-500/20 to-emerald-600/20
                  border-2 border-green-500/30
                  rounded-2xl p-5
                  backdrop-blur-xl
                  hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]
                  transition-all duration-300
                  cursor-pointer
                "
              >
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-sm text-gray-400 font-semibold">Top Player</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    src={allTimeRecords.currentChampion.avatar}
                    alt={allTimeRecords.currentChampion.name}
                    size="sm"
                    showBorder={true}
                    borderColor="border-green-500/50"
                  />
                  <div>
                    <div className="font-bold text-white">{allTimeRecords.currentChampion.name}</div>
                    <div className="text-2xl font-black text-green-400">
                      {allTimeRecords.currentChampion.achievements.totalTitles}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Recent Inductees */}
        {recentInductees.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-electric-400" />
              Recent Inductees
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentInductees.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => handlePlayerClick(player)}
                  className="
                    bg-gradient-to-br from-electric-500/20 to-electric-600/20
                    border-2 border-electric-500/30
                    rounded-2xl p-5
                    backdrop-blur-xl
                    hover:shadow-glow-purple
                    transition-all duration-300
                    cursor-pointer
                  "
                >
                  <div className="flex items-center gap-4 mb-3">
                    <PlayerAvatar
                      src={player.avatar}
                      alt={player.name}
                      size="md"
                      showBorder={true}
                      borderColor="border-electric-500/50"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-white text-lg">{player.name}</div>
                      {player.psnId && player.psnId !== 'player' && (
                        <div className="text-sm text-gray-400">@{player.psnId}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      {convertTimestamp(player.achievements.inductionDate!).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-electric-400 font-bold">
                      {player.achievements.totalTitles} Titles
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Hall of Fame Members Grid */}
        {!loading && hallOfFameMembers.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Hall of Fame Members
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hallOfFameMembers
                .sort((a, b) => b.achievements.totalTitles - a.achievements.totalTitles)
                .map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                  >
                    <PlayerCard
                      player={player}
                      onClick={() => handlePlayerClick(player)}
                      size="md"
                      showTier={false}
                      variant={player.achievements.totalTitles >= 10 ? 'premium' : 'default'}
                    />
                  </motion.div>
                ))}
            </div>
          </motion.section>
        )}

        {/* Empty State */}
        {!loading && hallOfFameMembers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <Crown className="w-24 h-24 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-400 mb-3">Hall of Fame Awaits</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              The Hall of Fame will honor players who achieve 1 or more total titles. Compete in
              leagues and tournaments to earn your place among the legends!
            </p>
          </motion.div>
        )}
      </Container>
    </MainLayout>
  );
}
