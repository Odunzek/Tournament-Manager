"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import Card from '../ui/Card';

interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: 'cyber' | 'electric' | 'neon' | 'green';
}

interface StatsSectionProps {
  stats: StatItem[];
  title?: string;
}

const colorClasses = {
  cyber: 'from-cyber-400 to-cyber-600',
  electric: 'from-electric-400 to-electric-600',
  neon: 'from-pink-500 to-purple-600',
  green: 'from-green-400 to-emerald-600',
};

export default function StatsSection({ stats, title = "Quick Stats" }: StatsSectionProps) {
  return (
    <div className="mb-12">
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center"
        >
          {title}
        </motion.h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card variant="glass" className="text-center">
              {/* Icon */}
              {stat.icon && (
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500/20 to-electric-500/20 flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
              )}

              {/* Value */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${
                  colorClasses[stat.color || 'cyber']
                } bg-clip-text text-transparent mb-2`}
              >
                {stat.value}
              </motion.div>

              {/* Label */}
              <div className="text-sm text-gray-400 font-medium mb-2">
                {stat.label}
              </div>

              {/* Trend */}
              {stat.trend && (
                <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.trend}</span>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
