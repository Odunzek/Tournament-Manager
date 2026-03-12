/**
 * Card — Reusable container component with the app's cyber/glass theme.
 *
 * The primary building block for content sections throughout the app.
 * Supports four visual variants for different contexts:
 *   - 'default': Semi-transparent with blur backdrop (most common)
 *   - 'gradient': Cyber-to-electric gradient background
 *   - 'glass': Frosted glass effect with higher transparency
 *   - 'solid': Opaque background (for nested cards or high-contrast sections)
 *
 * If an `onClick` handler is provided, renders as a <button> for accessibility.
 * Supports optional hover lift animation and glow shadow effect.
 *
 * @example
 * <Card variant="glass" hover>
 *   <h3>League Stats</h3>
 *   <p>Content here</p>
 * </Card>
 */
"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'solid';
  hover?: boolean;     // Enables lift-on-hover animation
  glow?: boolean;      // Adds a neon glow shadow effect
  onClick?: () => void; // If provided, card renders as a clickable button
}

/** Tailwind classes for each visual variant (light mode | dark mode) */
const variantClasses = {
  default: 'bg-cyber-50/80 dark:bg-dark-100/50 backdrop-blur-md border-2 border-cyber-500/20 dark:border-white/10',
  gradient: 'bg-gradient-to-br from-cyber-50 to-electric-50 dark:from-dark-100/80 dark:to-dark-200/80 backdrop-blur-md border-2 border-cyber-500/25 dark:border-white/10',
  glass: 'bg-white/90 dark:bg-white/5 backdrop-blur-xl border-2 border-cyber-500/30 dark:border-white/20',
  solid: 'bg-light-100 dark:bg-dark-100 border-2 border-cyber-500/25 dark:border-dark-200',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  onClick
}: CardProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        ${variantClasses[variant]}
        ${glow ? 'shadow-light-cyber-lg dark:shadow-glow' : 'shadow-card-light dark:shadow-xl'}
        ${hover ? 'cursor-pointer' : ''}
        rounded-2xl p-3 sm:p-6
        transition-all duration-200
        w-full h-full
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
