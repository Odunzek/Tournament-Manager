"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
}

export default function MainLayout({
  children,
  className = '',
  showBackground = true
}: MainLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200">
      {/* Animated Background */}
      {showBackground && (
        <>
          {/* Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-500/20 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric-500/20 rounded-full blur-3xl"
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(14, 165, 233) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(14, 165, 233) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </>
      )}

      {/* Content */}
      <div className={`relative z-10 ${className}`}>
        {children}
      </div>
    </div>
  );
}
