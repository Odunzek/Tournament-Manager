"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'solid';
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-dark-100/50 backdrop-blur-md border border-white/10',
  gradient: 'bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-md border border-white/10',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/20',
  solid: 'bg-dark-100 border border-dark-200',
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
        ${glow ? 'shadow-glow' : 'shadow-xl'}
        ${hover ? 'cursor-pointer' : ''}
        rounded-2xl p-6
        transition-all duration-200
        h-full
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
