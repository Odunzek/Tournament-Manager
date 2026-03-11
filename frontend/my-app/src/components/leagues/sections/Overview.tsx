/**
 * League Overview Section
 *
 * The first tab visible when a user opens a league. Shows:
 *   - League header (name, season, dates, status badge)
 *   - Collapsible rules panel with inline editing for admins
 *   - Current leader highlight card (active leagues only)
 *   - Quick stats grid (players, matches played, remaining, total goals)
 *   - Last 5 match results
 *   - Admin quick-action buttons (Add Players, Edit League, End League, Delete)
 *
 * The rules panel supports a truncation/expand pattern: if the rules text exceeds
 * RULES_THRESHOLD characters, a "Read more" toggle is shown to avoid the card
 * growing too tall by default.
 */
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Calendar, Edit, CheckCircle, UserPlus, Trash2, ScrollText, ChevronDown, ChevronUp, Edit3, Check, X } from 'lucide-react';
import { League, LeaguePlayer, LeagueMatch } from '@/types/league';
import { convertTimestamp, updateLeague } from '@/lib/leagueUtils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import MatchResultCard from '../MatchResultCard';
import DeleteLeagueModal from '../DeleteLeagueModal';
import EditLeagueModal from '../EditLeagueModal';

interface OverviewProps {
  league: League;
  leagueLeader: LeaguePlayer | null;   // Player at position 1 in the current standings
  recentMatches: LeagueMatch[];         // Last N matches to show in the Recent Results section
  totalGoals: number;                   // Sum of all goals across completed matches
  playerCount: number;                  // Number of players enrolled in the league
  isAuthenticated: boolean;             // Whether the current user is an authorized admin
  isLoading: boolean;                   // True while standings are being recalculated
  onAddPlayers?: () => void;            // Admin: opens the Add Players modal
  onEndLeague?: () => void;             // Admin: triggers end-league confirmation
  onMatchUpdated?: () => void;          // Callback to refresh standings after an edit
}

export default function Overview({
  league,
  leagueLeader,
  recentMatches,
  totalGoals,
  playerCount,
  isAuthenticated,
  isLoading,
  onAddPlayers,
  onEndLeague,
  onMatchUpdated,
}: OverviewProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // Controls whether the rules accordion panel is open or collapsed
  const [rulesOpen, setRulesOpen] = useState(false);
  // True while the admin is typing in the rules textarea
  const [isEditingRules, setIsEditingRules] = useState(false);
  // Draft value for the rules textarea — kept in sync with saved rules on edit start
  const [editedRules, setEditedRules] = useState(league.rules || '');
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [saveRulesError, setSaveRulesError] = useState('');
  // True when the user has clicked "Read more" to see the full rules text
  const [rulesExpanded, setRulesExpanded] = useState(false);

  // Rules truncation: collapse text longer than 300 chars by default
  const RULES_THRESHOLD = 300;
  const hasRules = Boolean(league.rules?.trim());
  const rulesIsLong = (league.rules?.length ?? 0) > RULES_THRESHOLD;
  const rulesDisplayText = !rulesExpanded && rulesIsLong
    ? league.rules!.slice(0, RULES_THRESHOLD) + '...'
    : league.rules;

  /** Save the edited rules text back to Firestore. Clears the editing state on success. */
  const handleSaveRules = async () => {
    if (!league.id) return;
    setIsSavingRules(true);
    setSaveRulesError('');
    try {
      // Pass undefined (not empty string) to remove the rules field entirely when cleared
      await updateLeague(league.id, {
        rules: editedRules.trim() || undefined,
      });
      setIsEditingRules(false);
    } catch {
      setSaveRulesError('Failed to save rules. Please try again.');
    } finally {
      setIsSavingRules(false);
    }
  };

  // Convert Firestore Timestamps to JS Dates for display
  const startDate = convertTimestamp(league.startDate);
  const endDate = league.endDate ? convertTimestamp(league.endDate) : null;

  // Progress bar calculation: how many of the expected round-robin matches are done
  const totalMatches = league.totalMatches || 0;
  const matchesPlayed = league.matchesPlayed || 0;
  const matchProgress = totalMatches > 0 ? (matchesPlayed / totalMatches) * 100 : 0;

  /** Returns a styled badge element for the current league status. */
  const getStatusBadge = () => {
    const badges = {
      active: {
        label: 'Active',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: TrendingUp,
      },
      upcoming: {
        label: 'Upcoming',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Calendar,
      },
      completed: {
        label: 'Completed',
        className: 'bg-gray-500/20 text-light-600 dark:text-gray-400 border-gray-500/30',
        icon: CheckCircle,
      },
    };

    const badge = badges[league.status];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${badge.className}`}>
        <Icon className="w-3 h-3" />
        <span className="font-bold">{badge.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* League Header */}
      <Card variant="glass" className=" relative">
        <div className="absolute top-3 right-3">{getStatusBadge()}</div>
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-light-900 dark:text-white mb-0.5 sm:mb-2 pr-20">{league.name}</h2>
          <p className="text-xs sm:text-lg text-light-600 dark:text-gray-400 mb-1 sm:mb-3">{league.season}</p>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-light-500 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {endDate &&
                ` - ${endDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {league.status === 'active' && (
          <div className="mt-3 sm:mt-6">
            <div className="flex items-center justify-between text-xs sm:text-sm text-light-600 dark:text-gray-400 mb-2">
              <span>League Progress</span>
              <span>
                {matchesPlayed} / {totalMatches} matches ({Math.round(matchProgress)}%)
              </span>
            </div>
            <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-2 bg-gradient-to-r from-cyber-400 to-electric-500"
              />
            </div>
          </div>
        )}
      </Card>

      {/* League Rules */}
      <Card variant="glass" className="">
        <button
          onClick={() => { setRulesOpen(!rulesOpen); setIsEditingRules(false); setSaveRulesError(''); }}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-cyber-400" />
            <span className="font-semibold text-sm text-light-900 dark:text-white">League Rules</span>
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
                  placeholder="Enter league rules. Line breaks will be preserved..."
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
                  <Button variant="ghost" size="sm" leftIcon={<Edit3 className="w-4 h-4" />} onClick={() => { setEditedRules(league.rules || ''); setIsEditingRules(true); }}>
                    Edit Rules
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-light-500 dark:text-gray-500">
                  {isAuthenticated ? 'No rules set yet.' : 'No rules have been defined for this league.'}
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

      {/* League Leader */}
      {leagueLeader && league.status === 'active' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            variant="glass"
            className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/30 "
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-light-600 dark:text-gray-300 mb-0.5 sm:mb-1">Current League Leader</p>
                <h3 className="text-lg sm:text-2xl font-bold text-yellow-400">{leagueLeader.name}</h3>
                <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-light-600 dark:text-gray-300 flex-wrap">
                  <span>{leagueLeader.points || 0} points</span>
                  <span>•</span>
                  <span>
                    {leagueLeader.won || 0}W {leagueLeader.draw || 0}D {leagueLeader.lost || 0}L
                  </span>
                  <span>•</span>
                  <span>GD: {(leagueLeader.goalDifference || 0) > 0 ? '+' : ''}{leagueLeader.goalDifference || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Statistics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass">
          <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10">
            <div className="text-center px-2 py-1">
              <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Players</p>
              <p className="text-base sm:text-2xl font-bold text-cyber-400">{playerCount}</p>
            </div>
            <div className="text-center px-2 py-1">
              <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Played</p>
              <p className="text-base sm:text-2xl font-bold text-electric-400">{matchesPlayed}</p>
            </div>
            <div className="text-center px-2 py-1">
              <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Remaining</p>
              <p className="text-base sm:text-2xl font-bold text-green-400">{Math.max(0, (league.totalMatches || 0) - (league.matchesPlayed || 0))}</p>
            </div>
            <div className="text-center px-2 py-1">
              <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Total Goals</p>
              <p className="text-base sm:text-2xl font-bold text-pink-400">{totalGoals || 0}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <div>
          <h3 className="text-base sm:text-xl font-bold text-light-900 dark:text-white mb-2 sm:mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-400" />
            Recent Results
          </h3>
          <div className="space-y-1.5 sm:space-y-3">
            {recentMatches.slice(0, 5).map((match, index) => (
              <MatchResultCard key={match.id} match={match} index={index} onMatchUpdated={onMatchUpdated} />
            ))}
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {isAuthenticated && (
        <Card variant="glass" className="">
          <h3 className="text-sm sm:text-lg font-bold text-light-900 dark:text-white mb-2 sm:mb-4">Quick Actions</h3>
          {(onAddPlayers || onEndLeague) && (
            <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 sm:gap-3 mb-2 sm:mb-4">
              {onAddPlayers && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4 sm:w-4 sm:h-4" />}
                  className="sm:flex-1 !px-0 sm:!px-3 justify-center"
                  onClick={onAddPlayers}
                >
                  <span className="hidden sm:inline">Add Players</span>
                  <span className="sm:hidden text-[10px]">Players</span>
                </Button>
              )}
              <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4 sm:w-4 sm:h-4" />} className="sm:flex-1 !px-0 sm:!px-3 justify-center" onClick={() => setShowEditModal(true)}>
                <span className="hidden sm:inline">Edit League</span>
                <span className="sm:hidden text-[10px]">Edit</span>
              </Button>
              {onEndLeague && league.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<CheckCircle className="w-4 h-4 sm:w-4 sm:h-4" />}
                  className="sm:flex-1 !px-0 sm:!px-3 justify-center"
                  onClick={onEndLeague}
                >
                  <span className="hidden sm:inline">End League</span>
                  <span className="sm:hidden text-[10px]">End</span>
                </Button>
              )}
            </div>
          )}

          {/* Delete League Section */}
          <div className={(onAddPlayers || onEndLeague) ? 'mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-light-300 dark:border-white/10' : ''}>
            <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-1.5 sm:mb-2">Danger Zone</p>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteModal(true)}
              className="w-full"
            >
              Delete League
            </Button>
          </div>
        </Card>
      )}

      {/* Edit League Modal */}
      <EditLeagueModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        league={league}
      />

      {/* Delete League Modal */}
      <DeleteLeagueModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        league={league}
      />
    </div>
  );
}
