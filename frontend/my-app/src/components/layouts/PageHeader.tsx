"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  gradient?: 'cyber' | 'electric' | 'neon' | 'tech';
}

const gradientClasses = {
  cyber: 'from-cyber-400 via-cyber-600 to-electric-500',
  electric: 'from-electric-400 via-electric-600 to-pink-500',
  neon: 'from-neon-blue via-neon-purple to-neon-pink',
  tech: 'from-blue-500 via-purple-500 to-pink-500',
};

export default function PageHeader({
  title,
  subtitle,
  className = '',
  gradient = 'tech'
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`text-center py-8 sm:py-12 ${className}`}
    >
      <div className="relative inline-block">
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold
                     bg-gradient-to-r ${gradientClasses[gradient]}
                     bg-clip-text text-transparent mb-4`}
        >
          {title}
        </h1>
        <motion.div
          className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-neon-yellow to-neon-pink rounded-full shadow-glow-pink" />
        </motion.div>
      </div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-base sm:text-lg text-gray-300 font-medium mt-2"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-24 sm:w-32 h-1 bg-gradient-to-r from-cyber-400 via-electric-500 to-pink-500 mx-auto rounded-full mt-4"
      />
    </motion.div>
  );
}
