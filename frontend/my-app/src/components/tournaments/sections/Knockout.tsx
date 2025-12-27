/**
 * Tournament Knockout Section
 *
 * Displays knockout bracket with match results and recording.
 * Integrates with Firebase for real-time updates.
 *
 * @component
 * @features
 * - Knockout bracket visualization
 * - Round-by-round display (Round of 16, QF, SF, Final)
 * - Admin-only match recording (first & second leg)
 * - Aggregate score calculation
 * - Real-time updates
 * - Cyber-themed UI with round-specific colors
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, ChevronDown } from 'lucide-react';
import { Tournament, KnockoutTie, updateTournament, getTournamentById } from '@/lib/tournamentUtils';
import Card from '../../ui/Card';
import RecordResultModal from '../RecordResultModal';

interface KnockoutProps {
  tournament: Tournament;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTournament: (tournament: Tournament) => void;
}

export default function Knockout({
  tournament,
  isAuthenticated,
  isLoading,
  setTournament,
}: KnockoutProps) {
  const [recordingMatch, setRecordingMatch] = useState<{
    tieId: string;
    leg: 'first' | 'second';
    homeTeam: string;
    awayTeam: string;
  } | null>(null);

  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet screen size (collapsible on screens smaller than 1024px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize expanded rounds (all expanded on desktop, final only on mobile)
  useEffect(() => {
    if (!tournament.knockoutBracket) return;

    const roundOrder = ['round_16', 'quarter_final', 'semi_final', 'final'];
    const tiesByRound = tournament.knockoutBracket.reduce((acc, tie) => {
      if (!acc[tie.round]) acc[tie.round] = [];
      acc[tie.round].push(tie);
      return acc;
    }, {} as Record<string, KnockoutTie[]>);

    const availableRounds = roundOrder.filter(round => tiesByRound[round]);

    if (!isMobile) {
      setExpandedRounds(new Set(availableRounds));
    } else {
      // On mobile, expand only the final or most recent round
      setExpandedRounds(new Set([availableRounds[availableRounds.length - 1]]));
    }
  }, [isMobile, tournament.knockoutBracket]);

  const toggleRound = (roundKey: string) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundKey)) {
        newSet.delete(roundKey);
      } else {
        newSet.add(roundKey);
      }
      return newSet;
    });
  };

  /**
   * Handle recording knockout match result
   */
  const handleMatchResultSubmit = async (homeScore: number, awayScore: number) => {
    if (!recordingMatch) return;

    try {
      const freshTournament = await getTournamentById(tournament.id!);
      if (!freshTournament?.knockoutBracket) return;

      const updatedBracket = freshTournament.knockoutBracket.map((tie) => {
        if (tie.id !== recordingMatch.tieId) return tie;

        // Update the appropriate leg
        if (recordingMatch.leg === 'first') {
          return {
            ...tie,
            firstLeg: {
              id: tie.firstLeg?.id || `${tie.id}_leg1`,
              leg: 'first' as const,
              homeTeam: recordingMatch.homeTeam,
              awayTeam: recordingMatch.awayTeam,
              homeScore,
              awayScore,
              played: true,
            },
          };
        } else {
          // Calculate aggregate
          const firstLegHomeScore = tie.firstLeg?.homeScore || 0;
          const firstLegAwayScore = tie.firstLeg?.awayScore || 0;
          const aggregateHome = firstLegHomeScore + awayScore; // Note: reversed for second leg
          const aggregateAway = firstLegAwayScore + homeScore;

          return {
            ...tie,
            secondLeg: {
              id: tie.secondLeg?.id || `${tie.id}_leg2`,
              leg: 'second' as const,
              homeTeam: recordingMatch.homeTeam,
              awayTeam: recordingMatch.awayTeam,
              homeScore,
              awayScore,
              played: true,
            },
            winner: aggregateHome > aggregateAway ? tie.team1 : tie.team2,
            completed: true,
          };
        }
      });

      // Update tournament in Firebase
      await updateTournament(tournament.id!, { knockoutBracket: updatedBracket });

      // Refresh tournament data
      const refreshed = await getTournamentById(tournament.id!);
      if (refreshed) setTournament(refreshed);

      // Close modal
      setRecordingMatch(null);
    } catch (error) {
      console.error('Error recording knockout match:', error);
    }
  };

  // Check if knockout bracket exists
  if (!tournament.knockoutBracket || tournament.knockoutBracket.length === 0) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-20 h-20 text-light-600 dark:text-gray-600 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-light-900 dark:text-white mb-2">No Knockout Stage</h3>
        <p className="text-light-600 dark:text-gray-400">
          Knockout bracket will appear here once generated from the Overview tab.
        </p>
      </div>
    );
  }

  // Group ties by round
  const tiesByRound = tournament.knockoutBracket.reduce((acc, tie) => {
    const round = tie.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(tie);
    return acc;
  }, {} as Record<string, KnockoutTie[]>);

  // Order rounds
  const roundOrder = ['round_16', 'quarter_final', 'semi_final', 'final'];
  const availableRounds = roundOrder.filter(round => tiesByRound[round]);

  const completedTies = tournament.knockoutBracket.filter(tie => tie.completed).length;
  const totalTies = tournament.knockoutBracket.length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-1">Knockout Stage</h2>
            <p className="text-light-600 dark:text-gray-400">Two-legged ties</p>
            {isMobile && (
              <p className="text-xs text-light-600 dark:text-gray-500 mt-2">💡 Tap rounds to expand/collapse</p>
            )}
          </div>
          <div className="bg-light-100/50 dark:bg-dark-100/50 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl px-4 py-2">
            <span className="text-sm text-light-600 dark:text-gray-400">
              {completedTies} / {totalTies} ties completed
            </span>
          </div>
        </div>

        {/* Rounds */}
        <div className="space-y-8">
          {availableRounds.map((roundKey, index) => (
            <motion.div
              key={roundKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RoundSection
                roundKey={roundKey}
                ties={tiesByRound[roundKey]}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                onRecordMatch={setRecordingMatch}
                isExpanded={expandedRounds.has(roundKey)}
                onToggle={() => toggleRound(roundKey)}
                isMobile={isMobile}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Record Match Modal */}
      {recordingMatch && (
        <RecordResultModal
          isOpen={true}
          onClose={() => setRecordingMatch(null)}
          onSubmit={handleMatchResultSubmit}
          homeTeam={recordingMatch.homeTeam}
          awayTeam={recordingMatch.awayTeam}
          title={`Record ${recordingMatch.leg === 'first' ? 'First' : 'Second'} Leg`}
        />
      )}
    </>
  );
}

/**
 * Round Section Component
 */
interface RoundSectionProps {
  roundKey: string;
  ties: KnockoutTie[];
  isAuthenticated: boolean;
  isLoading: boolean;
  onRecordMatch: (match: { tieId: string; leg: 'first' | 'second'; homeTeam: string; awayTeam: string }) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

function RoundSection({
  roundKey,
  ties,
  isAuthenticated,
  isLoading,
  onRecordMatch,
  isExpanded,
  onToggle,
  isMobile,
}: RoundSectionProps) {
  const roundNames: Record<string, string> = {
    'round_16': 'Round of 16',
    'quarter_final': 'Quarter Finals',
    'semi_final': 'Semi Finals',
    'final': 'Final'
  };

  const roundColors: Record<string, { gradient: string; border: string; text: string }> = {
    'round_16': {
      gradient: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400'
    },
    'quarter_final': {
      gradient: 'from-pink-500/20 to-purple-500/20',
      border: 'border-pink-500/30',
      text: 'text-pink-400'
    },
    'semi_final': {
      gradient: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400'
    },
    'final': {
      gradient: 'from-yellow-500/20 to-amber-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400'
    }
  };

  const colors = roundColors[roundKey];

  return (
    <Card variant="glass" className={`bg-gradient-to-br ${colors.gradient} border-2 ${colors.border}`}>
      {/* Round Header */}
      <div
        className={`flex items-center justify-between pb-4 ${isExpanded ? 'mb-4 border-b-2' : 'mb-0'} ${colors.border} ${
          isMobile ? 'cursor-pointer hover:opacity-80 active:scale-[0.99] transition-all' : ''
        }`}
        onClick={isMobile ? onToggle : undefined}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} border-2 ${colors.border}`}>
            <Trophy className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h3 className={`text-lg sm:text-xl font-bold ${colors.text}`}>{roundNames[roundKey]}</h3>
            <span className="text-xs sm:text-sm text-light-600 dark:text-gray-400">
              ({ties.filter(t => t.completed).length}/{ties.length} completed)
            </span>
          </div>
        </div>
        {isMobile && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-light-600 dark:text-gray-400 hidden sm:inline">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className={`w-5 h-5 ${colors.text}`} />
            </motion.div>
          </div>
        )}
      </div>

      {/* Ties */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ties.map((tie, index) => (
                <TieCard
                  key={tie.id}
                  tie={tie}
                  colors={colors}
                  isAuthenticated={isAuthenticated}
                  isLoading={isLoading}
                  onRecordMatch={onRecordMatch}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * Tie Card Component
 */
interface TieCardProps {
  tie: KnockoutTie;
  colors: { gradient: string; border: string; text: string };
  isAuthenticated: boolean;
  isLoading: boolean;
  onRecordMatch: (match: { tieId: string; leg: 'first' | 'second'; homeTeam: string; awayTeam: string }) => void;
  index: number;
}

function TieCard({
  tie,
  colors,
  isAuthenticated,
  isLoading,
  onRecordMatch,
  index,
}: TieCardProps) {
  // Calculate aggregate scores
  const team1Aggregate = (tie.firstLeg?.homeScore || 0) + (tie.secondLeg?.awayScore || 0);
  const team2Aggregate = (tie.firstLeg?.awayScore || 0) + (tie.secondLeg?.homeScore || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${colors.gradient} border ${colors.border}`}>
        {/* Teams with Aggregate */}
        <div className="space-y-3 mb-4">
          <div className={`flex items-center justify-between p-3 rounded-tech ${
            tie.completed && tie.winner === tie.team1 ? 'bg-green-500/20 border border-green-500/30' : 'bg-light-100/30 dark:bg-dark-100/30'
          }`}>
            <span className="font-bold text-light-900 dark:text-white">{tie.team1}</span>
            {tie.completed && (
              <span className="text-lg font-bold text-light-900 dark:text-white">{team1Aggregate}</span>
            )}
          </div>
          <div className={`flex items-center justify-between p-3 rounded-tech ${
            tie.completed && tie.winner === tie.team2 ? 'bg-green-500/20 border border-green-500/30' : 'bg-light-100/30 dark:bg-dark-100/30'
          }`}>
            <span className="font-bold text-light-900 dark:text-white">{tie.team2}</span>
            {tie.completed && (
              <span className="text-lg font-bold text-light-900 dark:text-white">{team2Aggregate}</span>
            )}
          </div>
        </div>

        {/* Legs */}
        <div className="space-y-3">
          {/* First Leg */}
          <LegRow
            label="First Leg"
            leg={tie.firstLeg}
            homeTeam={tie.team1}
            awayTeam={tie.team2}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            onRecord={() => onRecordMatch({
              tieId: tie.id!,
              leg: 'first',
              homeTeam: tie.team1,
              awayTeam: tie.team2,
            })}
          />

          {/* Second Leg */}
          <LegRow
            label="Second Leg"
            leg={tie.secondLeg}
            homeTeam={tie.team2}
            awayTeam={tie.team1}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            disabled={!tie.firstLeg?.played}
            onRecord={() => onRecordMatch({
              tieId: tie.id!,
              leg: 'second',
              homeTeam: tie.team2,
              awayTeam: tie.team1,
            })}
          />
        </div>

        {/* Winner Badge */}
        {tie.completed && tie.winner && (
          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 text-center">
            <span className="text-sm text-light-600 dark:text-gray-400">Winner: </span>
            <span className="font-bold text-green-400">{tie.winner}</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/**
 * Leg Row Component
 */
interface LegRowProps {
  label: string;
  leg?: { homeTeam: string; awayTeam: string; homeScore?: number; awayScore?: number; played: boolean };
  homeTeam: string;
  awayTeam: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  disabled?: boolean;
  onRecord: () => void;
}

function LegRow({
  label,
  leg,
  homeTeam,
  awayTeam,
  isAuthenticated,
  isLoading,
  disabled,
  onRecord,
}: LegRowProps) {
  return (
    <div className={`bg-light-100/50 dark:bg-dark-100/50 rounded-tech p-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-light-600 dark:text-gray-400" />
          <span className="text-xs font-semibold text-light-700 dark:text-gray-300">{label}</span>
        </div>
        {isAuthenticated && !leg?.played && !disabled && (
          <button
            onClick={onRecord}
            disabled={isLoading}
            className="bg-cyber-500 hover:bg-cyber-600 text-white text-xs px-3 py-1 rounded-tech font-semibold transition-colors disabled:opacity-50"
          >
            Record
          </button>
        )}
      </div>

      {leg?.played ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-light-900 dark:text-white">{homeTeam}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-light-900 dark:text-white">{leg.homeScore}</span>
            <span className="text-light-600 dark:text-gray-400">-</span>
            <span className="text-lg font-bold text-light-900 dark:text-white">{leg.awayScore}</span>
          </div>
          <span className="text-sm text-light-900 dark:text-white">{awayTeam}</span>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-xs text-yellow-400">
            {disabled ? 'Play first leg first' : 'Not played'}
          </span>
        </div>
      )}
    </div>
  );
}
