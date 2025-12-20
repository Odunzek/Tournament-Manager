"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { TournamentSectionProps, Match, KnockoutRound } from '@/types/tournament';
import MatchCard from '../MatchCard';

// Mock knockout matches
const mockKnockoutMatches: Match[] = [
  // Round of 16
  {
    id: 'ko-1',
    tournamentId: '1',
    homeTeamId: '1',
    homeTeamName: 'Manchester City',
    awayTeamId: '8',
    awayTeamName: 'Atletico Madrid',
    homeScore: 2,
    awayScore: 1,
    status: 'completed',
    scheduledDate: new Date('2024-11-01T20:00:00'),
    round: 'Round of 16 - 1st Leg',
    knockoutRound: 'round_of_16',
    isFirstLeg: true,
  },
  {
    id: 'ko-2',
    tournamentId: '1',
    homeTeamId: '8',
    awayTeamId: '1',
    homeTeamName: 'Atletico Madrid',
    awayTeamName: 'Manchester City',
    status: 'scheduled',
    scheduledDate: new Date('2024-11-08T20:00:00'),
    round: 'Round of 16 - 2nd Leg',
    knockoutRound: 'round_of_16',
    isSecondLeg: true,
  },
  // Quarter Finals
  {
    id: 'ko-3',
    tournamentId: '1',
    homeTeamId: '5',
    homeTeamName: 'Barcelona',
    awayTeamId: '2',
    awayTeamName: 'Real Madrid',
    status: 'scheduled',
    scheduledDate: new Date('2024-11-20T20:00:00'),
    round: 'Quarter Final - 1st Leg',
    knockoutRound: 'quarter_final',
    isFirstLeg: true,
  },
  // Semi Finals
  {
    id: 'ko-4',
    tournamentId: '1',
    homeTeamId: '1',
    homeTeamName: 'Manchester City',
    awayTeamId: '5',
    awayTeamName: 'Barcelona',
    status: 'scheduled',
    scheduledDate: new Date('2024-12-01T20:00:00'),
    round: 'Semi Final - 1st Leg',
    knockoutRound: 'semi_final',
    isFirstLeg: true,
  },
];

const roundLabels: Record<KnockoutRound, string> = {
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter Finals',
  semi_final: 'Semi Finals',
  final: 'Final',
};

const roundOrder: KnockoutRound[] = ['round_of_16', 'quarter_final', 'semi_final', 'final'];

export default function Knockout({ tournamentId }: TournamentSectionProps) {
  const [matches] = useState(mockKnockoutMatches);
  const [selectedRound, setSelectedRound] = useState<KnockoutRound>('round_of_16');

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (match.knockoutRound) {
      if (!acc[match.knockoutRound]) {
        acc[match.knockoutRound] = [];
      }
      acc[match.knockoutRound].push(match);
    }
    return acc;
  }, {} as Record<KnockoutRound, Match[]>);

  const availableRounds = roundOrder.filter(round => matchesByRound[round]?.length > 0);

  return (
    <div className="space-y-6">
      {/* Round Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {availableRounds.map((round, index) => {
          const isActive = selectedRound === round;

          return (
            <motion.button
              key={round}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedRound(round)}
              className={`
                px-6 py-3 rounded-tech font-semibold whitespace-nowrap
                transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-2 border-cyber-500/50 text-white shadow-glow'
                  : 'bg-dark-100/50 border-2 border-white/10 text-gray-400 hover:bg-white/5'
                }
              `}
            >
              {roundLabels[round]}
            </motion.button>
          );
        })}
      </div>

      {/* Bracket View */}
      {selectedRound === 'final' && matchesByRound['final'] ? (
        // Special layout for final
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                FINAL
              </h2>
            </div>
            {matchesByRound['final'].map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showDate
              />
            ))}
          </motion.div>
        </div>
      ) : (
        // Grid layout for other rounds
        <div>
          {matchesByRound[selectedRound] && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {matchesByRound[selectedRound].map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MatchCard
                    match={match}
                    showDate
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bracket Diagram (Simplified) */}
      <div className="hidden xl:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-tech-lg p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6 text-center">Bracket Overview</h3>

          <div className="flex items-center justify-around gap-4">
            {roundOrder.map((round, roundIndex) => {
              const roundMatches = matchesByRound[round] || [];
              if (roundMatches.length === 0) return null;

              return (
                <div key={round} className="flex flex-col gap-2">
                  <p className="text-xs text-center text-gray-400 mb-2">
                    {roundLabels[round]}
                  </p>

                  {roundMatches
                    .filter(m => m.isFirstLeg || !m.isSecondLeg)
                    .map((match) => (
                      <div
                        key={match.id}
                        className="bg-dark-200/50 rounded-lg p-2 text-xs border border-white/10 min-w-[120px]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white truncate">{match.homeTeamName}</span>
                            {match.status === 'completed' && (
                              <span className="font-bold text-cyber-400">{match.homeScore}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white truncate">{match.awayTeamName}</span>
                            {match.status === 'completed' && (
                              <span className="font-bold text-cyber-400">{match.awayScore}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {roundIndex < roundOrder.length - 1 && (
                    <div className="self-center w-8 h-px bg-white/20" />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-cyber-500/10 border border-cyber-500/30 rounded-lg"
      >
        <p className="text-sm text-cyber-300">
          💡 Knockout matches are played over two legs (home and away). The team with the higher aggregate score advances.
        </p>
      </motion.div>
    </div>
  );
}
