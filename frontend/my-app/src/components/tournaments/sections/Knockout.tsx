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
import { Trophy, ChevronDown, Pencil } from 'lucide-react';
import { Tournament, KnockoutTie, recordKnockoutMatch, editKnockoutTie, getTournamentById } from '@/lib/tournamentUtils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import CustomDropdown from '../../ui/CustomDropdown';
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
    initialHomeScore?: number;
    initialAwayScore?: number;
  } | null>(null);

  const [editingTie, setEditingTie] = useState<KnockoutTie | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  // Initialize expanded rounds (all expanded by default)
  useEffect(() => {
    if (!tournament.knockoutBracket) return;

    const roundOrder = ['round_16', 'quarter_final', 'semi_final', 'final'];
    const tiesByRound = tournament.knockoutBracket.reduce((acc, tie) => {
      if (!acc[tie.round]) acc[tie.round] = [];
      acc[tie.round].push(tie);
      return acc;
    }, {} as Record<string, KnockoutTie[]>);

    const availableRounds = roundOrder.filter(round => tiesByRound[round]);
    setExpandedRounds(new Set(availableRounds));
  }, [tournament.knockoutBracket]);

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
      await recordKnockoutMatch(
        tournament.id!,
        recordingMatch.tieId,
        recordingMatch.leg,
        recordingMatch.homeTeam,
        recordingMatch.awayTeam,
        homeScore,
        awayScore
      );

      // Refresh tournament data
      const refreshed = await getTournamentById(tournament.id!);
      if (refreshed) setTournament(refreshed);

      // Close modal
      setRecordingMatch(null);
    } catch (error) {
      console.error('Error recording knockout match:', error);
    }
  };

  /**
   * Handle editing a tie's matchup
   */
  const handleEditTieSubmit = async (team1: string, team2: string) => {
    if (!editingTie) return;

    try {
      await editKnockoutTie(tournament.id!, editingTie.id!, { team1, team2 });
      const refreshed = await getTournamentById(tournament.id!);
      if (refreshed) setTournament(refreshed);
      setEditingTie(null);
    } catch (error) {
      console.error('Error editing knockout tie:', error);
    }
  };

  // Collect all unique team names for the edit tie dropdown
  const allTeamNames = React.useMemo(() => {
    const names = new Set<string>();
    tournament.knockoutBracket?.forEach(tie => {
      if (tie.team1) names.add(tie.team1);
      if (tie.team2) names.add(tie.team2);
    });
    tournament.qualifiedTeams?.forEach(t => {
      if (t.name) names.add(t.name);
    });
    return Array.from(names).sort();
  }, [tournament.knockoutBracket, tournament.qualifiedTeams]);

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
                onEditTie={setEditingTie}
                isExpanded={expandedRounds.has(roundKey)}
                onToggle={() => toggleRound(roundKey)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Record/Edit Match Modal */}
      {recordingMatch && (
        <RecordResultModal
          isOpen={true}
          onClose={() => setRecordingMatch(null)}
          onSubmit={handleMatchResultSubmit}
          homeTeam={recordingMatch.homeTeam}
          awayTeam={recordingMatch.awayTeam}
          initialHomeScore={recordingMatch.initialHomeScore}
          initialAwayScore={recordingMatch.initialAwayScore}
          title={
            recordingMatch.initialHomeScore !== undefined
              ? `Edit ${recordingMatch.leg === 'first' ? 'First' : 'Second'} Leg`
              : `Record ${recordingMatch.leg === 'first' ? 'First' : 'Second'} Leg`
          }
        />
      )}

      {/* Edit Tie Modal */}
      {editingTie && (
        <EditTieModal
          tie={editingTie}
          teamOptions={allTeamNames}
          onClose={() => setEditingTie(null)}
          onSubmit={handleEditTieSubmit}
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
  onRecordMatch: (match: { tieId: string; leg: 'first' | 'second'; homeTeam: string; awayTeam: string; initialHomeScore?: number; initialAwayScore?: number }) => void;
  onEditTie: (tie: KnockoutTie) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function RoundSection({
  roundKey,
  ties,
  isAuthenticated,
  isLoading,
  onRecordMatch,
  onEditTie,
  isExpanded,
  onToggle,
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
        className={`flex items-center justify-between pb-3 ${isExpanded ? 'mb-3 border-b-2' : 'mb-0'} ${colors.border} cursor-pointer hover:opacity-80 active:scale-[0.99] transition-all select-none`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.gradient} border-2 ${colors.border}`}>
            <Trophy className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h3 className={`text-lg sm:text-xl font-bold ${colors.text}`}>{roundNames[roundKey]}</h3>
            <span className="text-xs sm:text-sm text-light-600 dark:text-gray-400">
              ({ties.filter(t => t.completed).length}/{ties.length} completed)
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className={`w-5 h-5 ${colors.text}`} />
        </motion.div>
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
                  onEditTie={onEditTie}
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
  onRecordMatch: (match: { tieId: string; leg: 'first' | 'second'; homeTeam: string; awayTeam: string; initialHomeScore?: number; initialAwayScore?: number }) => void;
  onEditTie: (tie: KnockoutTie) => void;
  index: number;
}

function TieCard({
  tie,
  colors,
  isAuthenticated,
  isLoading,
  onRecordMatch,
  onEditTie,
  index,
}: TieCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate aggregate scores
  const team1Aggregate = (tie.firstLeg?.homeScore || 0) + (tie.secondLeg?.awayScore || 0);
  const team2Aggregate = (tie.firstLeg?.awayScore || 0) + (tie.secondLeg?.homeScore || 0);

  const hasFirstLeg = tie.firstLeg?.played;
  const hasSecondLeg = tie.secondLeg?.played;
  const hasAnyLeg = hasFirstLeg || hasSecondLeg;
  const team1Won = tie.completed && tie.winner === tie.team1;
  const team2Won = tie.completed && tie.winner === tie.team2;
  const isAggregateDraw = hasAnyLeg && team1Aggregate === team2Aggregate && !tie.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.15) }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} !p-2.5 sm:!p-3`}>
        {/* Collapsed: single-row matchup — tappable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 select-none"
        >
          {/* Team 1 */}
          <div className={`flex-1 text-right ${team1Won ? 'opacity-100' : hasAnyLeg ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-center justify-end gap-1.5">
              {team1Won && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
              <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">{tie.team1}</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 px-1.5 sm:px-3 shrink-0">
            {hasAnyLeg ? (
              <>
                <span className={`text-sm sm:text-lg font-black ${team1Won ? 'text-green-400' : isAggregateDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>
                  {team1Aggregate}
                </span>
                <span className="text-light-600 dark:text-gray-500 text-xs">-</span>
                <span className={`text-sm sm:text-lg font-black ${team2Won ? 'text-green-400' : isAggregateDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>
                  {team2Aggregate}
                </span>
              </>
            ) : (
              <span className="text-xs text-light-500 dark:text-gray-500 font-semibold">vs</span>
            )}
          </div>

          {/* Team 2 */}
          <div className={`flex-1 text-left ${team2Won ? 'opacity-100' : hasAnyLeg ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">{tie.team2}</span>
              {team2Won && <Trophy className="w-3 h-3 text-yellow-400 shrink-0" />}
            </div>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="w-3.5 h-3.5 text-light-500 dark:text-gray-500" />
          </motion.div>
        </button>

        {/* Expanded: leg details + admin actions */}
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
                {/* First Leg */}
                <div className="flex items-center justify-between bg-light-100/50 dark:bg-dark-100/50 rounded-tech p-1.5 sm:p-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-light-700 dark:text-gray-300 w-8 sm:w-10">1st</span>
                  {hasFirstLeg ? (
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                      <span className="text-xs sm:text-sm text-light-900 dark:text-white">{tie.team1}</span>
                      <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white">{tie.firstLeg!.homeScore}-{tie.firstLeg!.awayScore}</span>
                      <span className="text-xs sm:text-sm text-light-900 dark:text-white">{tie.team2}</span>
                    </div>
                  ) : (
                    <span className="flex-1 text-center text-[10px] sm:text-xs text-yellow-400">Not played</span>
                  )}
                  {isAuthenticated && hasFirstLeg && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRecordMatch({
                        tieId: tie.id!, leg: 'first', homeTeam: tie.team1, awayTeam: tie.team2,
                        initialHomeScore: tie.firstLeg?.homeScore, initialAwayScore: tie.firstLeg?.awayScore,
                      }); }}
                      disabled={isLoading}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50 ml-1"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Second Leg */}
                <div className={`flex items-center justify-between bg-light-100/50 dark:bg-dark-100/50 rounded-tech p-1.5 sm:p-2 ${!hasFirstLeg ? 'opacity-50' : ''}`}>
                  <span className="text-[10px] sm:text-xs font-semibold text-light-700 dark:text-gray-300 w-8 sm:w-10">2nd</span>
                  {hasSecondLeg ? (
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                      <span className="text-xs sm:text-sm text-light-900 dark:text-white">{tie.team2}</span>
                      <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white">{tie.secondLeg!.homeScore}-{tie.secondLeg!.awayScore}</span>
                      <span className="text-xs sm:text-sm text-light-900 dark:text-white">{tie.team1}</span>
                    </div>
                  ) : (
                    <span className="flex-1 text-center text-[10px] sm:text-xs text-yellow-400">
                      {!hasFirstLeg ? 'Play 1st leg first' : 'Not played'}
                    </span>
                  )}
                  {isAuthenticated && hasSecondLeg && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRecordMatch({
                        tieId: tie.id!, leg: 'second', homeTeam: tie.team2, awayTeam: tie.team1,
                        initialHomeScore: tie.secondLeg?.homeScore, initialAwayScore: tie.secondLeg?.awayScore,
                      }); }}
                      disabled={isLoading}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50 ml-1"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Admin record buttons */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2 pt-1">
                    {!hasFirstLeg && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRecordMatch({
                          tieId: tie.id!, leg: 'first', homeTeam: tie.team1, awayTeam: tie.team2,
                        }); }}
                        disabled={isLoading}
                        className="bg-cyber-500 hover:bg-cyber-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded-tech font-semibold transition-colors disabled:opacity-50"
                      >
                        Record 1st Leg
                      </button>
                    )}
                    {hasFirstLeg && !hasSecondLeg && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRecordMatch({
                          tieId: tie.id!, leg: 'second', homeTeam: tie.team2, awayTeam: tie.team1,
                        }); }}
                        disabled={isLoading}
                        className="bg-cyber-500 hover:bg-cyber-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded-tech font-semibold transition-colors disabled:opacity-50"
                      >
                        Record 2nd Leg
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditTie(tie); }}
                      className="flex items-center gap-1 text-[10px] sm:text-xs text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors ml-auto"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      Matchup
                    </button>
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

/**
 * Edit Tie Modal Component
 */
interface EditTieModalProps {
  tie: KnockoutTie;
  teamOptions: string[];
  onClose: () => void;
  onSubmit: (team1: string, team2: string) => Promise<void>;
}

function EditTieModal({ tie, teamOptions, onClose, onSubmit }: EditTieModalProps) {
  const [team1, setTeam1] = useState(tie.team1);
  const [team2, setTeam2] = useState(tie.team2);
  const [isSaving, setIsSaving] = useState(false);

  const dropdownOptions = teamOptions.map(name => ({ value: name, label: name }));

  const handleSave = async () => {
    if (!team1 || !team2 || team1 === team2) return;
    setIsSaving(true);
    try {
      await onSubmit(team1, team2);
    } finally {
      setIsSaving(false);
    }
  };

  const teamsChanged = team1 !== tie.team1 || team2 !== tie.team2;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Matchup"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!team1 || !team2 || team1 === team2 || isSaving}
            glow
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {teamsChanged && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-3">
            <p className="text-yellow-400 text-xs font-semibold">
              Changing teams will reset all leg scores for this tie.
            </p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Team 1 (Home first leg)</label>
          <CustomDropdown
            value={team1}
            onChange={(val) => setTeam1(val as string)}
            options={dropdownOptions}
            placeholder="Select team 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Team 2 (Away first leg)</label>
          <CustomDropdown
            value={team2}
            onChange={(val) => setTeam2(val as string)}
            options={dropdownOptions}
            placeholder="Select team 2"
          />
        </div>
        {team1 === team2 && team1 !== '' && (
          <p className="text-red-400 text-xs">Teams must be different.</p>
        )}
      </div>
    </Modal>
  );
}
