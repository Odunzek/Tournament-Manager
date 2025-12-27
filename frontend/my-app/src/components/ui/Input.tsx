"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-light-800 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-600 dark:text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full px-4 py-2.5
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            bg-light-50 dark:bg-dark-100/50 backdrop-blur-sm
            border-2 ${error ? 'border-red-500' : 'border-cyber-500/25 dark:border-white/10'}
            rounded-tech
            text-light-900 dark:text-gray-100 placeholder-light-500 dark:placeholder-gray-500
            focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20
            transition-all duration-200
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-600 dark:text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
