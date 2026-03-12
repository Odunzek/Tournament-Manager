"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Trophy, Award, Save, Link } from 'lucide-react';
import { Player, PlayerFormData } from '@/types/player';
import { Season } from '@/types/season';
import { getAllSeasons } from '@/lib/seasonUtils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlayerFormData & {
    achievements?: { leagueWins: number; tournamentWins: number };
    selectedSeasonId?: string;
  }) => void;
  player?: Player | null;
  mode: 'add' | 'edit';
}

export default function PlayerFormModal({
  isOpen,
  onClose,
  onSubmit,
  player,
  mode,
}: PlayerFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    psnId: '',
    avatar: '',
    leagueWins: 0,
    tournamentWins: 0,
  });

  const [errors, setErrors] = useState<{ name?: string; psnId?: string }>({});
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  useEffect(() => {
    if (player && mode === 'edit') {
      // Only set profile fields here; win counts are set by the seasons effect below
      setFormData(prev => ({
        ...prev,
        name: player.name,
        psnId: player.psnId,
        avatar: player.avatar || '',
      }));
    } else {
      setFormData({ name: '', psnId: '', avatar: '', leagueWins: 0, tournamentWins: 0 });
    }
    setErrors({});
  }, [player, mode, isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== 'edit') return;
    getAllSeasons()
      .then((all) => {
        setSeasons(all);
        if (all.length > 0) {
          const firstId = all[0].id!;
          setSelectedSeasonId(firstId);
          const ach = player?.seasonAchievements?.[firstId];
          setFormData(prev => ({
            ...prev,
            leagueWins: ach?.leagueWins ?? 0,
            tournamentWins: ach?.tournamentWins ?? 0,
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to load seasons for achievement editor:', err);
      });
  }, [isOpen, mode, player]);

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    const ach = player?.seasonAchievements?.[seasonId];
    setFormData(prev => ({
      ...prev,
      leagueWins: ach?.leagueWins ?? 0,
      tournamentWins: ach?.tournamentWins ?? 0,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (formData.psnId.trim()) {
      if (formData.psnId.length < 3) {
        newErrors.psnId = 'PSN ID must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.psnId)) {
        newErrors.psnId = 'Letters, numbers, hyphens and underscores only';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({
      name: formData.name.trim(),
      psnId: formData.psnId.trim().toLowerCase() || 'player',
      avatar: formData.avatar.trim() || undefined,
      achievements: {
        leagueWins: formData.leagueWins,
        tournamentWins: formData.tournamentWins,
      },
      selectedSeasonId: selectedSeasonId || undefined,
    });
    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const totalTitles = formData.leagueWins + formData.tournamentWins;

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

          {/* Modal — slides up from bottom on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <div className="bg-light-50 dark:bg-dark-50 border border-black/10 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyber-400" />
                  <h2 className="text-base font-bold text-light-900 dark:text-white">
                    {mode === 'add' ? 'Add New Player' : 'Edit Player'}
                  </h2>
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

                {/* Player Info */}
                <div className="space-y-3">
                  <Input
                    label="Player Name *"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter player name"
                    error={errors.name}
                    leftIcon={<User className="w-4 h-4" />}
                  />

                  <Input
                    label="PSN ID (optional)"
                    value={formData.psnId}
                    onChange={(e) => handleChange('psnId', e.target.value)}
                    placeholder="e.g. player_123"
                    error={errors.psnId}
                  />

                  <Input
                    label="Avatar URL (optional)"
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => handleChange('avatar', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    leftIcon={<Link className="w-4 h-4" />}
                  />
                </div>

                {/* Achievements */}
                <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-3">
                  <p className="text-xs font-bold text-light-700 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    Achievements
                  </p>

                  {mode === 'edit' && seasons.length > 0 && (
                    <div className="mb-2">
                      <label className="text-xs text-light-600 dark:text-gray-400 mb-1 block">Season</label>
                      <select
                        value={selectedSeasonId}
                        onChange={e => handleSeasonChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-light-100 dark:bg-dark-100
                                   border border-black/10 dark:border-white/10
                                   text-light-900 dark:text-white focus:outline-none focus:border-cyber-500/50"
                      >
                        {seasons.map(s => (
                          <option key={s.id} value={s.id!}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="League Wins"
                      type="number"
                      min={0}
                      value={formData.leagueWins}
                      onChange={(e) => handleChange('leagueWins', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      label="Tournament Wins"
                      type="number"
                      min={0}
                      value={formData.tournamentWins}
                      onChange={(e) => handleChange('tournamentWins', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  {/* Total titles preview */}
                  <div className="flex items-center justify-between px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <span className="text-sm text-light-700 dark:text-gray-300 font-medium">Total Titles</span>
                    <div className="flex items-center gap-2">
                      {totalTitles >= 1 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1 text-xs text-yellow-500 font-semibold"
                        >
                          <Award className="w-3.5 h-3.5" />
                          HOF
                        </motion.span>
                      )}
                      <span className="text-lg font-black text-yellow-400">{totalTitles}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1 pb-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    leftIcon={<Save className="w-4 h-4" />}
                    glow
                  >
                    {mode === 'add' ? 'Add Player' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
