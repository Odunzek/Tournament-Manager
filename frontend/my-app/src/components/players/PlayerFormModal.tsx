"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Trophy, Award, Save, AlertCircle } from 'lucide-react';
import { Player, PlayerFormData } from '@/types/player';

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlayerFormData & { achievements?: { leagueWins: number; tournamentWins: number } }) => void;
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
  const [formData, setFormData] = useState<{
    name: string;
    psnId: string;
    avatar: string;
    leagueWins: number;
    tournamentWins: number;
  }>({
    name: '',
    psnId: '',
    avatar: '',
    leagueWins: 0,
    tournamentWins: 0,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    psnId?: string;
  }>({});

  // Initialize form data when player changes or modal opens
  useEffect(() => {
    if (player && mode === 'edit') {
      setFormData({
        name: player.name,
        psnId: player.psnId,
        avatar: player.avatar || '',
        leagueWins: player.achievements.leagueWins,
        tournamentWins: player.achievements.tournamentWins,
      });
    } else {
      setFormData({
        name: '',
        psnId: '',
        avatar: '',
        leagueWins: 0,
        tournamentWins: 0,
      });
    }
    setErrors({});
  }, [player, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // PSN ID is optional, but if provided, validate format
    if (formData.psnId.trim()) {
      if (formData.psnId.length < 3) {
        newErrors.psnId = 'PSN ID must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.psnId)) {
        newErrors.psnId = 'PSN ID can only contain letters, numbers, hyphens, and underscores';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      psnId: formData.psnId.trim().toLowerCase() || 'player',
      avatar: formData.avatar.trim() || undefined,
      achievements: {
        leagueWins: formData.leagueWins,
        tournamentWins: formData.tournamentWins,
      },
    });

    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-cyber-500/30 rounded-tech-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-b border-white/10 p-6 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-cyber-400" />
                    <h2 className="text-2xl font-bold text-white">
                      {mode === 'add' ? 'Add New Player' : 'Edit Player'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Player Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-cyber-400" />
                    Player Information
                  </h3>

                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Player Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter player name"
                      className={`
                        w-full px-4 py-3
                        bg-gray-900/50 border-2
                        ${errors.name ? 'border-red-500/50' : 'border-white/10 focus:border-cyber-500/50'}
                        rounded-lg
                        text-white placeholder-gray-500
                        focus:outline-none
                        transition-colors
                      `}
                    />
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-400 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  {/* PSN ID Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      PSN ID <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.psnId}
                      onChange={(e) => handleChange('psnId', e.target.value)}
                      placeholder="Enter PSN ID"
                      className={`
                        w-full px-4 py-3
                        bg-gray-900/50 border-2
                        ${errors.psnId ? 'border-red-500/50' : 'border-white/10 focus:border-cyber-500/50'}
                        rounded-lg
                        text-white placeholder-gray-500
                        focus:outline-none
                        transition-colors
                      `}
                    />
                    {errors.psnId && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-400 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.psnId}
                      </motion.p>
                    )}
                  </div>

                  {/* Avatar URL Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Avatar URL <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={formData.avatar}
                      onChange={(e) => handleChange('avatar', e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="
                        w-full px-4 py-3
                        bg-gray-900/50 border-2 border-white/10
                        focus:border-cyber-500/50
                        rounded-lg
                        text-white placeholder-gray-500
                        focus:outline-none
                        transition-colors
                      "
                    />
                  </div>
                </div>

                {/* Achievements Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Achievements
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* League Wins */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        League Wins
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.leagueWins}
                        onChange={(e) => handleChange('leagueWins', parseInt(e.target.value) || 0)}
                        className="
                          w-full px-4 py-3
                          bg-gray-900/50 border-2 border-white/10
                          focus:border-cyber-500/50
                          rounded-lg
                          text-white
                          focus:outline-none
                          transition-colors
                        "
                      />
                    </div>

                    {/* Tournament Wins */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Tournament Wins
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tournamentWins}
                        onChange={(e) => handleChange('tournamentWins', parseInt(e.target.value) || 0)}
                        className="
                          w-full px-4 py-3
                          bg-gray-900/50 border-2 border-white/10
                          focus:border-electric-500/50
                          rounded-lg
                          text-white
                          focus:outline-none
                          transition-colors
                        "
                      />
                    </div>
                  </div>

                  {/* Total Titles Display */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-semibold">Total Titles:</span>
                      <span className="text-2xl font-bold text-yellow-400">{totalTitles}</span>
                    </div>
                    {totalTitles >= 3 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 flex items-center gap-2 text-sm text-yellow-400"
                      >
                        <Award className="w-4 h-4" />
                        <span>Hall of Fame Eligible!</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="
                      flex-1 px-6 py-3
                      bg-gray-800 hover:bg-gray-700
                      border-2 border-white/10
                      text-white font-bold
                      rounded-lg
                      transition-all duration-300
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="
                      flex-1 px-6 py-3
                      bg-gradient-to-r from-cyber-500 to-electric-500
                      hover:from-cyber-600 hover:to-electric-600
                      text-white font-bold
                      rounded-lg
                      transition-all duration-300
                      hover:shadow-glow
                      flex items-center justify-center gap-2
                    "
                  >
                    <Save className="w-5 h-5" />
                    <span>{mode === 'add' ? 'Add Player' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
