"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-light-100 dark:bg-dark-200 border-2 border-cyber-500/20 dark:border-cyber-500/30 rounded-2xl w-full max-w-sm p-4 sm:p-5 backdrop-blur-xl">
              {/* Header — inline with team info */}
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-light-900 dark:text-white truncate">Adjust Points</h3>
                  <div className="flex items-center gap-2 text-xs text-light-600 dark:text-gray-400">
                    <span className="truncate">{teamName}</span>
                    <span>·</span>
                    <span className="text-cyber-400 font-bold">{currentPoints} pts</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-light-500 dark:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Quick Buttons — 6 cols */}
                <div className="grid grid-cols-6 gap-1.5">
                  {[-3, -2, -1, +1, +2, +3].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustment(val)}
                      className={`
                        py-2 rounded-lg font-bold text-sm transition-all
                        ${adjustment === val
                          ? val < 0
                            ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                            : 'bg-green-500/20 border border-green-500/50 text-green-400'
                          : 'bg-light-200/80 dark:bg-white/5 border border-black/5 dark:border-white/10 text-light-600 dark:text-gray-400 hover:border-cyber-500/30'
                        }
                      `}
                    >
                      {val > 0 ? '+' : ''}{val}
                    </button>
                  ))}
                </div>

                {/* Custom input + preview */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={adjustment}
                    onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                    placeholder="Custom"
                    className="
                      flex-1 px-3 py-2
                      bg-light-200/80 dark:bg-white/5 border border-black/10 dark:border-white/10
                      focus:border-cyber-500/50
                      rounded-lg
                      text-light-900 dark:text-white text-center font-bold text-base
                      focus:outline-none
                      transition-colors
                    "
                  />
                  <div className={`
                    px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap
                    ${adjustment > 0 ? 'bg-green-500/10 text-green-400' :
                      adjustment < 0 ? 'bg-red-500/10 text-red-400' :
                      'bg-light-200/80 dark:bg-white/5 text-light-500 dark:text-gray-500'}
                  `}>
                    → {newPoints}
                  </div>
                </div>

                {/* Reason */}
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (e.g., Unsportsmanlike conduct, Fair play bonus...)"
                  rows={2}
                  className="
                    w-full px-3 py-2
                    bg-light-200/80 dark:bg-white/5 border border-black/10 dark:border-white/10
                    focus:border-cyber-500/50
                    rounded-lg
                    text-sm text-light-900 dark:text-white placeholder-gray-500
                    focus:outline-none
                    transition-colors
                    resize-none
                  "
                />

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2 text-xs text-red-400"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || adjustment === 0 || !reason.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Applying...' : 'Apply'}
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
