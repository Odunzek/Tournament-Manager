"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StandingsTableProps } from '@/types/tournament';

export default function StandingsTable({
  standings,
  groupName,
  highlightPositions = [1, 2],
  expandable = false
}: StandingsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (teamId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedRows(newExpanded);
  };

  const isHighlighted = (position: number) => highlightPositions.includes(position);

  return (
    <div className="overflow-hidden">
      {groupName && (
        <h3 className="text-xl font-bold text-light-900 dark:text-white mb-4 bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent">
          {groupName}
        </h3>
      )}

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-light-300 dark:border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                Pos
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                Team
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                P
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                W
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                D
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                L
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                GF
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                GA
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                GD
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyber-700 dark:text-cyber-300 bg-gradient-to-r from-cyber-500/15 to-electric-500/15 dark:from-cyber-500/10 dark:to-electric-500/10">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <motion.tr
                key={team.teamId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  border-b border-light-300/50 dark:border-white/5
                  hover:bg-black/5 dark:hover:bg-white/5 transition-colors
                  ${isHighlighted(team.position) ? 'bg-cyber-500/10' : ''}
                `}
              >
                <td className="px-4 py-3 text-sm">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                    ${isHighlighted(team.position)
                      ? 'bg-gradient-to-r from-cyber-500 to-electric-600 text-white'
                      : 'text-light-600 dark:text-gray-400'
                    }
                  `}>
                    {team.position}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-light-900 dark:text-white">
                  {team.teamName}
                </td>
                <td className="px-4 py-3 text-sm text-center text-light-700 dark:text-gray-300">{team.played}</td>
                <td className="px-4 py-3 text-sm text-center text-light-700 dark:text-gray-300">{team.won}</td>
                <td className="px-4 py-3 text-sm text-center text-light-700 dark:text-gray-300">{team.drawn}</td>
                <td className="px-4 py-3 text-sm text-center text-light-700 dark:text-gray-300">{team.lost}</td>
                <td className="px-4 py-3 text-sm text-center text-light-700 dark:text-gray-300">{team.goalsFor}</td>
                <td className="px-4 py-3 text-sm text-center text-light-700 dark:text-gray-300">{team.goalsAgainst}</td>
                <td className={`px-4 py-3 text-sm text-center font-semibold ${
                  team.goalDifference > 0 ? 'text-green-400' :
                  team.goalDifference < 0 ? 'text-red-400' :
                  'text-light-700 dark:text-gray-300'
                }`}>
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
                <td className="px-4 py-3 text-sm text-center font-bold text-cyber-400">
                  {team.points}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-2">
        {standings.map((team, index) => (
          <motion.div
            key={team.teamId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              rounded-lg border
              ${isHighlighted(team.position)
                ? 'bg-cyber-500/10 border-cyber-500/30'
                : 'bg-light-100 dark:bg-dark-100/50 border-light-300 dark:border-white/10'
              }
            `}
          >
            {/* Main Info */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => expandable && toggleRow(team.teamId)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${isHighlighted(team.position)
                    ? 'bg-gradient-to-r from-cyber-500 to-electric-600 text-white'
                    : 'bg-white/10 text-gray-400'
                  }
                `}>
                  {team.position}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{team.teamName}</p>
                  <p className="text-xs text-gray-400">
                    P: {team.played} • Pts: {team.points}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-cyber-400">{team.points}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>

                {expandable && (
                  <div className="text-gray-400">
                    {expandedRows.has(team.teamId) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedRows.has(team.teamId) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-light-300 dark:border-white/10 overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-3 p-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">W-D-L</p>
                      <p className="text-sm font-semibold text-white">
                        {team.won}-{team.drawn}-{team.lost}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Goals</p>
                      <p className="text-sm font-semibold text-white">
                        {team.goalsFor}-{team.goalsAgainst}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">GD</p>
                      <p className={`text-sm font-semibold ${
                        team.goalDifference > 0 ? 'text-green-400' :
                        team.goalDifference < 0 ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
