/**
 * Tournament Groups Section
 *
 * Displays group stage standings tables.
 * Clean, focused view of team rankings and statistics.
 *
 * @component
 * @features
 * - Real-time group standings display
 * - Team statistics (played, won, drawn, lost, GD, points)
 * - Progress indicators
 * - Responsive design with cyber theme
 * - Top 2 teams highlighted (qualify for knockout)
 */

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Settings, Info } from 'lucide-react';
import { Tournament, TournamentGroup, adjustTeamPoints } from '@/lib/tournamentUtils';
import { useAuth } from '@/lib/AuthContext';
import Card from '../../ui/Card';
import PointAdjustmentModal from '../PointAdjustmentModal';
import PointAdjustmentHistoryModal from '../PointAdjustmentHistoryModal';

interface GroupsProps {
  tournament: Tournament;
}

export default function Groups({ tournament }: GroupsProps) {

  // Check if groups exist
  if (!tournament.groups || tournament.groups.length === 0) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-light-900 dark:text-white mb-2">No Groups Generated</h3>
        <p className="text-light-600 dark:text-gray-400">
          Groups will appear here once generated from the Overview tab.
        </p>
      </div>
    );
  }

  const totalMatches = tournament.groups.reduce((t, g) => t + g.matches.length, 0);
  const playedMatches = tournament.groups.reduce(
    (t, g) => t + g.matches.filter((m) => m.played).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-1">Group Stage Standings</h2>
          <p className="text-light-600 dark:text-gray-400">{tournament.groups.length} Groups</p>
        </div>
        <div className="bg-light-200/50 dark:bg-dark-100/50 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-tech px-4 py-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyber-400" />
            <span className="text-sm text-light-600 dark:text-gray-400">
              {playedMatches} / {totalMatches} matches played
            </span>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournament.groups.map((group, index) => (
          <GroupCard
            key={group.id}
            group={group}
            index={index}
            tournamentId={tournament.id!}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Group Card Component
 */
interface GroupCardProps {
  group: TournamentGroup;
  index: number;
  tournamentId: string;
}

function GroupCard({ group, index, tournamentId }: GroupCardProps) {
  const { isAuthenticated } = useAuth();
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<{ name: string; points: number } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTeamName, setHistoryTeamName] = useState('');
  const [historyAdjustments, setHistoryAdjustments] = useState<any[]>([]);

  const handleOpenAdjustModal = (teamName: string, currentPoints: number) => {
    setSelectedTeam({ name: teamName, points: currentPoints });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustPoints = async (adjustment: number, reason: string) => {
    if (!selectedTeam) return;

    await adjustTeamPoints(
      tournamentId,
      group.id!,
      selectedTeam.name,
      adjustment,
      reason
    );

    setIsAdjustModalOpen(false);
    setSelectedTeam(null);
  };

  const handleOpenHistoryModal = (teamName: string, adjustments: any[]) => {
    setHistoryTeamName(teamName);
    setHistoryAdjustments(adjustments || []);
    setIsHistoryModalOpen(true);
  };
  const playedMatches = group.matches.filter((m) => m.played).length;
  const totalMatches = group.matches.length;
  const completion = totalMatches ? (playedMatches / totalMatches) * 100 : 0;

  // Sort standings
  const sorted = [...group.standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Gradient colors for different groups
  const groupGradients = [
    'from-cyber-500/20 to-electric-500/20',
    'from-electric-500/20 to-pink-500/20',
    'from-pink-500/20 to-purple-500/20',
    'from-purple-500/20 to-cyber-500/20',
  ];
  const gradient = groupGradients[index % groupGradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${gradient} border-white/10`}>
        {/* Group Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-light-900 dark:text-white">{group.name}</h3>
          <div className="text-right">
            <div className="text-sm text-light-600 dark:text-gray-400 font-medium mb-1">
              {playedMatches}/{totalMatches} matches
            </div>
            <div className="w-24 bg-light-300 dark:bg-dark-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                className="bg-gradient-to-r from-cyber-400 to-electric-400 h-2 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Standings Table */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-light-700 dark:text-gray-300 mb-3">Standings</h4>
          <div className="space-y-2">
            {sorted.map((standing, i) => {
              const hasAdjustments = standing.pointAdjustments && standing.pointAdjustments.length > 0;
              const totalAdjustment = hasAdjustments
                ? standing.pointAdjustments!.reduce((sum, adj) => sum + adj.amount, 0)
                : 0;

              return (
                <div
                  key={standing.teamName}
                  className="flex items-center justify-between bg-light-200/50 dark:bg-dark-100/50 backdrop-blur-sm rounded-tech p-3 border border-black/5 dark:border-white/5 gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i < 2
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-light-900 dark:text-white'
                          : 'bg-light-300 dark:bg-dark-200 text-light-600 dark:text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="font-semibold text-light-900 dark:text-white truncate text-sm sm:text-base">{standing.teamName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-3 text-xs flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-cyber-400">{standing.points}<span className="hidden xs:inline">pts</span></span>

                      {/* Adjustment Badge - Visible to all users */}
                      {hasAdjustments && (
                        <button
                          onClick={() => handleOpenHistoryModal(standing.teamName, standing.pointAdjustments!)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all hover:scale-110 active:scale-95 ${
                            totalAdjustment > 0
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          }`}
                          title="View adjustment history"
                        >
                          {totalAdjustment > 0 ? '+' : ''}{totalAdjustment}
                        </button>
                      )}
                    </div>

                    <span className="text-light-600 dark:text-gray-400 hidden sm:inline">{standing.played}P</span>
                    <span className="text-green-400">{standing.won}W</span>
                    <span className="text-yellow-400 hidden xs:inline">{standing.drawn}D</span>
                    <span className="text-red-400">{standing.lost}L</span>
                    <span className="text-light-700 dark:text-gray-300 hidden sm:inline">
                      {standing.goalDifference > 0 ? '+' : ''}
                      {standing.goalDifference}
                    </span>

                    {/* Admin: Adjust Points Button */}
                    {isAuthenticated && (
                      <button
                        onClick={() => handleOpenAdjustModal(standing.teamName, standing.points)}
                        className="ml-2 p-1.5 rounded-lg bg-cyber-500/10 hover:bg-cyber-500/20 border border-cyber-500/30 hover:border-cyber-500/50 transition-all group"
                        title="Adjust points"
                      >
                        <Settings className="w-3.5 h-3.5 text-cyber-400 group-hover:text-cyber-300 group-hover:rotate-90 transition-all" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Point Adjustment Modal */}
      {selectedTeam && (
        <PointAdjustmentModal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setSelectedTeam(null);
          }}
          onSubmit={handleAdjustPoints}
          teamName={selectedTeam.name}
          currentPoints={selectedTeam.points}
        />
      )}

      {/* Point Adjustment History Modal */}
      <PointAdjustmentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryTeamName('');
          setHistoryAdjustments([]);
        }}
        teamName={historyTeamName}
        adjustments={historyAdjustments}
      />
    </motion.div>
  );
}
