/**
 * Point Adjustment History Modal
 *
 * Displays the history of point adjustments for a team
 */

"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Plus, Minus, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { PointAdjustment, convertTimestamp } from '@/lib/tournamentUtils';

interface PointAdjustmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  adjustments: PointAdjustment[];
}

export default function PointAdjustmentHistoryModal({
  isOpen,
  onClose,
  teamName,
  adjustments,
}: PointAdjustmentHistoryModalProps) {
  // Calculate total adjustment
  const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  // Sort by timestamp (newest first)
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-light-200 dark:bg-dark-200 border-2 border-cyber-500/30 rounded-tech-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-light-900 dark:text-white">Point Adjustments</h3>
                  <p className="text-sm text-light-600 dark:text-gray-400 mt-1">{teamName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total Summary */}
              <div className={`mx-6 mt-6 p-4 rounded-lg border-2 ${
                totalAdjustment > 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : totalAdjustment < 0
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-gray-500/10 border-gray-500/30'
              }`}>
                <div className="text-sm text-light-600 dark:text-gray-400 mb-1">Total Adjustment</div>
                <div className={`text-3xl font-bold ${
                  totalAdjustment > 0
                    ? 'text-green-400'
                    : totalAdjustment < 0
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}>
                  {totalAdjustment > 0 ? '+' : ''}{totalAdjustment} pts
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {adjustments.length} {adjustments.length === 1 ? 'adjustment' : 'adjustments'}
                </div>
              </div>

              {/* Adjustment History */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {sortedAdjustments.map((adjustment) => {
                    const date = convertTimestamp(adjustment.timestamp);

                    return (
                      <motion.div
                        key={adjustment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border-2 ${
                          adjustment.amount > 0
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        {/* Amount & Date */}
                        <div className="flex items-start justify-between mb-2">
                          <div className={`flex items-center gap-2 font-bold text-lg ${
                            adjustment.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {adjustment.amount > 0 ? (
                              <Plus className="w-5 h-5" />
                            ) : (
                              <Minus className="w-5 h-5" />
                            )}
                            {adjustment.amount > 0 ? '+' : ''}{adjustment.amount} pts
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <div className="text-right">
                              <div>{date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</div>
                              <div className="text-[10px]">{date.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}</div>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="text-sm text-light-700 dark:text-gray-300 bg-light-100/30 dark:bg-dark-100/30 rounded p-2">
                          {adjustment.reason}
                        </div>

                        {/* Adjusted By */}
                        <div className="text-xs text-light-600 dark:text-gray-500 mt-2">
                          By {adjustment.adjustedBy}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-black/10 dark:border-white/10">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
