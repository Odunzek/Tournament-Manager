"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  glow?: boolean;
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  success: 'bg-green-500/20 text-green-300 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  danger: 'bg-red-500/20 text-red-300 border-red-500/30',
  info: 'bg-cyber-500/20 text-cyber-300 border-cyber-500/30',
};

const glowClasses = {
  default: 'shadow-glow',
  success: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
  warning: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
  danger: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  info: 'shadow-glow',
};

export default function Badge({
  children,
  variant = 'default',
  glow = false,
  className = ''
}: BadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        ${variantClasses[variant]}
        ${glow ? glowClasses[variant] : ''}
        inline-flex items-center gap-1
        px-2.5 py-1 text-xs font-semibold
        rounded-full border backdrop-blur-sm
        ${className}
      `}
    >
      {children}
    </motion.span>
  );
}
