"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types/player';
import PlayerAvatar from './PlayerAvatar';
import AchievementBadge from './AchievementBadge';
import { Trophy } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showTier?: boolean;
  variant?: 'default' | 'premium';
  className?: string;
}

const sizeConfig = {
  sm: {
    card: 'p-2 sm:p-4',
    avatar: 'md' as const,
    title: 'text-xs sm:text-base font-bold truncate',
    subtitle: 'text-sm',
    badge: 'sm' as const,
  },
  md: {
    card: 'p-5',
    avatar: 'lg' as const,
    title: 'text-xl',
    subtitle: 'text-base',
    badge: 'md' as const,
  },
  lg: {
    card: 'p-6 sm:p-8',
    avatar: 'xl' as const,
    title: 'text-2xl sm:text-3xl',
    subtitle: 'text-lg',
    badge: 'lg' as const,
  },
};

export default function PlayerCard({
  player,
  onClick,
  size = 'md',
  showTier = true,
  variant = 'default',
  className = '',
}: PlayerCardProps) {
  const config = sizeConfig[size];
  const isHallOfFame = player.achievements.totalTitles >= 3;
  const isPremium = variant === 'premium';

  const cardBg = isPremium
    ? 'bg-gradient-to-br from-yellow-500/10 via-amber-600/10 to-yellow-500/10 border-yellow-500/30'
    : 'bg-gradient-to-br from-cyber-50 to-electric-50 dark:from-gray-800/50 dark:to-gray-900/50 border-cyber-600/40 dark:border-white/10';

  const cardGlow = isPremium
    ? 'hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]'
    : 'shadow-light-cyber hover:shadow-light-cyber-lg dark:hover:shadow-glow';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        ${config.card}
        ${cardBg}
        ${cardGlow}
        border-2
        rounded-3xl
        backdrop-blur-xl
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <PlayerAvatar
          src={player.avatar}
          alt={player.name}
          size={config.avatar}
          showBorder={true}
          borderColor={isPremium ? 'border-yellow-500/50' : 'border-cyber-600/60 dark:border-cyber-500/50'}
          className={`mb-4 ${size === 'sm' ? '!w-8 !h-8 sm:!w-12 sm:!h-12 !mb-2 sm:!mb-4' : ''}`}
        />

        {/* Player Name */}
        <h3 className={`${config.title} ${size !== 'sm' ? 'font-bold' : ''} text-light-900 dark:text-white mb-1`}>
          {player.name}
        </h3>

        {/* PSN ID - Only show if provided (hidden on mobile for sm size) */}
        {player.psnId && player.psnId !== 'player' && (
          <p className={`${config.subtitle} text-light-600 dark:text-gray-400 mb-3 ${size === 'sm' ? 'hidden sm:block' : ''}`}>
            @{player.psnId}
          </p>
        )}

        {/* Total Titles Badge (hidden on mobile for sm size) */}
        <div
          className={`
            inline-flex items-center gap-2
            px-3 py-1.5
            rounded-full
            ${isHallOfFame
              ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border-yellow-500/30'
              : 'bg-white/10 border-white/20'
            }
            border
            backdrop-blur-sm
            ${!player.psnId || player.psnId === 'player' ? 'mt-2' : ''}
            ${size === 'sm' ? 'hidden sm:inline-flex' : ''}
          `}
        >
          <Trophy
            className={`w-4 h-4 ${isHallOfFame ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}
          />
          <span className={`text-sm font-semibold ${isHallOfFame ? 'text-yellow-400' : 'text-light-700 dark:text-gray-300'}`}>
            {player.achievements.totalTitles}
          </span>
        </div>

        {/* Achievement Stats (for larger cards) */}
        {size === 'lg' && (
          <div className="mt-4 pt-4 border-t border-light-300 dark:border-white/10 w-full">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-cyber-400 font-bold">{player.achievements.leagueWins}</div>
                <div className="text-light-600 dark:text-gray-500 text-xs">Leagues</div>
              </div>
              <div className="text-center">
                <div className="text-electric-400 font-bold">{player.achievements.tournamentWins}</div>
                <div className="text-light-600 dark:text-gray-500 text-xs">Tournaments</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
