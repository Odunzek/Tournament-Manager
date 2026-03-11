/**
 * Badge — Small status pill/tag component with color variants.
 *
 * Used throughout the app to display status labels, counts, and tags.
 * Animates in with a subtle scale-up effect via Framer Motion.
 *
 * Variants:
 *   - 'default': Gray (neutral status)
 *   - 'success': Green (active, won, completed)
 *   - 'warning': Yellow (upcoming, pending)
 *   - 'danger': Red (errors, eliminations, losses)
 *   - 'info': Cyber blue (informational, feature highlights)
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger" glow>Eliminated</Badge>
 */
"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  glow?: boolean;      // Adds a colored shadow glow matching the variant
  className?: string;
}

/** Background, text, and border colors for each variant (light + dark modes) */
const variantClasses = {
  default: 'bg-gray-500/20 text-light-800 dark:text-gray-300 border-2 border-gray-600/40 dark:border-gray-500/30',
  success: 'bg-green-500/20 text-green-700 dark:text-green-300 border-2 border-green-600/40 dark:border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-600/40 dark:border-yellow-500/30',
  danger: 'bg-red-500/20 text-red-700 dark:text-red-300 border-2 border-red-600/40 dark:border-red-500/30',
  info: 'bg-cyber-500/20 text-cyber-700 dark:text-cyber-300 border-2 border-cyber-600/40 dark:border-cyber-500/30',
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
        rounded-full backdrop-blur-sm
        ${className}
      `}
    >
      {children}
    </motion.span>
  );
}
