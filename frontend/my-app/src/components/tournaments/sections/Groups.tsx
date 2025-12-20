"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TournamentSectionProps, GroupStanding } from '@/types/tournament';
import StandingsTable from '../StandingsTable';

// Mock data - replace with Firebase data later
const mockGroups = [
  {
    id: 'group-a',
    name: 'Group A',
    standings: [
      {
        teamId: '1',
        teamName: 'Manchester City',
        played: 3,
        won: 3,
        drawn: 0,
        lost: 0,
        goalsFor: 9,
        goalsAgainst: 2,
        goalDifference: 7,
        points: 9,
        position: 1,
        form: ['W', 'W', 'W'],
      },
      {
        teamId: '2',
        teamName: 'Real Madrid',
        played: 3,
        won: 2,
        drawn: 0,
        lost: 1,
        goalsFor: 7,
        goalsAgainst: 4,
        goalDifference: 3,
        points: 6,
        position: 2,
        form: ['W', 'L', 'W'],
      },
      {
        teamId: '3',
        teamName: 'Bayern Munich',
        played: 3,
        won: 1,
        drawn: 0,
        lost: 2,
        goalsFor: 4,
        goalsAgainst: 6,
        goalDifference: -2,
        points: 3,
        position: 3,
        form: ['L', 'W', 'L'],
      },
      {
        teamId: '4',
        teamName: 'PSG',
        played: 3,
        won: 0,
        drawn: 0,
        lost: 3,
        goalsFor: 2,
        goalsAgainst: 10,
        goalDifference: -8,
        points: 0,
        position: 4,
        form: ['L', 'L', 'L'],
      },
    ] as GroupStanding[],
  },
  {
    id: 'group-b',
    name: 'Group B',
    standings: [
      {
        teamId: '5',
        teamName: 'Barcelona',
        played: 3,
        won: 2,
        drawn: 1,
        lost: 0,
        goalsFor: 8,
        goalsAgainst: 3,
        goalDifference: 5,
        points: 7,
        position: 1,
      },
      {
        teamId: '6',
        teamName: 'Liverpool',
        played: 3,
        won: 2,
        drawn: 0,
        lost: 1,
        goalsFor: 6,
        goalsAgainst: 4,
        goalDifference: 2,
        points: 6,
        position: 2,
      },
      {
        teamId: '7',
        teamName: 'Inter Milan',
        played: 3,
        won: 1,
        drawn: 1,
        lost: 1,
        goalsFor: 5,
        goalsAgainst: 5,
        goalDifference: 0,
        points: 4,
        position: 3,
      },
      {
        teamId: '8',
        teamName: 'Atletico Madrid',
        played: 3,
        won: 0,
        drawn: 0,
        lost: 3,
        goalsFor: 2,
        goalsAgainst: 9,
        goalDifference: -7,
        points: 0,
        position: 4,
      },
    ] as GroupStanding[],
  },
];

export default function Groups({ tournamentId }: TournamentSectionProps) {
  const [groups] = useState(mockGroups);
  const [activeGroup, setActiveGroup] = useState(mockGroups[0].id);

  return (
    <div className="space-y-6">
      {/* Group Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {groups.map((group, index) => {
          const isActive = activeGroup === group.id;

          return (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveGroup(group.id)}
              className={`
                px-6 py-3 rounded-tech font-semibold whitespace-nowrap
                transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-2 border-cyber-500/50 text-white shadow-glow'
                  : 'bg-dark-100/50 border-2 border-white/10 text-gray-400 hover:bg-white/5'
                }
              `}
            >
              {group.name}
            </motion.button>
          );
        })}
      </div>

      {/* Active Group Standings */}
      {groups.map((group) => {
        if (group.id !== activeGroup) return null;

        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-tech-lg p-4 sm:p-6"
          >
            <StandingsTable
              standings={group.standings}
              groupName={group.name}
              highlightPositions={[1, 2]}
              expandable
            />

            {/* Qualification Info */}
            <div className="mt-6 p-4 bg-cyber-500/10 border border-cyber-500/30 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyber-500 to-electric-600" />
                  <span className="text-sm text-gray-300">Top 2 qualify for knockout stage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-electric-500/30" />
                  <span className="text-sm text-gray-300">Best 3rd place teams may qualify</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* All Groups Summary (Mobile Accordion) */}
      <div className="md:hidden space-y-4">
        <h3 className="text-lg font-bold text-white">All Groups</h3>
        {groups.map((group, index) => (
          <motion.details
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-tech-lg overflow-hidden"
          >
            <summary className="px-4 py-3 font-semibold text-white cursor-pointer list-none flex items-center justify-between">
              <span>{group.name}</span>
              <span className="text-gray-400">▼</span>
            </summary>
            <div className="px-4 pb-4">
              <StandingsTable
                standings={group.standings}
                highlightPositions={[1, 2]}
                expandable
              />
            </div>
          </motion.details>
        ))}
      </div>
    </div>
  );
}
