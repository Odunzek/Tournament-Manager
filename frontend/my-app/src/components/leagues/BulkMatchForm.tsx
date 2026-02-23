"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import { Player } from '@/types/player';
import { MatchFormData } from '@/types/league';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface BulkMatchFormProps {
  players: Player[];
  onSubmit: (matches: MatchFormData[]) => Promise<void>;
  isSubmitting?: boolean;
}

export default function BulkMatchForm({ players, onSubmit, isSubmitting = false }: BulkMatchFormProps) {
  const [matches, setMatches] = useState<MatchFormData[]>([
    { playerA: '', scoreA: 0, scoreB: 0, playerB: '', date: new Date().toISOString().split('T')[0] },
  ]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addMatch = () => {
    setMatches([
      ...matches,
      { playerA: '', scoreA: 0, scoreB: 0, playerB: '', date: new Date().toISOString().split('T')[0] },
    ]);
  };

  const removeMatch = (index: number) => {
    if (matches.length === 1) return; // Keep at least one match form
    setMatches(matches.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const updateMatch = (index: number, field: keyof MatchFormData, value: string | number) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };
    setMatches(newMatches);

    // Clear error for this match when user edits
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const validateMatches = (): boolean => {
    const newErrors: Record<number, string> = {};

    matches.forEach((match, index) => {
      if (!match.playerA || !match.playerB) {
        newErrors[index] = 'Please select both players';
      } else if (match.playerA === match.playerB) {
        newErrors[index] = 'A player cannot play against themselves';
      } else if (match.scoreA < 0 || match.scoreB < 0) {
        newErrors[index] = 'Scores cannot be negative';
      } else if (!match.date) {
        newErrors[index] = 'Please select a date';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMatches()) {
      return;
    }

    try {
      await onSubmit(matches);
      // Reset form on success
      setMatches([
        { playerA: '', scoreA: 0, scoreB: 0, playerB: '', date: new Date().toISOString().split('T')[0] },
      ]);
      setErrors({});
    } catch (error) {
      console.error('Error submitting matches:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AnimatePresence mode="popLayout">
        {matches.map((match, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card variant="glass">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-sm font-semibold text-light-700 dark:text-gray-300">Match {index + 1}</h4>
                {matches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMatch(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player A */}
                <div>
                  <label className="block text-xs font-semibold text-light-600 dark:text-gray-400 mb-2">
                    Player A
                  </label>
                  <select
                    value={match.playerA}
                    onChange={(e) => updateMatch(index, 'playerA', e.target.value)}
                    className="w-full px-3 py-2.5 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-tech text-light-900 dark:text-white focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50"
                    required
                  >
                    <option value="" className="bg-light-50 dark:bg-dark-100 text-light-500 dark:text-gray-400">Select Player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id} className="bg-light-50 dark:bg-dark-100 text-light-900 dark:text-white">
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player B */}
                <div>
                  <label className="block text-xs font-semibold text-light-600 dark:text-gray-400 mb-2">
                    Player B
                  </label>
                  <select
                    value={match.playerB}
                    onChange={(e) => updateMatch(index, 'playerB', e.target.value)}
                    className="w-full px-3 py-2.5 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-tech text-light-900 dark:text-white focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50"
                    required
                  >
                    <option value="" className="bg-light-50 dark:bg-dark-100 text-light-500 dark:text-gray-400">Select Player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id} className="bg-light-50 dark:bg-dark-100 text-light-900 dark:text-white">
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score A */}
                <div>
                  <label className="block text-xs font-semibold text-light-600 dark:text-gray-400 mb-2">
                    Score A
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={match.scoreA}
                    onChange={(e) => updateMatch(index, 'scoreA', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-tech text-light-900 dark:text-white focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50"
                    required
                  />
                </div>

                {/* Score B */}
                <div>
                  <label className="block text-xs font-semibold text-light-600 dark:text-gray-400 mb-2">
                    Score B
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={match.scoreB}
                    onChange={(e) => updateMatch(index, 'scoreB', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-tech text-light-900 dark:text-white focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50"
                    required
                  />
                </div>

                {/* Date */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-light-600 dark:text-gray-400 mb-2">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={match.date}
                    onChange={(e) => updateMatch(index, 'date', e.target.value)}
                    className="w-full px-3 py-2.5 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-tech text-light-900 dark:text-white focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50"
                    required
                  />
                </div>
              </div>

              {/* Error message */}
              {errors[index] && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                  {errors[index]}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={addMatch}
          variant="outline"
          leftIcon={<Plus className="w-4 h-4" />}
          className="flex-1"
        >
          Add Another Match
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : `Submit ${matches.length} ${matches.length === 1 ? 'Match' : 'Matches'}`}
        </Button>
      </div>
    </form>
  );
}
