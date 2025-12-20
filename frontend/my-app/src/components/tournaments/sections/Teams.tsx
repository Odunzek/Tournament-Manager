"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Trophy, Target } from 'lucide-react';
import { TournamentSectionProps, Team } from '@/types/tournament';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Badge from '../../ui/Badge';

// Mock data - replace with Firebase data later
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Manchester City',
    groupId: 'group-a',
    groupName: 'Group A',
  },
  {
    id: '2',
    name: 'Real Madrid',
    groupId: 'group-a',
    groupName: 'Group A',
  },
  {
    id: '3',
    name: 'Bayern Munich',
    groupId: 'group-a',
    groupName: 'Group A',
  },
  {
    id: '4',
    name: 'PSG',
    groupId: 'group-a',
    groupName: 'Group A',
  },
  {
    id: '5',
    name: 'Barcelona',
    groupId: 'group-b',
    groupName: 'Group B',
  },
  {
    id: '6',
    name: 'Liverpool',
    groupId: 'group-b',
    groupName: 'Group B',
  },
  {
    id: '7',
    name: 'Inter Milan',
    groupId: 'group-b',
    groupName: 'Group B',
  },
  {
    id: '8',
    name: 'Atletico Madrid',
    groupId: 'group-b',
    groupName: 'Group B',
  },
];

// Mock stats for teams
const teamStats: Record<string, { position: number; played: number; won: number; drawn: number; lost: number; gd: number; points: number }> = {
  '1': { position: 1, played: 3, won: 3, drawn: 0, lost: 0, gd: 7, points: 9 },
  '2': { position: 2, played: 3, won: 2, drawn: 0, lost: 1, gd: 3, points: 6 },
  '3': { position: 3, played: 3, won: 1, drawn: 0, lost: 2, gd: -2, points: 3 },
  '4': { position: 4, played: 3, won: 0, drawn: 0, lost: 3, gd: -8, points: 0 },
  '5': { position: 1, played: 3, won: 2, drawn: 1, lost: 0, gd: 5, points: 7 },
  '6': { position: 2, played: 3, won: 2, drawn: 0, lost: 1, gd: 2, points: 6 },
  '7': { position: 3, played: 3, won: 1, drawn: 1, lost: 1, gd: 0, points: 4 },
  '8': { position: 4, played: 3, won: 0, drawn: 0, lost: 3, gd: -7, points: 0 },
};

export default function Teams({ tournamentId }: TournamentSectionProps) {
  const [teams] = useState(mockTeams);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const filteredTeams = teams.filter(team => {
    // Filter by group
    if (selectedGroup !== 'all' && team.groupId !== selectedGroup) return false;

    // Filter by search
    if (searchQuery) {
      return team.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const groups = Array.from(new Set(teams.map(t => t.groupId)));

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-4 py-2.5 bg-dark-100/50 backdrop-blur-sm border-2 border-white/10 rounded-tech text-gray-100 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20 transition-all duration-200"
        >
          <option value="all">All Groups</option>
          {groups.map(groupId => (
            <option key={groupId} value={groupId}>
              {teams.find(t => t.groupId === groupId)?.groupName}
            </option>
          ))}
        </select>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team, index) => {
          const stats = teamStats[team.id];

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="glass" hover className="cursor-pointer">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {team.name}
                    </h3>
                    {team.groupName && (
                      <Badge variant="info" className="text-xs">
                        {team.groupName}
                      </Badge>
                    )}
                  </div>

                  {stats && (
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${stats.position <= 2
                        ? 'bg-gradient-to-r from-cyber-500 to-electric-600 text-white'
                        : 'bg-white/10 text-gray-400'
                      }
                    `}>
                      {stats.position}
                    </div>
                  )}
                </div>

                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-dark-200/50 rounded-lg p-2">
                      <p className="text-xs text-gray-400 mb-1">Played</p>
                      <p className="text-lg font-bold text-white">{stats.played}</p>
                    </div>
                    <div className="bg-dark-200/50 rounded-lg p-2">
                      <p className="text-xs text-gray-400 mb-1">Points</p>
                      <p className="text-lg font-bold text-cyber-400">{stats.points}</p>
                    </div>
                    <div className="bg-dark-200/50 rounded-lg p-2">
                      <p className="text-xs text-gray-400 mb-1">GD</p>
                      <p className={`text-lg font-bold ${
                        stats.gd > 0 ? 'text-green-400' :
                        stats.gd < 0 ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {stats.gd > 0 ? '+' : ''}{stats.gd}
                      </p>
                    </div>
                  </div>
                )}

                {/* Record */}
                {stats && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-around text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-green-400" />
                        <span className="text-white font-semibold">{stats.won}</span>
                        <span className="text-gray-500">W</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-semibold">{stats.drawn}</span>
                        <span className="text-gray-500">D</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold">{stats.lost}</span>
                        <span className="text-gray-500">L</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No teams found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your search or filter
          </p>
        </motion.div>
      )}
    </div>
  );
}
