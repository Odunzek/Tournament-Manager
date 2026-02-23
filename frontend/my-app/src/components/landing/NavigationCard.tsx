"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: string;
  route: string;
  stats?: string;
  gradient?: 'cyber' | 'electric' | 'neon' | 'tech' | 'gold';
  delay?: number;
}

const gradientClasses = {
  cyber: 'from-cyber-100 to-cyber-200 hover:from-cyber-200 hover:to-cyber-300 border-cyber-300 dark:from-cyber-500/20 dark:to-cyber-600/20 dark:hover:from-cyber-500/30 dark:hover:to-cyber-600/30 dark:border-cyber-500/30',
  electric: 'from-electric-100 to-electric-200 hover:from-electric-200 hover:to-electric-300 border-electric-300 dark:from-electric-500/20 dark:to-electric-600/20 dark:hover:from-electric-500/30 dark:hover:to-electric-600/30 dark:border-electric-500/30',
  neon: 'from-pink-100 to-purple-200 hover:from-pink-200 hover:to-purple-300 border-pink-300 dark:from-pink-500/20 dark:to-purple-600/20 dark:hover:from-pink-500/30 dark:hover:to-purple-600/30 dark:border-pink-500/30',
  tech: 'from-blue-100 to-purple-200 hover:from-blue-200 hover:to-purple-300 border-blue-300 dark:from-blue-500/20 dark:to-purple-600/20 dark:hover:from-blue-500/30 dark:hover:to-purple-600/30 dark:border-blue-500/30',
  gold: 'from-yellow-100 to-amber-200 hover:from-yellow-200 hover:to-amber-300 border-yellow-300 dark:from-yellow-500/20 dark:to-amber-600/20 dark:hover:from-yellow-500/30 dark:hover:to-amber-600/30 dark:border-yellow-500/30',
};

const glowClasses = {
  cyber: 'shadow-light-cyber/50 hover:shadow-light-cyber-lg dark:shadow-none dark:hover:shadow-glow',
  electric: 'shadow-light-electric/50 hover:shadow-light-electric-lg dark:shadow-none dark:hover:shadow-glow-purple',
  neon: 'shadow-light-pink/50 hover:shadow-[0_8px_24px_rgba(236,72,153,0.3)] dark:shadow-none dark:hover:shadow-glow-pink',
  tech: 'shadow-light-cyber/50 hover:shadow-light-cyber-lg dark:shadow-none dark:hover:shadow-glow',
  gold: 'shadow-[0_4px_14px_rgba(234,179,8,0.2)] hover:shadow-[0_8px_24px_rgba(234,179,8,0.3)] dark:shadow-none dark:hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]',
};

export default function NavigationCard({
  title,
  description,
  icon,
  route,
  stats,
  gradient = 'tech',
  delay = 0
}: NavigationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Link href={route} className="block h-full group">
        <div
          className={`
            h-full relative overflow-hidden
            bg-gradient-to-br ${gradientClasses[gradient]}
            backdrop-blur-xl
            border-2
            rounded-2xl
            p-3 sm:p-5 lg:p-8
            transition-all duration-300
            ${glowClasses[gradient]}
          `}
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />

          <div className="relative z-10 flex flex-col h-full">
            {/* Icon */}
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="mb-2.5 sm:mb-4 lg:mb-6 inline-block"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-white/60 dark:bg-white/10 rounded-2xl p-2 sm:p-3 lg:p-4 backdrop-blur-sm shadow-sm dark:shadow-none">
                <Image
                  src={icon}
                  alt={`${title} icon`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-base sm:text-xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-1.5 sm:mb-3 dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-gray-300 dark:group-hover:bg-clip-text dark:group-hover:text-transparent transition-all duration-300">
                {title}
              </h3>

              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-2 sm:line-clamp-none mb-2 sm:mb-4">
                {description}
              </p>

              {stats && (
                <div className="inline-block bg-white/50 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 border border-white/60 dark:border-white/20 shadow-sm dark:shadow-none">
                  {stats}
                </div>
              )}
            </div>

            {/* Arrow Icon */}
            <motion.div
              className="mt-2 sm:mt-4 lg:mt-6 flex items-center gap-1.5 sm:gap-2 text-gray-800 dark:text-white font-semibold"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="hidden sm:inline">Explore</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
          </div>

          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 dark:from-white/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}
