"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, TrendingUp, Target, Calendar, Edit, CheckCircle, UserPlus, Trash2 } from 'lucide-react';
import { League, LeaguePlayer, LeagueMatch } from '@/types/league';
import { convertTimestamp } from '@/lib/leagueUtils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import MatchResultCard from '../MatchResultCard';
import DeleteLeagueModal from '../DeleteLeagueModal';

interface OverviewProps {
  league: League;
  leagueLeader: LeaguePlayer | null;
  recentMatches: LeagueMatch[];
  totalGoals: number;
  playerCount: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  onAddPlayers?: () => void;
  onEndLeague?: () => void;
  onMatchUpdated?: () => void;
}

export default function Overview({
  league,
  leagueLeader,
  recentMatches,
  totalGoals,
  playerCount,
  isAuthenticated,
  isLoading,
  onAddPlayers,
  onEndLeague,
  onMatchUpdated,
}: OverviewProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const startDate = convertTimestamp(league.startDate);
  const endDate = league.endDate ? convertTimestamp(league.endDate) : null;

  const totalMatches = league.totalMatches || 0;
  const matchesPlayed = league.matchesPlayed || 0;
  const matchProgress = totalMatches > 0 ? (matchesPlayed / totalMatches) * 100 : 0;

  const getStatusBadge = () => {
    const badges = {
      active: {
        label: 'Active',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: TrendingUp,
      },
      upcoming: {
        label: 'Upcoming',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Calendar,
      },
      completed: {
        label: 'Completed',
        className: 'bg-gray-500/20 text-light-600 dark:text-gray-400 border-gray-500/30',
        icon: CheckCircle,
      },
    };

    const badge = badges[league.status];
    const Icon = badge.icon;

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${badge.className}`}>
        <Icon className="w-4 h-4" />
        <span className="font-bold">{badge.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* League Header */}
      <Card variant="glass">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-light-900 dark:text-white mb-2">{league.name}</h2>
            <p className="text-lg text-light-600 dark:text-gray-400 mb-4">{league.season}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>
                  {startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {endDate &&
                    ` - ${endDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`}
                </span>
              </div>
            </div>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        {/* Progress Bar */}
        {league.status === 'active' && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-light-600 dark:text-gray-400 mb-2">
              <span>League Progress</span>
              <span>
                {matchesPlayed} / {totalMatches} matches ({Math.round(matchProgress)}%)
              </span>
            </div>
            <div className="w-full bg-dark-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-3 bg-gradient-to-r from-cyber-400 to-electric-500"
              />
            </div>
          </div>
        )}
      </Card>

      {/* League Leader */}
      {leagueLeader && league.status === 'active' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            variant="glass"
            className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/30"
          >
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-1">Current League Leader</p>
                <h3 className="text-2xl font-bold text-yellow-400">{leagueLeader.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                  <span>{leagueLeader.points || 0} points</span>
                  <span>•</span>
                  <span>
                    {leagueLeader.won || 0}W {leagueLeader.draw || 0}D {leagueLeader.lost || 0}L
                  </span>
                  <span>•</span>
                  <span>GD: {(leagueLeader.goalDifference || 0) > 0 ? '+' : ''}{leagueLeader.goalDifference || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass" className="bg-gradient-to-br from-cyber-500/20 to-cyber-600/20 border-cyber-500/30 !p-3 sm:!p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-cyber-400" />
              <div>
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">Players</p>
                <p className="text-xl sm:text-2xl font-bold text-light-900 dark:text-white">{playerCount}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            variant="glass"
            className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-electric-500/30 !p-3 sm:!p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-electric-400" />
              <div>
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">Played</p>
                <p className="text-xl sm:text-2xl font-bold text-light-900 dark:text-white">{matchesPlayed}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card
            variant="glass"
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 !p-3 sm:!p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              <div>
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">Remaining</p>
                <p className="text-xl sm:text-2xl font-bold text-light-900 dark:text-white">{Math.max(0, (league.totalMatches || 0) - (league.matchesPlayed || 0))}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card
            variant="glass"
            className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border-pink-500/30 !p-3 sm:!p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              <div>
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">Total Goals</p>
                <p className="text-xl sm:text-2xl font-bold text-light-900 dark:text-white">{totalGoals || 0}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyber-400" />
            Recent Results
          </h3>
          <div className="space-y-3">
            {recentMatches.slice(0, 5).map((match, index) => (
              <MatchResultCard key={match.id} match={match} index={index} onMatchUpdated={onMatchUpdated} />
            ))}
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {isAuthenticated && (
        <Card variant="glass">
          <h3 className="text-lg font-bold text-light-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="flex-1"
              onClick={onAddPlayers}
            >
              Add Players
            </Button>
            <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />} className="flex-1">
              Edit League
            </Button>
            {league.status === 'active' && (
              <Button
                variant="outline"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="flex-1"
                onClick={onEndLeague}
              >
                End League
              </Button>
            )}
          </div>

          {/* Delete League Section */}
          <div className="mt-4 pt-4 border-t border-light-300 dark:border-white/10">
            <p className="text-xs text-light-600 dark:text-gray-400 mb-2">Danger Zone</p>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteModal(true)}
              className="w-full"
            >
              Delete League
            </Button>
          </div>
        </Card>
      )}

      {/* Delete League Modal */}
      <DeleteLeagueModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        league={league}
      />
    </div>
  );
}
