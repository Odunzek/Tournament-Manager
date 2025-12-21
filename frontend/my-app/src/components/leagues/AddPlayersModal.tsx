"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { Player } from '@/types/player';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface AddPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerIds: string[]) => Promise<void>;
  players: Player[];
  currentPlayerIds: string[];
}

export default function AddPlayersModal({
  isOpen,
  onClose,
  onSubmit,
  players,
  currentPlayerIds,
}: AddPlayersModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Filter out players already in the league
  const availablePlayers = players.filter(
    (player) => !currentPlayerIds.includes(player.id!)
  );

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlayerIds.length === 0) {
      setError('Please select at least one player to add');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedPlayerIds);
      // Reset and close
      setSelectedPlayerIds([]);
      setError('');
      onClose();
    } catch (error) {
      console.error('Error adding players:', error);
      setError('Failed to add players. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setError('');
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg my-8"
            >
              <Card variant="glass" className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-cyber-400" />
                    <h2 className="text-2xl font-bold text-white">Add Players to League</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Player Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Select Players to Add
                    </label>

                    {availablePlayers.length > 0 ? (
                      <>
                        <div className="max-h-96 overflow-y-auto bg-dark-100 border-2 border-white/10 rounded-xl p-4">
                          <div className="space-y-2">
                            {availablePlayers.map((player) => (
                              <label
                                key={player.id}
                                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-tech cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPlayerIds.includes(player.id!)}
                                  onChange={() => togglePlayer(player.id!)}
                                  className="w-5 h-5 rounded-lg border-2 border-white/20 bg-dark-100 text-cyber-500 focus:ring-cyber-500 focus:ring-offset-0 focus:ring-2"
                                />
                                <div className="flex-1">
                                  <span className="text-white font-medium block">{player.name}</span>
                                  <span className="text-gray-400 text-sm">@{player.psnId}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {selectedPlayerIds.length} player(s) selected
                        </p>
                      </>
                    ) : (
                      <div className="bg-dark-100 border-2 border-white/10 rounded-xl p-8 text-center">
                        <p className="text-gray-400">
                          All available players are already in this league
                        </p>
                      </div>
                    )}

                    {error && (
                      <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-cyber-500/10 border border-cyber-500/30 rounded-xl">
                    <p className="text-sm text-gray-300">
                      Adding players will automatically recalculate the total number of matches for this league.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || availablePlayers.length === 0}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Players'}
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
