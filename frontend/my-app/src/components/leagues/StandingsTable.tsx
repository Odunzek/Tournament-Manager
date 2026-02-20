"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronUp, ChevronDown, Crown, Medal } from 'lucide-react';
import { LeaguePlayer } from '@/types/league';
import { useRouter } from 'next/navigation';

interface StandingsTableProps {
  players: LeaguePlayer[];
  leagueId: string;
  currentUserId?: string;
}

type SortField = 'position' | 'name' | 'points' | 'goalsFor' | 'goalDifference';
type SortDirection = 'asc' | 'desc';

export default function StandingsTable({ players, leagueId, currentUserId }: StandingsTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'position' ? 'asc' : 'desc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center gap-1">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-yellow-400">1</span>
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-light-500 dark:text-gray-300" />
          <span className="font-bold text-light-700 dark:text-gray-300">2</span>
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-orange-400">3</span>
        </div>
      );
    }
    return <span className="font-bold text-light-600 dark:text-gray-400">{position}</span>;
  };

  const getFormIndicator = (form: ('W' | 'D' | 'L')[]) => {
    if (!form || form.length === 0) {
      return <span className="text-xs text-gray-500">—</span>;
    }
    return (
      <div className="flex gap-0.5">
        {form.slice(0, 5).map((result, index) => {
          const colors = {
            W: 'bg-green-500',
            D: 'bg-yellow-500',
            L: 'bg-red-500',
          };
          return (
            <div
              key={index}
              className={`w-1.5 h-5 ${colors[result]} rounded-sm`}
              title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
            />
          );
        })}
      </div>
    );
  };

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-cyber-400 transition-colors ${className ?? ''}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-cyber-400">
            {sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10">
              <SortHeader field="position" label="Pos" />
              <SortHeader field="name" label="Player" />
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">P</th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">W</th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">D</th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">L</th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">GF</th>
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">GA</th>
              <SortHeader field="goalDifference" label="GD" />
              <SortHeader field="points" label="Pts" />
              <th className="px-2 py-3 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">Form</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => {
              const isCurrentUser = player.id === currentUserId;
              const isTopThree = player.position <= 3;

              return (
                <motion.tr
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => router.push(`/leagues/${leagueId}/players/${player.id}`)}
                  className={`
                    border-b border-light-300/50 dark:border-white/5
                    cursor-pointer
                    transition-all duration-200
                    hover:bg-cyber-500/10 hover:shadow-light-cyber dark:hover:shadow-glow
                    ${isCurrentUser ? 'bg-electric-500/10' : ''}
                    ${isTopThree ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''}
                  `}
                >
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {getPositionBadge(player.position)}
                  </td>

                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 group">
                      <span className="font-bold text-cyber-400 group-hover:text-cyber-300 transition-colors text-sm">
                        {player.name}
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-cyber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>

                  <td className="px-2 py-2.5 whitespace-nowrap text-xs text-light-900 dark:text-white">{player.played || 0}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-xs text-green-400">{player.won || 0}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-xs text-yellow-400">{player.draw || 0}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-xs text-red-400">{player.lost || 0}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-xs text-light-900 dark:text-white hidden sm:table-cell">{player.goalsFor || 0}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-xs text-light-900 dark:text-white hidden sm:table-cell">{player.goalsAgainst || 0}</td>
                  <td
                    className={`px-2 py-2.5 whitespace-nowrap text-xs font-semibold ${
                      (player.goalDifference || 0) > 0
                        ? 'text-green-400'
                        : (player.goalDifference || 0) < 0
                        ? 'text-red-400'
                        : 'text-light-600 dark:text-gray-400'
                    }`}
                  >
                    {(player.goalDifference || 0) > 0 ? '+' : ''}
                    {player.goalDifference || 0}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-sm font-bold text-cyber-400">{player.points || 0}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{getFormIndicator(player.form)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
