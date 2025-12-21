"use client";

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayerAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const iconSizes = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export default function PlayerAvatar({
  src,
  alt,
  size = 'md',
  className = '',
  showBorder = true,
  borderColor = 'border-cyber-500/50',
}: PlayerAvatarProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`
        ${sizeClasses[size]}
        ${showBorder ? `border-2 ${borderColor}` : ''}
        rounded-full
        overflow-hidden
        bg-gradient-to-br from-gray-800 to-gray-900
        flex items-center justify-center
        ${className}
      `}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={iconSizes[size] * 2}
          height={iconSizes[size] * 2}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="text-gray-400" size={iconSizes[size]} />
      )}
    </motion.div>
  );
}
