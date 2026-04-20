"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, Pencil, Swords } from 'lucide-react';
import { Tournament, KnockoutTie, recordKnockoutMatch, getTournamentById } from '@/lib/tournamentUtils';
import Card from '../../ui/Card';
import RecordResultModal from '../RecordResultModal';

interface UCLPlayoffProps {
  tournament: Tournament;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTournament: (t: Tournament) => void;
}

export default function UCLPlayoff({ tournament, isAuthenticated, isLoading, setTournament }: UCLPlayoffProps) {
  const [recordingMatch, setRecordingMatch] = useState<{
    tieId: string;
    leg: 'first' | 'second';
    homeTeam: string;
    awayTeam: string;
    initialHomeScore?: number;
    initialAwayScore?: number;
  } | null>(null);

  const playoffTies = (tournament.knockoutBracket ?? []).filter(t => t.round === 'playoff' && !t.originalTieId);
  const completedCount = playoffTies.filter(t => t.completed).length;

  const handleMatchResultSubmit = async (homeScore: number, awayScore: number) => {
    if (!recordingMatch) return;
    try {
      await recordKnockoutMatch(
        tournament.id!,
        recordingMatch.tieId,
        recordingMatch.leg,
        recordingMatch.homeTeam,
        recordingMatch.awayTeam,
        homeScore,
        awayScore
      );
      const refreshed = await getTournamentById(tournament.id!);
      if (refreshed) setTournament(refreshed);
    } finally {
      setRecordingMatch(null);
    }
  };

  if (playoffTies.length === 0) {
    return (
      <div className="text-center py-20">
        <Swords className="w-16 h-16 text-light-500 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-light-900 dark:text-white mb-2">No Playoff Ties Yet</h3>
        <p className="text-light-600 dark:text-gray-400 text-sm">Playoff bracket will appear here once generated from the Overview tab.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-1">Playoff Round</h2>
            <p className="text-light-600 dark:text-gray-400 text-sm">Two-legged ties — winners advance to knockout</p>
          </div>
          <div className="bg-light-100/50 dark:bg-dark-100/50 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl px-4 py-2">
            <span className="text-sm text-light-600 dark:text-gray-400">{completedCount} / {playoffTies.length} ties completed</span>
          </div>
        </div>

        {/* Replay ties notice */}
        {(tournament.knockoutBracket ?? []).some(t => t.round === 'playoff' && t.originalTieId) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-3">
            <p className="text-yellow-400 text-xs font-semibold">Some ties ended level on aggregate — replay matches have been created below.</p>
          </div>
        )}

        {/* Tie cards */}
        <Card variant="glass" className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30">
          {/* Section header */}
          <div className="flex items-center gap-3 pb-3 mb-3 border-b-2 border-orange-500/30">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30">
              <Swords className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-orange-400">Playoff Round</h3>
              <span className="text-xs sm:text-sm text-light-600 dark:text-gray-400">
                ({completedCount}/{playoffTies.length} completed)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {playoffTies.map((tie, index) => (
              <PlayoffTieCard
                key={tie.id}
                tie={tie}
                index={index}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                onRecordMatch={setRecordingMatch}
              />
            ))}
          </div>

          {/* Replay ties */}
          {(tournament.knockoutBracket ?? []).filter(t => t.round === 'playoff' && t.originalTieId).map((tie, index) => (
            <div key={tie.id} className="mt-4 pt-4 border-t border-orange-500/20">
              <p className="text-xs text-orange-400 font-semibold mb-2">Replay</p>
              <PlayoffTieCard
                tie={tie}
                index={index}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                onRecordMatch={setRecordingMatch}
              />
            </div>
          ))}
        </Card>
      </div>

      {recordingMatch && (
        <RecordResultModal
          isOpen
          onClose={() => setRecordingMatch(null)}
          onSubmit={handleMatchResultSubmit}
          homeTeam={recordingMatch.homeTeam}
          awayTeam={recordingMatch.awayTeam}
          initialHomeScore={recordingMatch.initialHomeScore}
          initialAwayScore={recordingMatch.initialAwayScore}
          title={
            recordingMatch.initialHomeScore !== undefined
              ? `Edit ${recordingMatch.leg === 'first' ? '1st' : '2nd'} Leg`
              : `Record ${recordingMatch.leg === 'first' ? '1st' : '2nd'} Leg`
          }
        />
      )}
    </>
  );
}

interface PlayoffTieCardProps {
  tie: KnockoutTie;
  index: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  onRecordMatch: (m: { tieId: string; leg: 'first' | 'second'; homeTeam: string; awayTeam: string; initialHomeScore?: number; initialAwayScore?: number }) => void;
}

function PlayoffTieCard({ tie, index, isAuthenticated, isLoading, onRecordMatch }: PlayoffTieCardProps) {
  const [expanded, setExpanded] = useState(false);

  const team1Agg = (tie.firstLeg?.homeScore ?? 0) + (tie.secondLeg?.awayScore ?? 0);
  const team2Agg = (tie.firstLeg?.awayScore ?? 0) + (tie.secondLeg?.homeScore ?? 0);
  const hasFirstLeg = tie.firstLeg?.played;
  const hasSecondLeg = tie.secondLeg?.played;
  const hasAnyLeg = hasFirstLeg || hasSecondLeg;
  const team1Won = tie.completed && tie.winner === tie.team1;
  const team2Won = tie.completed && tie.winner === tie.team2;
  const isAggDraw = hasAnyLeg && team1Agg === team2Agg && !tie.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
    >
      <Card variant="glass" className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 !p-2.5 sm:!p-3">
        {/* Collapsed: matchup row */}
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 select-none">
          <div className={`flex-1 text-right ${team1Won ? 'opacity-100' : hasAnyLeg ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-end gap-1.5">
              {team1Won && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
              <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">{tie.team1}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-1.5 sm:px-3 shrink-0">
            {hasAnyLeg ? (
              <>
                <span className={`text-sm sm:text-lg font-black ${team1Won ? 'text-green-400' : isAggDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>{team1Agg}</span>
                <span className="text-light-600 dark:text-gray-500 text-xs">-</span>
                <span className={`text-sm sm:text-lg font-black ${team2Won ? 'text-green-400' : isAggDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>{team2Agg}</span>
              </>
            ) : (
              <span className="text-xs text-light-500 dark:text-gray-500 font-semibold">vs</span>
            )}
          </div>

          <div className={`flex-1 text-left ${team2Won ? 'opacity-100' : hasAnyLeg ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">{tie.team2}</span>
              {team2Won && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
            </div>
          </div>

          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
            <ChevronDown className="w-3.5 h-3.5 text-light-500 dark:text-gray-500" />
          </motion.div>
        </button>

        {/* Expanded: leg details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5">
                {/* 1st Leg */}
                <div className="flex items-center justify-between bg-light-100/50 dark:bg-dark-100/50 rounded-tech p-1.5 sm:p-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-light-700 dark:text-gray-300 w-8">1st</span>
                  {hasFirstLeg ? (
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                      <span className="text-xs text-light-900 dark:text-white">{tie.team1}</span>
                      <span className="text-xs font-bold text-light-900 dark:text-white">{tie.firstLeg!.homeScore}-{tie.firstLeg!.awayScore}</span>
                      <span className="text-xs text-light-900 dark:text-white">{tie.team2}</span>
                    </div>
                  ) : (
                    <span className="flex-1 text-center text-[10px] text-yellow-400">Not played</span>
                  )}
                  {isAuthenticated && hasFirstLeg && (
                    <button onClick={(e) => { e.stopPropagation(); onRecordMatch({ tieId: tie.id!, leg: 'first', homeTeam: tie.team1, awayTeam: tie.team2, initialHomeScore: tie.firstLeg?.homeScore, initialAwayScore: tie.firstLeg?.awayScore }); }} className="text-yellow-400 hover:text-yellow-300 ml-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 2nd Leg */}
                <div className={`flex items-center justify-between bg-light-100/50 dark:bg-dark-100/50 rounded-tech p-1.5 sm:p-2 ${!hasFirstLeg ? 'opacity-50' : ''}`}>
                  <span className="text-[10px] sm:text-xs font-semibold text-light-700 dark:text-gray-300 w-8">2nd</span>
                  {hasSecondLeg ? (
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                      <span className="text-xs text-light-900 dark:text-white">{tie.team2}</span>
                      <span className="text-xs font-bold text-light-900 dark:text-white">{tie.secondLeg!.homeScore}-{tie.secondLeg!.awayScore}</span>
                      <span className="text-xs text-light-900 dark:text-white">{tie.team1}</span>
                    </div>
                  ) : (
                    <span className="flex-1 text-center text-[10px] text-yellow-400">{!hasFirstLeg ? 'Play 1st leg first' : 'Not played'}</span>
                  )}
                  {isAuthenticated && hasSecondLeg && (
                    <button onClick={(e) => { e.stopPropagation(); onRecordMatch({ tieId: tie.id!, leg: 'second', homeTeam: tie.team2, awayTeam: tie.team1, initialHomeScore: tie.secondLeg?.homeScore, initialAwayScore: tie.secondLeg?.awayScore }); }} className="text-yellow-400 hover:text-yellow-300 ml-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Admin record buttons */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2 pt-1">
                    {!hasFirstLeg && (
                      <button onClick={(e) => { e.stopPropagation(); onRecordMatch({ tieId: tie.id!, leg: 'first', homeTeam: tie.team1, awayTeam: tie.team2 }); }} disabled={isLoading} className="bg-cyber-500 hover:bg-cyber-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded-tech font-semibold transition-colors disabled:opacity-50">
                        Record 1st Leg
                      </button>
                    )}
                    {hasFirstLeg && !hasSecondLeg && (
                      <button onClick={(e) => { e.stopPropagation(); onRecordMatch({ tieId: tie.id!, leg: 'second', homeTeam: tie.team2, awayTeam: tie.team1 }); }} disabled={isLoading} className="bg-cyber-500 hover:bg-cyber-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded-tech font-semibold transition-colors disabled:opacity-50">
                        Record 2nd Leg
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
