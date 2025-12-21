"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface TrophyDisplayProps {
  leagueWins: number;
  tournamentWins: number;
  totalTitles: number;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

const sizeClasses = {
  sm: {
    trophy: 'w-4 h-4',
    text: 'text-sm',
    container: 'gap-2',
  },
  md: {
    trophy: 'w-5 h-5',
    text: 'text-base',
    container: 'gap-3',
  },
  lg: {
    trophy: 'w-6 h-6',
    text: 'text-lg',
    container: 'gap-4',
  },
};

export default function TrophyDisplay({
  leagueWins,
  tournamentWins,
  totalTitles,
  layout = 'horizontal',
  size = 'md',
  showLabels = true,
  animated = true,
}: TrophyDisplayProps) {
  const sizes = sizeClasses[size];

  const trophyItems = [
    {
      label: 'League Wins',
      value: leagueWins,
      color: 'text-cyber-400',
      bgGradient: 'from-cyber-500/20 to-cyber-600/20',
      borderColor: 'border-cyber-500/30',
    },
    {
      label: 'Tournament Wins',
      value: tournamentWins,
      color: 'text-electric-400',
      bgGradient: 'from-electric-500/20 to-electric-600/20',
      borderColor: 'border-electric-500/30',
    },
    {
      label: 'Total Titles',
      value: totalTitles,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/20 to-amber-600/20',
      borderColor: 'border-yellow-500/30',
    },
  ];

  const containerClass = layout === 'horizontal'
    ? `flex flex-wrap ${sizes.container}`
    : `flex flex-col ${sizes.container}`;

  return (
    <div className={containerClass}>
      {trophyItems.map((item, index) => {
        const card = (
          <div
            key={item.label}
            className={`
              flex items-center gap-2 sm:gap-3
              px-3 sm:px-4 py-2 sm:py-3
              rounded-lg
              bg-gradient-to-br ${item.bgGradient}
              border ${item.borderColor}
              backdrop-blur-sm
            `}
          >
            <Trophy className={`${sizes.trophy} ${item.color}`} />
            <div className="flex flex-col">
              <span className={`${sizes.text} font-bold text-white`}>
                {item.value}
              </span>
              {showLabels && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </div>
          </div>
        );

        if (animated) {
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: layout === 'horizontal' ? -20 : 0, y: layout === 'vertical' ? 20 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              {card}
            </motion.div>
          );
        }

        return card;
      })}
    </div>
  );
}
