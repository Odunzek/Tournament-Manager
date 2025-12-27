"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-cyber-600 to-electric-600 dark:from-cyber-500 dark:to-electric-600 text-white hover:from-cyber-700 hover:to-electric-700 dark:hover:from-cyber-600 dark:hover:to-electric-700 shadow-light-cyber-lg dark:shadow-glow',
  secondary: 'bg-gradient-to-r from-electric-600 to-pink-600 dark:from-electric-500 dark:to-pink-600 text-white hover:from-electric-700 hover:to-pink-700 dark:hover:from-electric-600 dark:hover:to-pink-700 shadow-light-electric-lg dark:shadow-glow-purple',
  outline: 'bg-transparent border-2 border-cyber-600 dark:border-cyber-500 text-cyber-700 dark:text-cyber-500 hover:bg-cyber-50 dark:hover:bg-cyber-500/10 hover:border-cyber-700 dark:hover:border-cyber-400',
  ghost: 'bg-cyber-50/50 dark:bg-white/5 text-light-900 dark:text-gray-200 hover:bg-cyber-100 dark:hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-cyber-500/30',
  danger: 'bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-600 text-white hover:from-red-700 hover:to-pink-700 dark:hover:from-red-600 dark:hover:to-pink-700 shadow-light-electric-lg',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  glow = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${glow ? 'shadow-lg shadow-cyber-500/30 dark:shadow-glow dark:animate-glow' : ''}
        inline-flex items-center justify-center gap-2
        font-semibold rounded-tech
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:ring-offset-2 focus:ring-offset-light-100 dark:focus:ring-offset-dark-100
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </motion.button>
  );
}
