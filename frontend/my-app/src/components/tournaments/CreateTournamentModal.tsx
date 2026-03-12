/**
 * CreateTournamentModal Component
 *
 * Modal dialog for creating new tournaments (Admin-only feature).
 * Allows configuration of tournament type, settings, and initial parameters.
 *
 * @component
 * @features
 * - Tournament name and type selection
 * - Max teams configuration
 * - Tournament settings (points system, knockout rules)
 * - Date range selection
 * - Form validation
 * - Firebase integration for tournament creation
 *
 * @requires Admin authentication to display
 */

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Calendar, Users, Settings, Search, Check } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { createTournament, addMemberToTournament, DEFAULT_CHAMPIONS_LEAGUE_SETTINGS, DEFAULT_KNOCKOUT_SETTINGS, DEFAULT_CUSTOM_SETTINGS } from '@/lib/tournamentUtils';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { usePlayers } from '@/hooks/usePlayers';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Tournament type options
const tournamentTypes = [
  { value: 'champions_league', label: 'Champions League', description: 'Groups + Knockout format' },
  { value: 'knockout', label: 'Knockout Only', description: 'Direct elimination' },
  { value: 'league', label: 'League', description: 'Round-robin format' },
  { value: 'custom', label: 'Custom', description: 'Customizable settings' },
] as const;

export default function CreateTournamentModal({ isOpen, onClose, onSuccess }: CreateTournamentModalProps) {
  const { activeSeason, loading: seasonLoading } = useActiveSeason();
  const { players } = usePlayers();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'champions_league' | 'knockout' | 'league' | 'custom'>('champions_league');
  const [maxTeams, setMaxTeams] = useState(32);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rules, setRules] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  /**
   * Handle form submission
   * Creates tournament in Firebase with selected settings
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }

    if (maxTeams < 4) {
      setError('Minimum 4 teams required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine settings based on tournament type
      let settings;
      switch (type) {
        case 'champions_league':
          settings = DEFAULT_CHAMPIONS_LEAGUE_SETTINGS;
          break;
        case 'knockout':
          settings = DEFAULT_KNOCKOUT_SETTINGS;
          break;
        case 'custom':
          settings = DEFAULT_CUSTOM_SETTINGS;
          break;
        default:
          settings = DEFAULT_CUSTOM_SETTINGS;
      }

      // Create tournament in Firebase
      const tournamentId = await createTournament({
        name: name.trim(),
        type,
        status: 'setup',
        seasonId: activeSeason?.id,
        maxTeams,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        settings,
        rules: rules.trim() || undefined,
      });

      // Add selected players as tournament members
      if (tournamentId && selectedPlayerIds.length > 0) {
        const selectedPlayers = players.filter((p) => p.id && selectedPlayerIds.includes(p.id));
        await Promise.all(
          selectedPlayers.map((player) =>
            addMemberToTournament(tournamentId, {
              name: player.name,
              psnId: player.psnId,
            })
          )
        );
      }

      // Reset form and close modal
      setName('');
      setType('champions_league');
      setMaxTeams(32);
      setStartDate('');
      setEndDate('');
      setRules('');
      setSelectedPlayerIds([]);
      setPlayerSearch('');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError('Failed to create tournament. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   * Resets form state
   */
  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-light-100 dark:bg-dark-100 rounded-tech-lg border border-black/10 dark:border-white/10 shadow-glow max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-light-100/95 dark:bg-dark-100/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-cyber flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-light-900 dark:text-white">Create Tournament</h2>
                    <p className="text-sm text-light-600 dark:text-gray-400">Set up a new tournament</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Guard: no active season */}
                {!seasonLoading && !activeSeason ? (
                  <div className="text-center py-10 space-y-3">
                    <Trophy className="w-12 h-12 text-gray-500 mx-auto" />
                    <p className="font-semibold text-light-900 dark:text-white">No Active Season</p>
                    <p className="text-sm text-light-600 dark:text-gray-400">
                      Create and activate a season before adding a tournament.
                    </p>
                  </div>
                ) : (
                <>
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-tech p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Active Season Badge */}
                {activeSeason && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-cyber-500/10 border border-cyber-500/30 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-light-700 dark:text-gray-300">
                      Auto-assigning to season:
                    </span>
                    <span className="text-sm font-bold text-cyber-600 dark:text-cyber-400">
                      {activeSeason.name}
                    </span>
                  </div>
                )}

                {/* Tournament Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-light-900 dark:text-white">
                    Tournament Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Champions League 2025"
                    leftIcon={<Trophy className="w-4 h-4" />}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Tournament Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-light-900 dark:text-white">
                    Tournament Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {tournamentTypes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value)}
                        disabled={isSubmitting}
                        className={`
                          p-4 rounded-tech border-2 text-left transition-all
                          ${type === option.value
                            ? 'border-cyber-500 bg-cyber-500/10'
                            : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <div className="font-semibold text-light-900 dark:text-white mb-1">{option.label}</div>
                        <div className="text-xs text-light-600 dark:text-gray-400">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Teams */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-light-900 dark:text-white">
                    Maximum Teams <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="number"
                    min="4"
                    max="64"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(parseInt(e.target.value) || 4)}
                    leftIcon={<Users className="w-4 h-4" />}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-light-600 dark:text-gray-400">Minimum: 4 teams, Maximum: 64 teams</p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-light-900 dark:text-white">
                      Start Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      leftIcon={<Calendar className="w-4 h-4" />}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-light-900 dark:text-white">
                      End Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      leftIcon={<Calendar className="w-4 h-4" />}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Tournament Rules */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-light-900 dark:text-white">
                    Tournament Rules (Optional)
                  </label>
                  <textarea
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="e.g., No rage-quitting. Results must be submitted within 24 hours..."
                    rows={4}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-light-50 dark:bg-dark-100/50 backdrop-blur-sm border-2 border-cyber-500/25 dark:border-white/10 rounded-tech text-light-900 dark:text-gray-100 placeholder-light-500 dark:placeholder-gray-500 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20 transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-light-600 dark:text-gray-400">Line breaks will be preserved when displayed.</p>
                </div>

                {/* Settings Preview */}
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-tech p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-cyber-400" />
                    <span className="text-sm font-semibold text-light-900 dark:text-white">Tournament Settings</span>
                  </div>
                  <div className="text-xs text-light-600 dark:text-gray-400 space-y-1">
                    <div>• Group Size: {type === 'champions_league' || type === 'custom' ? '4 teams' : 'N/A'}</div>
                    <div>• Points: Win = 3, Draw = 1, Loss = 0</div>
                    {(type === 'champions_league' || type === 'knockout') && (
                      <>
                        <div>• Knockout Stage: Yes</div>
                        <div>• Extra Time & Penalties: Yes</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Player Selection */}
                <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-light-700 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyber-400" />
                      Players (Optional)
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      selectedPlayerIds.length > 0
                        ? 'text-green-400 bg-green-500/10 border-green-500/30'
                        : 'text-light-500 dark:text-gray-500 bg-light-200/50 dark:bg-dark-200/50 border-transparent'
                    }`}>
                      {selectedPlayerIds.length} selected
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-light-500 dark:text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search players..."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-light-100 dark:bg-dark-100 border border-black/10 dark:border-white/10 rounded-xl text-light-900 dark:text-white placeholder-light-500 dark:placeholder-gray-500 focus:outline-none focus:border-cyber-500/50"
                    />
                  </div>

                  {/* Player list */}
                  {players.length > 0 ? (
                    <div className="max-h-44 overflow-y-auto custom-scrollbar rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                      {players
                        .filter((p) =>
                          p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
                          p.psnId.toLowerCase().includes(playerSearch.toLowerCase())
                        )
                        .map((player) => {
                          const selected = selectedPlayerIds.includes(player.id!);
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => togglePlayer(player.id!)}
                              disabled={isSubmitting}
                              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                                selected
                                  ? 'bg-cyber-500/10'
                                  : 'bg-light-50 dark:bg-dark-50 hover:bg-light-100 dark:hover:bg-dark-100'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-light-900 dark:text-white block truncate">{player.name}</span>
                                <span className="text-[10px] text-light-500 dark:text-gray-500">@{player.psnId}</span>
                              </div>
                              {selected && <Check className="w-3.5 h-3.5 text-cyber-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-xs text-light-500 dark:text-gray-500 text-center py-3">
                      No players available. Add players first.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || seasonLoading}
                    glow
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Tournament'}
                  </Button>
                </div>
                </>)}
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
