"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, TrendingUp, Calendar, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerAvatar from '@/components/players/PlayerAvatar';
import PlayerCard from '@/components/players/PlayerCard';
import { Player } from '@/types/player';
import { useHallOfFame, useSeasonRecords } from '@/hooks/usePlayers';
import { useSeasons } from '@/hooks/useSeasons';
import { useAuth } from '@/lib/AuthContext';
import { convertTimestamp } from '@/lib/tournamentUtils';
import { removePlayerSeasonAchievements } from '@/lib/playerUtils';
import CustomDropdown from '@/components/ui/CustomDropdown';

export default function HallOfFamePage() {
  const router = useRouter();
  const { seasons } = useSeasons();
  const { isAuthenticated } = useAuth();
  const [seasonFilter, setSeasonFilter] = useState<string>('all_time');

  const handleRemoveFromSeason = async (player: Player) => {
    if (!effectiveSeasonId) return;
    const seasonName = seasons.find((s) => s.id === effectiveSeasonId)?.name ?? 'this season';
    if (!confirm(`Remove ${player.name} from ${seasonName} Hall of Fame?`)) return;
    try {
      await removePlayerSeasonAchievements(player.id!, effectiveSeasonId);
    } catch {
      alert('Failed to remove player. Check console.');
    }
  };

  const effectiveSeasonId = seasonFilter === 'all_time' ? null : seasonFilter;

  const { players: hallOfFameMembers, loading: hofLoading } = useHallOfFame(effectiveSeasonId);
  const { records: allTimeRecords, loading: recordsLoading } = useSeasonRecords(effectiveSeasonId);

  const getPlayerAchievements = (player: Player) => {
    if (effectiveSeasonId) {
      return player.seasonAchievements?.[effectiveSeasonId] ?? {
        leagueWins: 0,
        tournamentWins: 0,
        totalTitles: 0,
        tier: null,
      };
    }
    return player.achievements;
  };

  const getInductionDate = (player: Player) => {
    if (effectiveSeasonId) {
      return player.seasonAchievements?.[effectiveSeasonId]?.inductionDate;
    }
    return player.achievements.inductionDate;
  };

  const recentInductees = [...hallOfFameMembers]
    .filter((p) => getInductionDate(p))
    .sort((a, b) => {
      const dateA = convertTimestamp(getInductionDate(a)!).getTime();
      const dateB = convertTimestamp(getInductionDate(b)!).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  const handlePlayerClick = (player: Player) => {
    router.push(`/players/${player.id}`);
  };

  const loading = hofLoading || recordsLoading;

  const selectedSeasonName = effectiveSeasonId
    ? seasons.find((s) => s.id === effectiveSeasonId)?.name ?? 'Season'
    : null;

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 relative"
        >
          {/* Animated Background Glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 blur-3xl -z-10"
          />

          {/* Crown Icon */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4"
          >
            <Crown className="w-14 h-14 sm:w-20 sm:h-20 text-yellow-400 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] tracking-tight"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            HALL OF FAME
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-light-700 dark:text-gray-300 mb-4"
          >
            Honoring the legends who have achieved greatness
          </motion.p>

          {/* Stats pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full backdrop-blur-sm">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">{hallOfFameMembers.length} Members</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Season Filter */}
        {seasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span className="text-light-600 dark:text-gray-400 font-semibold text-sm">View:</span>
            <CustomDropdown
              value={seasonFilter}
              onChange={(val) => setSeasonFilter(val as string)}
              options={[
                { value: 'all_time', label: 'All Time' },
                ...seasons.map((s) => ({ value: s.id!, label: s.name })),
              ]}
              className="w-48"
            />
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin" />
            <p className="text-light-600 dark:text-gray-400">Loading Hall of Fame...</p>
          </motion.div>
        )}

        {/* Records Section */}
        {!loading && hallOfFameMembers.length > 0 && allTimeRecords.mostTitles && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              {selectedSeasonName ? `${selectedSeasonName} Records` : 'All-Time Records'}
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Most Titles */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.mostTitles)}
                className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/30 rounded-2xl p-4 backdrop-blur-xl hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-light-600 dark:text-gray-400 font-semibold">Most Titles</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={allTimeRecords.mostTitles.avatar} alt={allTimeRecords.mostTitles.name} size="sm" showBorder borderColor="border-yellow-500/50" />
                  <div>
                    <div className="font-bold text-light-900 dark:text-white text-sm">{allTimeRecords.mostTitles.name}</div>
                    <div className="text-xl font-black text-yellow-400">{getPlayerAchievements(allTimeRecords.mostTitles).totalTitles}</div>
                  </div>
                </div>
              </motion.div>

              {/* Most Leagues */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.mostLeagues)}
                className="bg-gradient-to-br from-cyber-500/20 to-cyber-600/20 border-2 border-cyber-500/30 rounded-2xl p-4 backdrop-blur-xl hover:shadow-light-cyber dark:hover:shadow-glow transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-cyber-400" />
                  <span className="text-xs text-light-600 dark:text-gray-400 font-semibold">Most Leagues</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={allTimeRecords.mostLeagues.avatar} alt={allTimeRecords.mostLeagues.name} size="sm" showBorder borderColor="border-cyber-500/50" />
                  <div>
                    <div className="font-bold text-light-900 dark:text-white text-sm">{allTimeRecords.mostLeagues.name}</div>
                    <div className="text-xl font-black text-cyber-400">{getPlayerAchievements(allTimeRecords.mostLeagues).leagueWins}</div>
                  </div>
                </div>
              </motion.div>

              {/* Most Tournaments */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.mostTournaments)}
                className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-2 border-electric-500/30 rounded-2xl p-4 backdrop-blur-xl hover:shadow-light-electric dark:hover:shadow-glow-purple transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-electric-400" />
                  <span className="text-xs text-light-600 dark:text-gray-400 font-semibold">Most Tournaments</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={allTimeRecords.mostTournaments.avatar} alt={allTimeRecords.mostTournaments.name} size="sm" showBorder borderColor="border-electric-500/50" />
                  <div>
                    <div className="font-bold text-light-900 dark:text-white text-sm">{allTimeRecords.mostTournaments.name}</div>
                    <div className="text-xl font-black text-electric-400">{getPlayerAchievements(allTimeRecords.mostTournaments).tournamentWins}</div>
                  </div>
                </div>
              </motion.div>

              {/* Top Player */}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handlePlayerClick(allTimeRecords.currentChampion)}
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 rounded-2xl p-4 backdrop-blur-xl hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-light-600 dark:text-gray-400 font-semibold">Top Player</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={allTimeRecords.currentChampion.avatar} alt={allTimeRecords.currentChampion.name} size="sm" showBorder borderColor="border-green-500/50" />
                  <div>
                    <div className="font-bold text-light-900 dark:text-white text-sm">{allTimeRecords.currentChampion.name}</div>
                    <div className="text-xl font-black text-green-400">{getPlayerAchievements(allTimeRecords.currentChampion).totalTitles}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Recent Inductees */}
        {!loading && recentInductees.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-electric-400" />
              Recent Inductees
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentInductees.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => handlePlayerClick(player)}
                  className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-2 border-electric-500/30 rounded-2xl p-4 backdrop-blur-xl hover:shadow-light-electric dark:hover:shadow-glow-purple transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <PlayerAvatar src={player.avatar} alt={player.name} size="md" showBorder borderColor="border-electric-500/50" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-light-900 dark:text-white text-base truncate">{player.name}</div>
                      {player.psnId && player.psnId !== 'player' && (
                        <div className="text-xs text-light-600 dark:text-gray-400">@{player.psnId}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-light-600 dark:text-gray-400">
                      {convertTimestamp(getInductionDate(player)!).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-electric-400 font-bold">
                      {getPlayerAchievements(player).totalTitles} Titles
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
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              {selectedSeasonName ? `${selectedSeasonName} Hall of Fame` : 'Hall of Fame Members'}
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {[...hallOfFameMembers]
                .sort((a, b) => getPlayerAchievements(b).totalTitles - getPlayerAchievements(a).totalTitles)
                .map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="relative"
                  >
                    {/* Admin remove button (season view only) */}
                    {isAuthenticated && effectiveSeasonId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromSeason(player);
                        }}
                        className="absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors shadow-lg"
                        title={`Remove ${player.name} from this season`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <PlayerCard
                      player={
                        effectiveSeasonId
                          ? {
                              ...player,
                              achievements: {
                                ...player.achievements,
                                leagueWins: getPlayerAchievements(player).leagueWins,
                                tournamentWins: getPlayerAchievements(player).tournamentWins,
                                totalTitles: getPlayerAchievements(player).totalTitles,
                                tier: getPlayerAchievements(player).tier,
                              },
                            }
                          : player
                      }
                      onClick={() => handlePlayerClick(player)}
                      size="sm"
                      showTier={false}
                      variant={getPlayerAchievements(player).totalTitles >= 10 ? 'premium' : 'default'}
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
            <Crown className="w-20 h-20 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-light-600 dark:text-gray-400 mb-3">
              {selectedSeasonName ? `No ${selectedSeasonName} Champions Yet` : 'Hall of Fame Awaits'}
            </h3>
            <p className="text-light-500 dark:text-gray-500 max-w-md mx-auto">
              {selectedSeasonName
                ? `No players have earned titles in ${selectedSeasonName} yet.`
                : 'The Hall of Fame honours players who achieve 1 or more total titles.'}
            </p>
          </motion.div>
        )}
      </Container>
    </MainLayout>
  );
}
