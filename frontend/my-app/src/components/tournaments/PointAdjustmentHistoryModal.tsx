/**
 * PointAdjustmentHistoryModal
 *
 * A read-only modal that shows the full history of manual point adjustments
 * applied to a specific player/team. Used in both league standings and
 * tournament group standings.
 *
 * Displays:
 *   - A net total banner at the top (e.g., "+3 pts" in green or "-2 pts" in red).
 *   - Each individual adjustment with: Plus/Minus icon, amount, reason, timestamp.
 *   - Adjustments are sorted newest-first so the most recent change is at the top.
 *
 * Opened by clicking the adjustment badge in StandingsTable (both league and tournament).
 * The corresponding write modal is PointAdjustmentModal (separate component).
 */
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Clock } from 'lucide-react';
import { PointAdjustment, convertTimestamp } from '@/lib/tournamentUtils';

interface PointAdjustmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;          // Player/team display name for the modal title
  adjustments: PointAdjustment[]; // All adjustment records to display
}

export default function PointAdjustmentHistoryModal({
  isOpen,
  onClose,
  teamName,
  adjustments,
}: PointAdjustmentHistoryModalProps) {
  /** Net sum of all adjustment amounts (positive = bonus, negative = deduction) */
  const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  /** Sort adjustments newest-first for display */
  const sortedAdjustments = [...adjustments].sort((a, b) => {
    const dateA = convertTimestamp(a.timestamp);
    const dateB = convertTimestamp(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

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
            <div className="bg-light-100 dark:bg-dark-200 border-2 border-cyber-500/20 dark:border-cyber-500/30 rounded-2xl w-full max-w-sm max-h-[75vh] overflow-hidden flex flex-col backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-light-900 dark:text-white">Point Adjustments</h3>
                  <p className="text-xs text-light-600 dark:text-gray-400 truncate">{teamName}</p>
                </div>
                {/* Total badge inline */}
                <div className="flex items-center gap-2">
                  <div className={`
                    px-2 py-1 rounded-lg font-bold text-sm
                    ${totalAdjustment > 0
                      ? 'bg-green-500/10 text-green-400'
                      : totalAdjustment < 0
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-gray-500/10 text-gray-400'}
                  `}>
                    {totalAdjustment > 0 ? '+' : ''}{totalAdjustment}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-light-500 dark:text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Adjustment List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4">
                <div className="space-y-2">
                  {sortedAdjustments.map((adjustment) => {
                    const date = convertTimestamp(adjustment.timestamp);

                    return (
                      <motion.div
                        key={adjustment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-2.5 rounded-lg border ${
                          adjustment.amount > 0
                            ? 'bg-green-500/5 border-green-500/15'
                            : 'bg-red-500/5 border-red-500/15'
                        }`}
                      >
                        {/* Amount + Date row */}
                        <div className="flex items-center justify-between mb-1">
                          <div className={`flex items-center gap-1 font-bold text-sm ${
                            adjustment.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {adjustment.amount > 0 ? (
                              <Plus className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                            {adjustment.amount > 0 ? '+' : ''}{adjustment.amount} pts
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-light-500 dark:text-gray-500">
                            <Clock className="w-2.5 h-2.5" />
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' '}
                            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="text-xs text-light-700 dark:text-gray-300">
                          {adjustment.reason}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer — tap to close */}
              <button
                onClick={onClose}
                className="p-3 text-center text-xs font-semibold text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white border-t border-black/5 dark:border-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
