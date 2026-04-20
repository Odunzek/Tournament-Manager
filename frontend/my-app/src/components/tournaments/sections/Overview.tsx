/**
 * Tournament Overview Section
 *
 * Displays tournament statistics, status, and admin actions.
 * Integrates with Firebase for real-time tournament data.
 *
 * @component
 * @features
 * - Tournament stats display (teams, groups, matches, etc.)
 * - Progress indicators
 * - Admin actions (Generate Groups, Generate Knockout)
 * - Tournament status display
 * - Responsive design with cyber theme
 */

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Target,
  BarChart3,
  Trophy,
  TrendingUp,
  Trash2,
  CheckCircle,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { Tournament, convertTimestamp, updateTournament } from '@/lib/tournamentUtils';
import { TournamentSection } from '@/types/tournament';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusBadge from '../StatusBadge';

interface OverviewProps {
  tournament: Tournament;
  isAuthenticated: boolean;
  isLoading: boolean;
  onGenerateGroups: () => Promise<void>;
  onGenerateKnockout: () => Promise<void>;
  areGroupMatchesComplete: (tournament: Tournament) => boolean;
  onDeleteTournament?: () => Promise<void>;
  onCompleteTournament?: () => Promise<void>;
  onRepairKnockout?: () => Promise<void>;
  onNavigate?: (section: TournamentSection) => void;
  // UCL-specific
  onUCLGeneratePlayoffs?: () => Promise<void>;
  onUCLGenerateKnockout?: () => Promise<void>;
  uclLeagueMatchStats?: { played: number; total: number };
}

/**
 * Format date for display
 */
const formatDate = (date: any) => {
  if (!date) return 'Not set';
  const jsDate = convertTimestamp(date);
  if (isNaN(jsDate.getTime())) return 'Not set';
  return jsDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Get tournament type label
 */
const getTournamentTypeLabel = (type: string) => {
  switch (type) {
    case 'league':
      return 'League Format';
    case 'knockout':
      return 'Knockout Format';
    case 'champions_league':
      return 'Groups & Knockout';
    case 'ucl':
      return 'UCL Format';
    case 'custom':
      return 'Custom Format';
    default:
      return 'Tournament';
  }
};

export default function Overview({
  tournament,
  isAuthenticated,
  isLoading,
  onGenerateGroups,
  onGenerateKnockout,
  areGroupMatchesComplete,
  onDeleteTournament,
  onCompleteTournament,
  onRepairKnockout,
  onNavigate,
  onUCLGeneratePlayoffs,
  onUCLGenerateKnockout,
  uclLeagueMatchStats,
}: OverviewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [editedRules, setEditedRules] = useState(tournament.rules || '');
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [saveRulesError, setSaveRulesError] = useState('');
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const RULES_THRESHOLD = 300;
  const hasRules = Boolean(tournament.rules?.trim());
  const rulesIsLong = (tournament.rules?.length ?? 0) > RULES_THRESHOLD;
  const rulesDisplayText = !rulesExpanded && rulesIsLong
    ? tournament.rules!.slice(0, RULES_THRESHOLD) + '...'
    : tournament.rules;

  const handleSaveRules = async () => {
    if (!tournament.id) return;
    setIsSavingRules(true);
    setSaveRulesError('');
    try {
      await updateTournament(tournament.id, {
        rules: editedRules.trim() || undefined,
      });
      setIsEditingRules(false);
    } catch {
      setSaveRulesError('Failed to save rules. Please try again.');
    } finally {
      setIsSavingRules(false);
    }
  };

  // Calculate stats
  const totalGroupMatches = tournament.groups?.reduce((total, group) =>
    total + group.matches.length, 0) || 0;
  const playedGroupMatches = tournament.groups?.reduce((total, group) =>
    total + group.matches.filter(m => m.played).length, 0) || 0;
  const totalKnockoutMatches = tournament.knockoutBracket?.reduce((total, tie) =>
    total + (tie.firstLeg ? 1 : 0) + (tie.secondLeg ? 1 : 0), 0) || 0;
  const playedKnockoutMatches = tournament.knockoutBracket?.reduce((total, tie) =>
    total + (tie.firstLeg?.played ? 1 : 0) + (tie.secondLeg?.played ? 1 : 0), 0) || 0;

  const totalMatches = totalGroupMatches + totalKnockoutMatches;
  const playedMatches = playedGroupMatches + playedKnockoutMatches;
  const progress = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Tournament Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="gradient">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-cyber-400 shrink-0" />
                <h1 className="text-xl sm:text-3xl font-bold text-light-900 dark:text-white truncate">{tournament.name}</h1>
              </div>
              <p className="text-sm text-light-600 dark:text-gray-400 mb-2">{getTournamentTypeLabel(tournament.type)}</p>
              <StatusBadge status={tournament.status} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tournament Rules — collapsible, immediately below the name */}
      <Card variant="glass">
        <button
          onClick={() => { setRulesOpen(!rulesOpen); setIsEditingRules(false); setSaveRulesError(''); }}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-cyber-400" />
            <span className="font-semibold text-sm text-light-900 dark:text-white">Tournament Rules</span>
            {!hasRules && !rulesOpen && (
              <span className="text-[11px] text-light-500 dark:text-gray-500 ml-1">None set</span>
            )}
          </div>
          {rulesOpen ? <ChevronUp className="w-4 h-4 text-light-500 dark:text-gray-400" /> : <ChevronDown className="w-4 h-4 text-light-500 dark:text-gray-400" />}
        </button>

        {rulesOpen && (
          <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-3">
            {isEditingRules ? (
              <>
                <textarea
                  value={editedRules}
                  onChange={(e) => setEditedRules(e.target.value)}
                  placeholder="Enter tournament rules. Line breaks will be preserved..."
                  rows={6}
                  disabled={isSavingRules}
                  className="w-full px-4 py-2.5 bg-light-50 dark:bg-dark-100/50 border-2 border-cyber-500/25 dark:border-white/10 rounded-tech text-light-900 dark:text-gray-100 placeholder-light-500 dark:placeholder-gray-500 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20 transition-all resize-none disabled:opacity-50"
                />
                {saveRulesError && (
                  <p className="text-red-400 text-xs">{saveRulesError}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<X className="w-4 h-4" />} onClick={() => { setIsEditingRules(false); setSaveRulesError(''); }} disabled={isSavingRules} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={handleSaveRules} isLoading={isSavingRules} glow className="flex-1">
                    Save
                  </Button>
                </div>
              </>
            ) : hasRules ? (
              <>
                <p className="whitespace-pre-wrap text-sm text-light-700 dark:text-gray-300 leading-relaxed">
                  {rulesDisplayText}
                </p>
                {rulesIsLong && (
                  <button onClick={() => setRulesExpanded(!rulesExpanded)} className="flex items-center gap-1 text-cyber-600 dark:text-cyber-400 text-xs font-semibold hover:underline">
                    {rulesExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
                  </button>
                )}
                {isAuthenticated && (
                  <Button variant="ghost" size="sm" leftIcon={<Edit3 className="w-4 h-4" />} onClick={() => { setEditedRules(tournament.rules || ''); setIsEditingRules(true); }}>
                    Edit Rules
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-light-500 dark:text-gray-500">
                  {isAuthenticated ? 'No rules set yet.' : 'No rules have been defined for this tournament.'}
                </p>
                {isAuthenticated && (
                  <Button variant="ghost" size="sm" leftIcon={<Edit3 className="w-4 h-4" />} onClick={() => { setEditedRules(''); setIsEditingRules(true); }}>
                    Add Rules
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Stats Grid — compact on mobile */}
      <Card variant="glass">
        <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10 sm:hidden">
          <button onClick={() => onNavigate?.('teams')} className="text-center px-1 py-1">
            <p className="text-[10px] text-light-600 dark:text-gray-400 mb-0.5">Teams</p>
            <p className="text-base font-bold text-cyber-400">{tournament.currentTeams}/{tournament.maxTeams}</p>
          </button>
          <button onClick={() => onNavigate?.('groups')} className="text-center px-1 py-1">
            <p className="text-[10px] text-light-600 dark:text-gray-400 mb-0.5">Groups</p>
            <p className="text-base font-bold text-electric-400">{tournament.groups?.length || 0}</p>
          </button>
          <button onClick={() => onNavigate?.('knockout')} className="text-center px-1 py-1">
            <p className="text-[10px] text-light-600 dark:text-gray-400 mb-0.5">KO Ties</p>
            <p className="text-base font-bold text-pink-400">{tournament.knockoutBracket?.length || 0}</p>
          </button>
          <button onClick={() => onNavigate?.('fixtures')} className="text-center px-1 py-1">
            <p className="text-[10px] text-light-600 dark:text-gray-400 mb-0.5">Played</p>
            <p className="text-base font-bold text-purple-400">{playedMatches}</p>
          </button>
        </div>
        <div className="hidden sm:grid grid-cols-4 gap-4">
          {[
            { label: 'Teams', value: `${tournament.currentTeams}/${tournament.maxTeams}`, color: 'text-cyber-400', icon: Users, bg: 'bg-cyber-500/20', nav: 'teams' as const },
            { label: 'Groups', value: tournament.groups?.length || 0, color: 'text-electric-400', icon: Target, bg: 'bg-electric-500/20', nav: 'groups' as const },
            { label: 'KO Ties', value: tournament.knockoutBracket?.length || 0, color: 'text-pink-400', icon: Trophy, bg: 'bg-pink-500/20', nav: 'knockout' as const },
            { label: 'Played', value: playedMatches, color: 'text-purple-400', icon: BarChart3, bg: 'bg-purple-500/20', nav: 'fixtures' as const },
          ].map(({ label, value, color, icon: Icon, bg, nav }) => (
            <button key={label} onClick={() => onNavigate?.(nav)} className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-tech ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className="text-left">
                <p className="text-xs text-light-600 dark:text-gray-400">{label}</p>
                <p className={`text-xl font-bold text-light-900 dark:text-white`}>{value}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Progress + Details — merged into one card */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyber-400" />
            <span className="text-sm font-semibold text-light-900 dark:text-white">Progress</span>
          </div>
          <span className="text-xs text-light-600 dark:text-gray-400">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-light-300 dark:bg-dark-200 rounded-full h-2 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-cyber-500 to-electric-500 h-2 rounded-full"
          />
        </div>
        <div className="space-y-2 pt-3 border-t border-black/10 dark:border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-sm text-light-600 dark:text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Phase
            </span>
            <span className="text-sm font-semibold text-light-900 dark:text-white capitalize">
              {tournament.status.replace('_', ' ')}
            </span>
          </div>
          {tournament.startDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-light-600 dark:text-gray-400">Start</span>
              <span className="text-sm font-semibold text-light-900 dark:text-white">{formatDate(tournament.startDate)}</span>
            </div>
          )}
          {tournament.endDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-light-600 dark:text-gray-400">End</span>
              <span className="text-sm font-semibold text-light-900 dark:text-white">{formatDate(tournament.endDate)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Admin Actions */}
      {isAuthenticated && (
        <Card variant="gradient">
          <h3 className="text-sm sm:text-lg font-bold text-light-900 dark:text-white mb-2 sm:mb-4">Admin Actions</h3>

          {/* UCL: Setup — go to Pots tab */}
          {tournament.type === 'ucl' && tournament.status === 'setup' && (
            <div className="space-y-3">
              <div className="bg-cyber-500/10 border border-cyber-500/20 rounded-tech p-4">
                <p className="text-cyber-400 font-semibold mb-1">Setup Phase</p>
                <p className="text-light-600 dark:text-gray-400 text-sm">
                  Enroll players and open the Pot Draw from the <strong>Pots</strong> tab.
                </p>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => onNavigate?.('ucl_pots' as any)}>
                Go to Pots →
              </Button>
            </div>
          )}

          {/* UCL: League Phase */}
          {tournament.type === 'ucl' && tournament.status === 'league_phase' && (
            <div className="space-y-3">
              {uclLeagueMatchStats && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-tech p-4">
                  <p className="text-blue-400 font-semibold mb-1">League Phase Active</p>
                  <p className="text-blue-300/70 text-sm">
                    {uclLeagueMatchStats.played} / {uclLeagueMatchStats.total} matches played
                  </p>
                </div>
              )}
              {uclLeagueMatchStats?.played === uclLeagueMatchStats?.total && (uclLeagueMatchStats?.total ?? 0) > 0 ? (
                <Button
                  variant="secondary"
                  onClick={onUCLGeneratePlayoffs}
                  disabled={isLoading}
                  isLoading={isLoading}
                  glow
                  className="w-full"
                >
                  Generate Playoffs
                </Button>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-4">
                  <p className="text-yellow-400 font-semibold text-sm">Complete all league matches to generate playoffs.</p>
                </div>
              )}
            </div>
          )}

          {/* UCL: Playoff Phase */}
          {tournament.type === 'ucl' && tournament.status === 'playoff' && (() => {
            const playoffTies = tournament.knockoutBracket?.filter(t => t.round === 'playoff' && !t.originalTieId) ?? [];
            const allPlayoffDone = playoffTies.length > 0 && playoffTies.every(t => t.completed);
            return (
              <div className="space-y-3">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-tech p-4">
                  <p className="text-orange-400 font-semibold mb-1">Playoff Round Active</p>
                  <p className="text-orange-300/70 text-sm">
                    {playoffTies.filter(t => t.completed).length} / {playoffTies.length} playoff ties completed
                  </p>
                </div>
                {allPlayoffDone ? (
                  <Button variant="secondary" onClick={onUCLGenerateKnockout} disabled={isLoading} isLoading={isLoading} glow className="w-full">
                    Generate Knockout Stage
                  </Button>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-4">
                    <p className="text-yellow-400 font-semibold text-sm">Complete all playoff ties to generate the knockout bracket.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* UCL: Knockout Phase */}
          {tournament.type === 'ucl' && tournament.status === 'knockout' && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-tech p-4">
                <p className="text-green-400 font-semibold mb-1">Knockout Stage Active</p>
                <p className="text-green-300/70 text-sm">Two-legged ties — winners auto-advance each round.</p>
              </div>
              {onRepairKnockout && (
                <Button variant="secondary" onClick={onRepairKnockout} disabled={isLoading} isLoading={isLoading} className="w-full">
                  Generate Next Round
                </Button>
              )}
            </div>
          )}

          {/* Setup Phase - Generate Groups (non-UCL) */}
          {tournament.type !== 'ucl' && tournament.status === 'setup' && (
            <div className="space-y-4">
              {tournament.currentTeams >= 8 ? (
                <Button
                  variant="primary"
                  onClick={onGenerateGroups}
                  disabled={isLoading}
                  isLoading={isLoading}
                  glow
                  className="w-full"
                >
                  Generate Groups ({tournament.currentTeams} teams)
                </Button>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-4">
                  <p className="text-yellow-400 font-semibold mb-1">Need More Teams</p>
                  <p className="text-yellow-300/70 text-sm">
                    Add at least {Math.max(0, 8 - tournament.currentTeams)} more teams to generate groups
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Group Stage - Generate Knockout */}
          {tournament.status === 'group_stage' && (
            <div className="space-y-4">
              {areGroupMatchesComplete(tournament) ? (
                <Button
                  variant="secondary"
                  onClick={onGenerateKnockout}
                  disabled={isLoading}
                  isLoading={isLoading}
                  glow
                  className="w-full"
                >
                  Generate Knockout Stage
                </Button>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-tech p-4">
                  <p className="text-blue-400 font-semibold mb-1">Complete Group Matches</p>
                  <p className="text-blue-300/70 text-sm">
                    Finish all group stage matches ({playedGroupMatches}/{totalGroupMatches}) to progress to knockout
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Knockout Phase (non-UCL) */}
          {tournament.type !== 'ucl' && tournament.status === 'knockout' && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-tech p-4">
                <p className="text-green-400 font-semibold mb-1">Knockout Stage Active</p>
                <p className="text-green-300/70 text-sm">
                  {playedKnockoutMatches}/{totalKnockoutMatches} knockout matches completed
                </p>
              </div>
              {onRepairKnockout && (
                <Button
                  variant="secondary"
                  onClick={onRepairKnockout}
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Generate Next Round
                </Button>
              )}
            </div>
          )}

          {/* Completed */}
          {tournament.status === 'completed' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-tech p-4">
              <p className="text-purple-400 font-semibold mb-1">Tournament Completed!</p>
              <p className="text-purple-300/70 text-sm">
                All matches have been played
              </p>
            </div>
          )}

          {/* Complete Tournament */}
          {tournament.status !== 'completed' && onCompleteTournament && (
            <div className="mt-6">
              <Button
                variant="outline"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={onCompleteTournament}
                disabled={isLoading}
                className="w-full text-green-400 hover:bg-green-500/10 border-2 border-green-500/30"
              >
                Mark Tournament as Completed
              </Button>
            </div>
          )}

          {/* Delete Tournament */}
          {onDeleteTournament && (
            <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10">
              <h4 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h4>
              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-red-400 hover:bg-red-500/10 border border-red-500/20"
                >
                  Delete Tournament
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-tech p-4">
                    <p className="text-red-400 font-semibold mb-1">Are you sure?</p>
                    <p className="text-red-300/70 text-sm">
                      This will permanently delete the tournament and all its data. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onDeleteTournament}
                      disabled={isLoading}
                      isLoading={isLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-light-900 dark:text-white"
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
