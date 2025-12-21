"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { HallOfFameTier, getTierInfo } from '@/types/player';

interface AchievementBadgeProps {
  tier: HallOfFameTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'text-sm',
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'text-base',
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'text-lg',
  },
};

export default function AchievementBadge({
  tier,
  size = 'md',
  showIcon = true,
  animate = true,
  className = '',
}: AchievementBadgeProps) {
  if (!tier) return null;

  const tierInfo = getTierInfo(tier);
  const sizes = sizeClasses[size];

  const badge = (
    <div
      className={`
        inline-flex items-center gap-1.5
        ${sizes.container}
        rounded-full
        font-bold
        bg-gradient-to-r ${tierInfo.gradient}
        ${tierInfo.color}
        backdrop-blur-sm
        border border-white/20
        shadow-lg
        ${className}
      `}
    >
      {showIcon && <span className={sizes.icon}>{tierInfo.icon}</span>}
      <span>{tierInfo.label}</span>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        className="inline-block"
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
