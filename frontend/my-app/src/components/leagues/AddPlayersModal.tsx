"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users, Search, Check } from 'lucide-react';
import { Player } from '@/types/player';
import Button from '../ui/Button';

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
  const [playerSearch, setPlayerSearch] = useState('');

  const availablePlayers = players.filter((player) => !currentPlayerIds.includes(player.id!));

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayerIds.length === 0) {
      setError('Select at least one player to add');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(selectedPlayerIds);
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
    setPlayerSearch('');
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
            onClick={handleClose}
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
            <div className="bg-light-50 dark:bg-dark-50 border border-black/10 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-cyber-400" />
                  <h2 className="text-base font-bold text-light-900 dark:text-white">Add Players to League</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-light-600 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

                {/* Player chips */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-light-700 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyber-400" />
                      Available Players
                    </p>
                    {selectedPlayerIds.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyber-500/10 border border-cyber-500/30 text-cyber-400">
                        {selectedPlayerIds.length} selected
                      </span>
                    )}
                  </div>

                  {availablePlayers.length > 0 ? (
                    <>
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
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                        {availablePlayers
                          .filter((p) =>
                            p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
                            p.psnId.toLowerCase().includes(playerSearch.toLowerCase())
                          )
                          .map((player) => {
                            const selected = selectedPlayerIds.includes(player.id!);
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
                    </>
                  ) : (
                    <div className="text-center py-6 bg-light-100/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 rounded-xl">
                      <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-light-600 dark:text-gray-400">All available players are already in this league</p>
                    </div>
                  )}

                  {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    isLoading={isSubmitting}
                    disabled={availablePlayers.length === 0}
                    glow
                  >
                    {isSubmitting ? 'Adding...' : 'Add Players'}
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
