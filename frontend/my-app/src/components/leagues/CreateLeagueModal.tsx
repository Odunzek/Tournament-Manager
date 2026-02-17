"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Calendar, Users } from 'lucide-react';
import { Player } from '@/types/player';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useActiveSeason } from '@/hooks/useActiveSeason';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    season: string;
    seasonId?: string;
    status: 'active' | 'upcoming' | 'completed';
    startDate: string;
    endDate: string;
    playerIds: string[];
  }) => Promise<void>;
  players: Player[];
}

export default function CreateLeagueModal({
  isOpen,
  onClose,
  onSubmit,
  players,
}: CreateLeagueModalProps) {
  const { activeSeason } = useActiveSeason();
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    seasonId: undefined as string | undefined,
    status: 'upcoming' as 'active' | 'upcoming' | 'completed',
    startDate: '',
    endDate: '',
    playerIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill season info from active season
  useEffect(() => {
    if (activeSeason) {
      setFormData((prev) => ({
        ...prev,
        season: prev.season || activeSeason.name,
        seasonId: activeSeason.id,
      }));
    }
  }, [activeSeason]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const togglePlayer = (playerId: string) => {
    const currentIds = formData.playerIds;
    if (currentIds.includes(playerId)) {
      handleChange('playerIds', currentIds.filter(id => id !== playerId));
    } else {
      handleChange('playerIds', [...currentIds, playerId]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    }

    if (!formData.season.trim()) {
      newErrors.season = 'Season is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.playerIds.length < 2) {
      newErrors.playerIds = 'At least 2 players are required';
    }

    if (formData.endDate && formData.startDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        season: activeSeason?.name || '',
        seasonId: activeSeason?.id,
        status: 'upcoming',
        startDate: '',
        endDate: '',
        playerIds: [],
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating league:', error);
      setErrors({ submit: 'Failed to create league. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl my-8"
            >
              <Card variant="glass" className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-cyber-400" />
                    <h2 className="text-2xl font-bold text-light-900 dark:text-white">Create New League</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-light-600 dark:text-gray-400 hover:text-light-900 dark:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Active Season Badge */}
                  {activeSeason ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-cyber-500/10 border border-cyber-500/30 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm text-light-700 dark:text-gray-300">
                        Auto-assigning to season:
                      </span>
                      <span className="text-sm font-bold text-cyber-600 dark:text-cyber-400">
                        {activeSeason.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-sm text-amber-400">
                        No active season — this league won&apos;t be linked to any season. Achievements won&apos;t be tracked per-season.
                      </span>
                    </div>
                  )}

                  {/* League Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      League Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Premier League Season 1"
                      className={`w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                        errors.name ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                      } rounded-xl text-light-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors`}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Season */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Season *
                    </label>
                    <input
                      type="text"
                      value={formData.season}
                      onChange={(e) => handleChange('season', e.target.value)}
                      placeholder="e.g., 2024 Spring"
                      className={`w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                        errors.season ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                      } rounded-xl text-light-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors`}
                    />
                    {errors.season && (
                      <p className="text-red-400 text-sm mt-1">{errors.season}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Status
                    </label>
                    <div className="flex gap-3">
                      {(['upcoming', 'active'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleChange('status', status)}
                          className={`flex-1 px-4 py-3 rounded-tech font-semibold transition-all ${
                            formData.status === status
                              ? 'bg-gradient-to-r from-cyber-500 to-electric-500 text-light-900 dark:text-white'
                              : 'bg-light-100 dark:bg-dark-100 text-light-600 dark:text-gray-400 hover:text-light-900 dark:text-white border-2 border-black/10 dark:border-white/10'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className={`w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                          errors.startDate ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                        } rounded-xl text-light-900 dark:text-white focus:outline-none focus:border-cyber-500/50 transition-colors`}
                      />
                      {errors.startDate && (
                        <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className={`w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                          errors.endDate ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                        } rounded-xl text-light-900 dark:text-white focus:outline-none focus:border-cyber-500/50 transition-colors`}
                      />
                      {errors.endDate && (
                        <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Player Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Select Players * (Minimum 2)
                    </label>
                    <div className="max-h-64 overflow-y-auto bg-light-100 dark:bg-dark-100 border-2 border-black/10 dark:border-white/10 rounded-xl p-4">
                      {players.length > 0 ? (
                        <div className="space-y-2">
                          {players.map((player) => (
                            <label
                              key={player.id}
                              className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-tech cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.playerIds.includes(player.id!)}
                                onChange={() => togglePlayer(player.id!)}
                                className="w-5 h-5 rounded-lg border-2 border-white/20 bg-light-100 dark:bg-dark-100 text-cyber-500 focus:ring-cyber-500 focus:ring-offset-0 focus:ring-2"
                              />
                              <span className="text-light-900 dark:text-white font-medium">{player.name}</span>
                              <span className="text-light-600 dark:text-gray-400 text-sm">@{player.psnId}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-light-600 dark:text-gray-400 text-center py-4">
                          No players available. Please add players first.
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-light-600 dark:text-gray-400 mt-2">
                      {formData.playerIds.length} player(s) selected
                    </p>
                    {errors.playerIds && (
                      <p className="text-red-400 text-sm mt-1">{errors.playerIds}</p>
                    )}
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-400 text-sm">{errors.submit}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Creating...' : 'Create League'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
