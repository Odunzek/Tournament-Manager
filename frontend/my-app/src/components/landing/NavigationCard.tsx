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
  cyber: 'from-cyber-500/20 to-cyber-600/20 hover:from-cyber-500/30 hover:to-cyber-600/30 border-cyber-500/30',
  electric: 'from-electric-500/20 to-electric-600/20 hover:from-electric-500/30 hover:to-electric-600/30 border-electric-500/30',
  neon: 'from-pink-500/20 to-purple-600/20 hover:from-pink-500/30 hover:to-purple-600/30 border-pink-500/30',
  tech: 'from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 border-blue-500/30',
  gold: 'from-yellow-500/20 to-amber-600/20 hover:from-yellow-500/30 hover:to-amber-600/30 border-yellow-500/30',
};

const glowClasses = {
  cyber: 'hover:shadow-glow',
  electric: 'hover:shadow-glow-purple',
  neon: 'hover:shadow-glow-pink',
  tech: 'hover:shadow-glow',
  gold: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]',
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
            border-2 ${gradientClasses[gradient].split(' ')[2]}
            rounded-2xl
            p-6 sm:p-8
            transition-all duration-300
            ${glowClasses[gradient]}
          `}
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
              className="mb-6 inline-block"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
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
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {title}
              </h3>

              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
                {description}
              </p>

              {stats && (
                <div className="inline-block bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-gray-200 border border-white/20">
                  {stats}
                </div>
              )}
            </div>

            {/* Arrow Icon */}
            <motion.div
              className="mt-6 flex items-center gap-2 text-white font-semibold"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span>Explore</span>
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}
