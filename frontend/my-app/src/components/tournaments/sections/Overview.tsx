"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Target,
  BarChart3,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { TournamentSectionProps } from '@/types/tournament';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusBadge from '../StatusBadge';

// Mock data - replace with Firebase data later
const mockTournament = {
  id: '1',
  name: 'Champions League 2024',
  type: 'groups_knockout' as const,
  status: 'active' as const,
  startDate: new Date('2024-09-01'),
  endDate: new Date('2024-12-15'),
  numberOfTeams: 32,
  numberOfGroups: 8,
  currentRound: 'Group Stage - Matchday 3',
  createdAt: new Date('2024-08-15'),
  updatedAt: new Date('2024-10-15'),
};

const mockStats = {
  totalTeams: 32,
  totalMatches: 96,
  matchesPlayed: 24,
  matchesRemaining: 72,
  totalGoals: 68,
  averageGoalsPerMatch: 2.8,
};

export default function Overview({ tournamentId }: TournamentSectionProps) {
  const [tournament] = useState(mockTournament);
  const [stats] = useState(mockStats);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTournamentTypeLabel = () => {
    switch (tournament.type) {
      case 'league':
        return 'League Format';
      case 'knockout':
        return 'Knockout Format';
      case 'groups_knockout':
        return 'Groups + Knockout Format';
      default:
        return 'Tournament';
    }
  };

  const progress = (stats.matchesPlayed / stats.totalMatches) * 100;

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="gradient" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
                <StatusBadge status={tournament.status} />
              </div>
              <p className="text-gray-400 mb-4">{getTournamentTypeLabel()}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-cyber-400" />
                  <span>
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-electric-400" />
                  <span>{tournament.numberOfTeams} Teams</span>
                </div>
              </div>

              {tournament.status === 'active' && tournament.currentRound && (
                <div className="mt-4 p-3 bg-cyber-500/20 border border-cyber-500/30 rounded-lg">
                  <p className="text-sm text-cyber-300 font-semibold">
                    🔴 Current: {tournament.currentRound}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-row sm:flex-col gap-2">
              <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
              {tournament.status === 'active' && (
                <Button variant="danger" size="sm" leftIcon={<Flag className="w-4 h-4" />}>
                  End
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Matches',
            value: stats.totalMatches,
            icon: <Target className="w-6 h-6 text-cyber-400" />,
            color: 'cyber',
          },
          {
            label: 'Matches Played',
            value: stats.matchesPlayed,
            icon: <BarChart3 className="w-6 h-6 text-green-400" />,
            color: 'green',
          },
          {
            label: 'Remaining',
            value: stats.matchesRemaining,
            icon: <Calendar className="w-6 h-6 text-electric-400" />,
            color: 'electric',
          },
          {
            label: 'Total Goals',
            value: stats.totalGoals,
            icon: <Flag className="w-6 h-6 text-pink-400" />,
            color: 'pink',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="glass">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-500/20 to-electric-500/20 flex items-center justify-center">
                  {stat.icon}
                </div>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent">
                {stat.value}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Tournament Progress</h3>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-dark-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-cyber-500 to-electric-600 rounded-full shadow-glow"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Matches Completed</p>
              <p className="text-white font-semibold">
                {stats.matchesPlayed} / {stats.totalMatches}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Avg Goals/Match</p>
              <p className="text-white font-semibold">{stats.averageGoalsPerMatch}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card variant="glass">
          <h3 className="text-lg font-bold text-white mb-4">Recent Highlights</h3>
          <div className="space-y-3">
            {[
              {
                text: 'Group A: Team X defeated Team Y 3-1',
                time: '2 hours ago',
              },
              {
                text: 'Matchday 3 completed across all groups',
                time: '1 day ago',
              },
              {
                text: 'Top scorer: Player Z with 8 goals',
                time: '2 days ago',
              },
            ].map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-dark-200/50 rounded-lg border border-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-cyber-400 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white text-sm">{highlight.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{highlight.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
