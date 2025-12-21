"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { HallOfFameTier as TierType, getTierInfo } from '@/types/player';
import { Player } from '@/types/player';
import PlayerCard from './PlayerCard';

interface HallOfFameTierProps {
  tier: TierType;
  players: Player[];
  onPlayerClick?: (player: Player) => void;
}

export default function HallOfFameTier({
  tier,
  players,
  onPlayerClick,
}: HallOfFameTierProps) {
  if (!tier || players.length === 0) return null;

  const tierInfo = getTierInfo(tier);

  // Determine card size and grid based on tier
  const gridConfig = {
    legend: 'grid-cols-1 md:grid-cols-2 gap-6',
    champion: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5',
    veteran: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  };

  const cardSize = {
    legend: 'lg' as const,
    champion: 'md' as const,
    veteran: 'sm' as const,
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Section Header */}
      <div className="mb-6">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-3 mb-2"
        >
          <span className="text-4xl">{tierInfo.icon}</span>
          <h2
            className={`
              text-3xl sm:text-4xl font-black
              bg-gradient-to-r ${tierInfo.gradient}
              bg-clip-text text-transparent
            `}
          >
            {tierInfo.label.toUpperCase()}
          </h2>
        </motion.div>
        <p className="text-gray-400 text-sm sm:text-base ml-1">
          {tierInfo.minTitles}+ Total Titles • {players.length} {players.length === 1 ? 'Legend' : 'Legends'}
        </p>
      </div>

      {/* Player Grid */}
      <div className={`grid ${gridConfig[tier]}`}>
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <PlayerCard
              player={player}
              onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
              size={cardSize[tier]}
              showTier={false}
              variant={tier === 'legend' ? 'premium' : 'default'}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
