"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, TrendingUp, Calendar, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PlayerAvatar from '@/components/players/PlayerAvatar';

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
      <Container maxWidth="2xl" className="py-4 sm:py-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4 sm:mb-8 relative"
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
            className="mb-2 sm:mb-4"
          >
            <Crown className="w-10 h-10 sm:w-20 sm:h-20 text-yellow-400 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black mb-1.5 sm:mb-3 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] tracking-tight"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            HALL OF FAME
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-lg text-light-700 dark:text-gray-300 mb-2 sm:mb-4"
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full backdrop-blur-sm">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xs sm:text-sm">{hallOfFameMembers.length} Members</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Season Filter */}
        {seasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex items-center justify-center gap-3 mb-4 sm:mb-8"
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
            className="mb-4 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-bold text-light-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              {selectedSeasonName ? `${selectedSeasonName} Records` : 'All-Time Records'}
            </h2>

            <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border-2 border-yellow-500/20 rounded-2xl backdrop-blur-xl overflow-hidden">
              <div className="grid grid-cols-4 divide-x divide-yellow-500/15">
                {/* Most Titles */}
                <div
                  onClick={() => handlePlayerClick(allTimeRecords.mostTitles)}
                  className="text-center px-1.5 py-3 sm:px-4 sm:py-4 cursor-pointer hover:bg-yellow-500/10 transition-colors"
                >
                  <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-1 font-semibold">Most Titles</p>
                  <PlayerAvatar src={allTimeRecords.mostTitles.avatar} alt={allTimeRecords.mostTitles.name} size="sm" showBorder borderColor="border-yellow-500/50" className="mx-auto !w-8 !h-8 sm:!w-12 sm:!h-12 mb-1" />
                  <p className="text-[10px] sm:text-xs font-bold text-light-900 dark:text-white truncate">{allTimeRecords.mostTitles.name}</p>
                  <p className="text-base sm:text-xl font-black text-yellow-400">{getPlayerAchievements(allTimeRecords.mostTitles).totalTitles}</p>
                </div>

                {/* Most Leagues */}
                <div
                  onClick={() => handlePlayerClick(allTimeRecords.mostLeagues)}
                  className="text-center px-1.5 py-3 sm:px-4 sm:py-4 cursor-pointer hover:bg-cyber-500/10 transition-colors"
                >
                  <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-1 font-semibold">Most Leagues</p>
                  <PlayerAvatar src={allTimeRecords.mostLeagues.avatar} alt={allTimeRecords.mostLeagues.name} size="sm" showBorder borderColor="border-cyber-500/50" className="mx-auto !w-8 !h-8 sm:!w-12 sm:!h-12 mb-1" />
                  <p className="text-[10px] sm:text-xs font-bold text-light-900 dark:text-white truncate">{allTimeRecords.mostLeagues.name}</p>
                  <p className="text-base sm:text-xl font-black text-cyber-400">{getPlayerAchievements(allTimeRecords.mostLeagues).leagueWins}</p>
                </div>

                {/* Most Tournaments */}
                <div
                  onClick={() => handlePlayerClick(allTimeRecords.mostTournaments)}
                  className="text-center px-1.5 py-3 sm:px-4 sm:py-4 cursor-pointer hover:bg-electric-500/10 transition-colors"
                >
                  <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-1 font-semibold">Most Tourneys</p>
                  <PlayerAvatar src={allTimeRecords.mostTournaments.avatar} alt={allTimeRecords.mostTournaments.name} size="sm" showBorder borderColor="border-electric-500/50" className="mx-auto !w-8 !h-8 sm:!w-12 sm:!h-12 mb-1" />
                  <p className="text-[10px] sm:text-xs font-bold text-light-900 dark:text-white truncate">{allTimeRecords.mostTournaments.name}</p>
                  <p className="text-base sm:text-xl font-black text-electric-400">{getPlayerAchievements(allTimeRecords.mostTournaments).tournamentWins}</p>
                </div>

                {/* Top Player */}
                <div
                  onClick={() => handlePlayerClick(allTimeRecords.currentChampion)}
                  className="text-center px-1.5 py-3 sm:px-4 sm:py-4 cursor-pointer hover:bg-green-500/10 transition-colors"
                >
                  <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-1 font-semibold">Top Player</p>
                  <PlayerAvatar src={allTimeRecords.currentChampion.avatar} alt={allTimeRecords.currentChampion.name} size="sm" showBorder borderColor="border-green-500/50" className="mx-auto !w-8 !h-8 sm:!w-12 sm:!h-12 mb-1" />
                  <p className="text-[10px] sm:text-xs font-bold text-light-900 dark:text-white truncate">{allTimeRecords.currentChampion.name}</p>
                  <p className="text-base sm:text-xl font-black text-green-400">{getPlayerAchievements(allTimeRecords.currentChampion).totalTitles}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Recent Inductees */}
        {!loading && recentInductees.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-4 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-bold text-light-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-electric-400" />
              Recent Inductees
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {recentInductees.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => handlePlayerClick(player)}
                  className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-2 border-electric-500/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 backdrop-blur-xl hover:shadow-light-electric dark:hover:shadow-glow-purple transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <PlayerAvatar src={player.avatar} alt={player.name} size="sm" showBorder borderColor="border-electric-500/50" className="!w-10 !h-10 sm:!w-12 sm:!h-12" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-light-900 dark:text-white text-sm sm:text-base truncate">{player.name}</div>
                      {player.psnId && player.psnId !== 'player' && (
                        <div className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">@{player.psnId}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] sm:text-xs">
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

        {/* Hall of Fame Members */}
        {!loading && hallOfFameMembers.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-4 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-bold text-light-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              {selectedSeasonName ? `${selectedSeasonName} Hall of Fame` : 'Hall of Fame Members'}
            </h2>

            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {[...hallOfFameMembers]
                .sort((a, b) => getPlayerAchievements(b).totalTitles - getPlayerAchievements(a).totalTitles)
                .map((player, index) => {
                  const achievements = getPlayerAchievements(player);
                  const isElite = achievements.totalTitles >= 3;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.03 }}
                      onClick={() => handlePlayerClick(player)}
                      className={`
                        relative flex items-center gap-1.5 sm:gap-2 pl-1 pr-2.5 sm:pr-3 py-1 sm:py-1.5
                        rounded-full cursor-pointer backdrop-blur-sm
                        transition-all duration-200 hover:scale-105
                        ${isElite
                          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                          : 'bg-white/5 border border-white/15 hover:bg-white/10'
                        }
                      `}
                    >
                      {/* Admin remove button */}
                      {isAuthenticated && effectiveSeasonId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromSeason(player);
                          }}
                          className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 flex items-center justify-center bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                          title={`Remove ${player.name}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <PlayerAvatar
                        src={player.avatar}
                        alt={player.name}
                        size="sm"
                        showBorder={isElite}
                        borderColor="border-yellow-500/50"
                        className="!w-6 !h-6 sm:!w-7 sm:!h-7"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-light-900 dark:text-white max-w-[80px] sm:max-w-none truncate">
                        {player.name}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-bold ${isElite ? 'text-yellow-400' : 'text-light-500 dark:text-gray-400'}`}>
                        {achievements.totalTitles}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          </motion.section>
        )}

        {/* Empty State */}
        {!loading && hallOfFameMembers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12 sm:py-20"
          >
            <Crown className="w-14 h-14 sm:w-20 sm:h-20 text-gray-700 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-bold text-light-600 dark:text-gray-400 mb-3">
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
