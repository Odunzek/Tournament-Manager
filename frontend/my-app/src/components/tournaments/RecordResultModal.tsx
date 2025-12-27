/**
 * Record Result Modal Component
 *
 * Modal dialog for recording or editing match results.
 * Used for both group stage and knockout matches.
 *
 * @component
 * @features
 * - Score input with validation
 * - Optional notes field
 * - Edit mode support (pre-fill scores)
 * - Loading state during submission
 * - Cyber-themed UI
 */

"use client";

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface RecordResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (homeScore: number, awayScore: number) => Promise<void>;
  homeTeam: string;
  awayTeam: string;
  initialHomeScore?: number;
  initialAwayScore?: number;
  title?: string;
}

export default function RecordResultModal({
  isOpen,
  onClose,
  onSubmit,
  homeTeam,
  awayTeam,
  initialHomeScore,
  initialAwayScore,
  title = 'Record Match Result',
}: RecordResultModalProps) {
  const [homeScore, setHomeScore] = useState<string>(initialHomeScore?.toString() || '');
  const [awayScore, setAwayScore] = useState<string>(initialAwayScore?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update scores when initial values change (for edit mode)
  useEffect(() => {
    if (initialHomeScore !== undefined) setHomeScore(initialHomeScore.toString());
    if (initialAwayScore !== undefined) setAwayScore(initialAwayScore.toString());
  }, [initialHomeScore, initialAwayScore]);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    setError('');

    // Validate scores
    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      setError('Please enter valid scores');
      return;
    }

    if (homeScoreNum < 0 || awayScoreNum < 0) {
      setError('Scores cannot be negative');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(homeScoreNum, awayScoreNum);
      handleClose();
    } catch (err) {
      console.error('Error submitting result:', err);
      setError('Failed to record result. Please try again.');
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form and close modal
   */
  const handleClose = () => {
    setHomeScore('');
    setAwayScore('');
    setError('');
    setIsSubmitting(false);
    onClose();
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
              className="bg-light-100 dark:bg-dark-100 rounded-tech-lg border border-black/10 dark:border-white/10 shadow-glow max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-black/10 dark:border-white/10 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-light-900 dark:text-white">{title}</h3>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-tech p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Match Info */}
                <div className="text-center p-4 bg-light-200/50 dark:bg-dark-200/50 rounded-tech border border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-lg font-bold text-light-900 dark:text-white">{homeTeam}</span>
                    <span className="text-light-600 dark:text-gray-500 font-semibold">vs</span>
                    <span className="text-lg font-bold text-light-900 dark:text-white">{awayTeam}</span>
                  </div>
                </div>

                {/* Score Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-700 dark:text-gray-300 mb-2 text-center">
                      {homeTeam}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="text-center text-3xl font-bold"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-700 dark:text-gray-300 mb-2 text-center">
                      {awayTeam}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="text-center text-3xl font-bold"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-black/10 dark:border-white/10 p-6 flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  leftIcon={<Save className="w-4 h-4" />}
                  glow
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Result'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
