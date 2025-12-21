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
import { X, Trophy, Calendar, Users, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { createTournament, DEFAULT_CHAMPIONS_LEAGUE_SETTINGS, DEFAULT_KNOCKOUT_SETTINGS, DEFAULT_CUSTOM_SETTINGS } from '@/lib/tournamentUtils';

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
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'champions_league' | 'knockout' | 'league' | 'custom'>('champions_league');
  const [maxTeams, setMaxTeams] = useState(32);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      await createTournament({
        name: name.trim(),
        type,
        status: 'setup',
        maxTeams,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        settings,
      });

      // Reset form and close modal
      setName('');
      setType('champions_league');
      setMaxTeams(32);
      setStartDate('');
      setEndDate('');

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
              className="bg-dark-100 rounded-tech-lg border border-white/10 shadow-glow max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-dark-100/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-cyber flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create Tournament</h2>
                    <p className="text-sm text-gray-400">Set up a new tournament</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-tech p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Tournament Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
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
                  <label className="block text-sm font-semibold text-white">
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
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <div className="font-semibold text-white mb-1">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Teams */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
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
                  <p className="text-xs text-gray-400">Minimum: 4 teams, Maximum: 64 teams</p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
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
                    <label className="block text-sm font-semibold text-white">
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

                {/* Settings Preview */}
                <div className="bg-white/5 border border-white/10 rounded-tech p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-cyber-400" />
                    <span className="text-sm font-semibold text-white">Tournament Settings</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
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
                    glow
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Tournament'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
