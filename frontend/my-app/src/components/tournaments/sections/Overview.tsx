/**
 * Tournament Overview Section
 *
 * Displays tournament statistics, status, and admin actions.
 * Integrates with Firebase for real-time tournament data.
 *
 * @component
 * @features
 * - Tournament stats display (teams, groups, matches, etc.)
 * - Progress indicators
 * - Admin actions (Generate Groups, Generate Knockout)
 * - Tournament status display
 * - Responsive design with cyber theme
 */

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Target,
  BarChart3,
  Trophy,
  TrendingUp,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Tournament, convertTimestamp } from '@/lib/tournamentUtils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusBadge from '../StatusBadge';

interface OverviewProps {
  tournament: Tournament;
  isAuthenticated: boolean;
  isLoading: boolean;
  onGenerateGroups: () => Promise<void>;
  onGenerateKnockout: () => Promise<void>;
  areGroupMatchesComplete: (tournament: Tournament) => boolean;
  onDeleteTournament?: () => Promise<void>;
  onCompleteTournament?: () => Promise<void>;
}

/**
 * Format date for display
 */
const formatDate = (date: any) => {
  if (!date) return 'Not set';
  const jsDate = convertTimestamp(date);
  return jsDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Get tournament type label
 */
const getTournamentTypeLabel = (type: string) => {
  switch (type) {
    case 'league':
      return 'League Format';
    case 'knockout':
      return 'Knockout Format';
    case 'champions_league':
      return 'Champions League Format';
    case 'custom':
      return 'Custom Format';
    default:
      return 'Tournament';
  }
};

export default function Overview({
  tournament,
  isAuthenticated,
  isLoading,
  onGenerateGroups,
  onGenerateKnockout,
  areGroupMatchesComplete,
  onDeleteTournament,
  onCompleteTournament,
}: OverviewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Calculate stats
  const totalGroupMatches = tournament.groups?.reduce((total, group) =>
    total + group.matches.length, 0) || 0;
  const playedGroupMatches = tournament.groups?.reduce((total, group) =>
    total + group.matches.filter(m => m.played).length, 0) || 0;
  const totalKnockoutMatches = tournament.knockoutBracket?.reduce((total, tie) =>
    total + (tie.firstLeg ? 1 : 0) + (tie.secondLeg ? 1 : 0), 0) || 0;
  const playedKnockoutMatches = tournament.knockoutBracket?.reduce((total, tie) =>
    total + (tie.firstLeg?.played ? 1 : 0) + (tie.secondLeg?.played ? 1 : 0), 0) || 0;

  const totalMatches = totalGroupMatches + totalKnockoutMatches;
  const playedMatches = playedGroupMatches + playedKnockoutMatches;
  const progress = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;

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
                <Trophy className="w-6 h-6 text-cyber-400" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{tournament.name}</h1>
              </div>
              <p className="text-gray-400 mb-3">{getTournamentTypeLabel(tournament.type)}</p>
              <StatusBadge status={tournament.status} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-tech bg-cyber-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Teams</p>
              <p className="text-xl font-bold text-white">{tournament.currentTeams}/{tournament.maxTeams}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-tech bg-electric-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-electric-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Groups</p>
              <p className="text-xl font-bold text-white">{tournament.groups?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-tech bg-pink-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Knockout Ties</p>
              <p className="text-xl font-bold text-white">{tournament.knockoutBracket?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-tech bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Matches Played</p>
              <p className="text-xl font-bold text-white">{playedMatches}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyber-400" />
            <span className="text-sm font-semibold text-white">Tournament Progress</span>
          </div>
          <span className="text-sm text-gray-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-dark-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-cyber-500 to-electric-500 h-3 rounded-full"
          />
        </div>
      </Card>

      {/* Tournament Details */}
      <Card variant="glass">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyber-400" />
          Tournament Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Phase:</span>
            <span className="font-semibold text-white capitalize">
              {tournament.status.replace('_', ' ')}
            </span>
          </div>
          {tournament.startDate && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Start Date:</span>
              <span className="font-semibold text-white">
                {formatDate(tournament.startDate)}
              </span>
            </div>
          )}
          {tournament.endDate && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">End Date:</span>
              <span className="font-semibold text-white">
                {formatDate(tournament.endDate)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Admin Actions */}
      {isAuthenticated && (
        <Card variant="gradient">
          <h3 className="text-lg font-bold text-white mb-4">Admin Actions</h3>

          {/* Setup Phase - Generate Groups */}
          {tournament.status === 'setup' && (
            <div className="space-y-4">
              {tournament.currentTeams >= 8 ? (
                <Button
                  variant="primary"
                  onClick={onGenerateGroups}
                  disabled={isLoading}
                  isLoading={isLoading}
                  glow
                  className="w-full"
                >
                  Generate Groups ({tournament.currentTeams} teams)
                </Button>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-4">
                  <p className="text-yellow-400 font-semibold mb-1">Need More Teams</p>
                  <p className="text-yellow-300/70 text-sm">
                    Add at least {Math.max(0, 8 - tournament.currentTeams)} more teams to generate groups
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Group Stage - Generate Knockout */}
          {tournament.status === 'group_stage' && (
            <div className="space-y-4">
              {areGroupMatchesComplete(tournament) ? (
                <Button
                  variant="secondary"
                  onClick={onGenerateKnockout}
                  disabled={isLoading}
                  isLoading={isLoading}
                  glow
                  className="w-full"
                >
                  Generate Knockout Stage
                </Button>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-tech p-4">
                  <p className="text-blue-400 font-semibold mb-1">Complete Group Matches</p>
                  <p className="text-blue-300/70 text-sm">
                    Finish all group stage matches ({playedGroupMatches}/{totalGroupMatches}) to progress to knockout
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Knockout Phase */}
          {tournament.status === 'knockout' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-tech p-4">
              <p className="text-green-400 font-semibold mb-1">Knockout Stage Active</p>
              <p className="text-green-300/70 text-sm">
                {playedKnockoutMatches}/{totalKnockoutMatches} knockout matches completed
              </p>
            </div>
          )}

          {/* Completed */}
          {tournament.status === 'completed' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-tech p-4">
              <p className="text-purple-400 font-semibold mb-1">Tournament Completed!</p>
              <p className="text-purple-300/70 text-sm">
                All matches have been played
              </p>
            </div>
          )}

          {/* Complete Tournament */}
          {tournament.status !== 'completed' && onCompleteTournament && (
            <div className="mt-6">
              <Button
                variant="outline"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={onCompleteTournament}
                disabled={isLoading}
                className="w-full text-green-400 hover:bg-green-500/10 border-2 border-green-500/30"
              >
                Mark Tournament as Completed
              </Button>
            </div>
          )}

          {/* Delete Tournament */}
          {onDeleteTournament && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h4>
              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-red-400 hover:bg-red-500/10 border border-red-500/20"
                >
                  Delete Tournament
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-tech p-4">
                    <p className="text-red-400 font-semibold mb-1">Are you sure?</p>
                    <p className="text-red-300/70 text-sm">
                      This will permanently delete the tournament and all its data. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onDeleteTournament}
                      disabled={isLoading}
                      isLoading={isLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
