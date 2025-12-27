/**
 * Point Adjustment Modal
 *
 * Allows admins to manually adjust team points for rule violations or bonuses
 */

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Plus, Minus } from 'lucide-react';
import Button from '../ui/Button';

interface PointAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjustment: number, reason: string) => Promise<void>;
  teamName: string;
  currentPoints: number;
}

export default function PointAdjustmentModal({
  isOpen,
  onClose,
  onSubmit,
  teamName,
  currentPoints,
}: PointAdjustmentModalProps) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adjustment === 0) {
      setError('Please enter a point adjustment');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(adjustment, reason.trim());

      // Reset and close
      setAdjustment(0);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust points');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newPoints = currentPoints + adjustment;

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-light-200 dark:bg-dark-200 border-2 border-cyber-500/30 rounded-tech-lg w-full max-w-md p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-light-900 dark:text-white">Adjust Points</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Team Info */}
              <div className="bg-cyber-500/10 border border-cyber-500/30 rounded-lg p-4 mb-6">
                <div className="text-sm text-light-600 dark:text-gray-400 mb-1">Team</div>
                <div className="text-lg font-bold text-light-900 dark:text-white">{teamName}</div>
                <div className="text-sm text-light-600 dark:text-gray-400 mt-2">
                  Current Points: <span className="text-cyber-400 font-bold">{currentPoints}</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Point Adjustment */}
                <div>
                  <label className="block text-sm font-semibold text-light-700 dark:text-gray-300 mb-3">
                    Point Adjustment <span className="text-red-400">*</span>
                  </label>

                  {/* Quick Buttons */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[-3, -2, -1, +1, +2, +3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAdjustment(val)}
                        className={`
                          px-3 py-2 rounded-lg font-bold text-sm transition-all
                          ${adjustment === val
                            ? val < 0
                              ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
                              : 'bg-green-500/20 border-2 border-green-500/50 text-green-400'
                            : 'bg-gray-800/50 border border-black/10 dark:border-white/10 text-light-600 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20'
                          }
                        `}
                      >
                        {val > 0 ? '+' : ''}{val}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                      placeholder="Custom adjustment"
                      className="
                        flex-1 px-4 py-3
                        bg-gray-900/50 border-2 border-black/10 dark:border-white/10
                        focus:border-cyber-500/50
                        rounded-lg
                        text-light-900 dark:text-white text-center font-bold text-lg
                        focus:outline-none
                        transition-colors
                      "
                    />
                    <div className={`
                      px-4 py-3 rounded-lg font-bold text-lg
                      ${adjustment > 0 ? 'bg-green-500/20 text-green-400' :
                        adjustment < 0 ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-800/50 text-gray-400'}
                    `}>
                      New: {newPoints}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Unsportsmanlike conduct, Fair play bonus, Manual correction..."
                    rows={3}
                    className="
                      w-full px-4 py-3
                      bg-gray-900/50 border-2 border-black/10 dark:border-white/10
                      focus:border-cyber-500/50
                      rounded-lg
                      text-light-900 dark:text-white placeholder-gray-500
                      focus:outline-none
                      transition-colors
                      resize-none
                    "
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-sm text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || adjustment === 0 || !reason.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Applying...' : 'Apply Adjustment'}
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
