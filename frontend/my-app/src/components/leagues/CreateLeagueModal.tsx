"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Calendar, Users, Search, Check } from 'lucide-react';
import { Player } from '@/types/player';
import Input from '../ui/Input';
import Button from '../ui/Button';
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
  const { activeSeason, loading: seasonLoading } = useActiveSeason();
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
  const [playerSearch, setPlayerSearch] = useState('');

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
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const togglePlayer = (playerId: string) => {
    const currentIds = formData.playerIds;
    if (currentIds.includes(playerId)) {
      handleChange('playerIds', currentIds.filter((id) => id !== playerId));
    } else {
      handleChange('playerIds', [...currentIds, playerId]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'League name is required';
    if (!formData.season.trim()) newErrors.season = 'Season is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (formData.playerIds.length < 2) newErrors.playerIds = 'Select at least 2 players';
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
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal — slide up on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <div className="bg-light-50 dark:bg-dark-50 border border-black/10 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cyber-400" />
                  <h2 className="text-base font-bold text-light-900 dark:text-white">Create New League</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-light-600 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

                {/* Guard: no active season */}
                {!seasonLoading && !activeSeason ? (
                  <div className="text-center py-10 space-y-3">
                    <Trophy className="w-12 h-12 text-gray-500 mx-auto" />
                    <p className="font-semibold text-light-900 dark:text-white">No Active Season</p>
                    <p className="text-sm text-light-600 dark:text-gray-400">
                      Create and activate a season before adding a league.
                    </p>
                  </div>
                ) : (
                <>
                {/* Active Season badge */}
                {activeSeason && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-cyber-500/10 border border-cyber-500/30 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                    <span className="text-xs text-light-700 dark:text-gray-300">Season:</span>
                    <span className="text-xs font-bold text-cyber-600 dark:text-cyber-400 truncate">{activeSeason.name}</span>
                  </div>
                )}

                {/* League Name */}
                <Input
                  label="League Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Premier League Season 1"
                  error={errors.name}
                  leftIcon={<Trophy className="w-4 h-4" />}
                />

                {/* Season */}
                <Input
                  label="Season *"
                  value={formData.season}
                  onChange={(e) => handleChange('season', e.target.value)}
                  placeholder="e.g. 2024 Spring"
                  error={errors.season}
                />

                {/* Status */}
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-gray-300 mb-2">Status</p>
                  <div className="flex gap-2">
                    {(['upcoming', 'active'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleChange('status', status)}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          formData.status === status
                            ? 'bg-cyber-500/20 text-cyber-400 border-cyber-500/40'
                            : 'bg-light-100 dark:bg-dark-100 text-light-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:text-light-900 dark:hover:text-white'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Date *"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    error={errors.startDate}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    error={errors.endDate}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>

                {/* Player Selection */}
                <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-light-700 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyber-400" />
                      Players *
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      formData.playerIds.length >= 2
                        ? 'text-green-400 bg-green-500/10 border-green-500/30'
                        : 'text-light-500 dark:text-gray-500 bg-light-200/50 dark:bg-dark-200/50 border-transparent'
                    }`}>
                      {formData.playerIds.length} selected
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
                          const selected = formData.playerIds.includes(player.id!);
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => togglePlayer(player.id!)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
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

                  {errors.playerIds && (
                    <p className="text-red-400 text-xs">{errors.playerIds}</p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-xs">{errors.submit}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pb-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting} disabled={isSubmitting || seasonLoading} glow>
                    {isSubmitting ? 'Creating...' : 'Create League'}
                  </Button>
                </div>
                </>)}
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
