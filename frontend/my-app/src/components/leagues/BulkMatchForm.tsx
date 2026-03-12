"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import { Player } from '@/types/player';
import { MatchFormData } from '@/types/league';
import Button from '../ui/Button';
import CustomDropdown from '../ui/CustomDropdown';

interface BulkMatchFormProps {
  players: Player[];
  onSubmit: (matches: MatchFormData[]) => Promise<void>;
  isSubmitting?: boolean;
}

const inputClass =
  'w-full px-2.5 py-2 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-lg text-sm text-light-900 dark:text-white focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50';

export default function BulkMatchForm({ players, onSubmit, isSubmitting = false }: BulkMatchFormProps) {
  const [matches, setMatches] = useState<MatchFormData[]>([
    { playerA: '', scoreA: 0, scoreB: 0, playerB: '', date: new Date().toISOString().split('T')[0] },
  ]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Build player options for CustomDropdown
  const playerOptions = useMemo(() =>
    players.map((p) => ({ value: p.id!, label: p.name })),
    [players]
  );

  const addMatch = () => {
    setMatches([
      ...matches,
      { playerA: '', scoreA: 0, scoreB: 0, playerB: '', date: new Date().toISOString().split('T')[0] },
    ]);
  };

  const removeMatch = (index: number) => {
    if (matches.length === 1) return;
    setMatches(matches.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const updateMatch = (index: number, field: keyof MatchFormData, value: string | number) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };
    setMatches(newMatches);

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
        newErrors[index] = 'Select both players';
      } else if (match.playerA === match.playerB) {
        newErrors[index] = 'Cannot play against self';
      } else if (match.scoreA < 0 || match.scoreB < 0) {
        newErrors[index] = 'Scores cannot be negative';
      } else if (!match.date) {
        newErrors[index] = 'Select a date';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMatches()) return;

    try {
      await onSubmit(matches);
      setMatches([
        { playerA: '', scoreA: 0, scoreB: 0, playerB: '', date: new Date().toISOString().split('T')[0] },
      ]);
      setErrors({});
    } catch (error) {
      console.error('Error submitting matches:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <AnimatePresence mode="popLayout">
        {matches.map((match, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border-2 border-cyber-500/20 dark:border-white/10 rounded-xl p-3 sm:p-4">
              {/* Match header */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] sm:text-xs font-bold text-light-500 dark:text-gray-500 uppercase tracking-wider">
                  Match {index + 1}
                </span>
                {matches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMatch(index)}
                    className="text-red-400 hover:text-red-300 transition-colors p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Players row — side by side with VS */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 sm:gap-2 items-end mb-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-light-600 dark:text-gray-400 mb-1">
                    Player A
                  </label>
                  <CustomDropdown
                    value={match.playerA}
                    onChange={(val) => updateMatch(index, 'playerA', val as string)}
                    options={playerOptions}
                    placeholder="Select..."
                    searchable
                  />
                </div>
                <span className="pb-2 text-[10px] font-bold text-light-400 dark:text-gray-600">VS</span>
                <div>
                  <label className="block text-[10px] font-semibold text-light-600 dark:text-gray-400 mb-1">
                    Player B
                  </label>
                  <CustomDropdown
                    value={match.playerB}
                    onChange={(val) => updateMatch(index, 'playerB', val as string)}
                    options={playerOptions}
                    placeholder="Select..."
                    searchable
                  />
                </div>
              </div>

              {/* Scores + Date row — all inline */}
              <div className="grid grid-cols-[1fr_auto_1fr_2fr] gap-1.5 sm:gap-2 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-light-600 dark:text-gray-400 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={match.scoreA}
                    onChange={(e) => updateMatch(index, 'scoreA', parseInt(e.target.value) || 0)}
                    className={`${inputClass} text-center`}
                    required
                  />
                </div>
                <span className="pb-2 text-[10px] font-bold text-light-400 dark:text-gray-600">-</span>
                <div>
                  <label className="block text-[10px] font-semibold text-light-600 dark:text-gray-400 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={match.scoreB}
                    onChange={(e) => updateMatch(index, 'scoreB', parseInt(e.target.value) || 0)}
                    className={`${inputClass} text-center`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-light-600 dark:text-gray-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={match.date}
                    onChange={(e) => updateMatch(index, 'date', e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {errors[index] && (
                <div className="mt-2 px-2 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] sm:text-xs text-red-400">
                  {errors[index]}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          onClick={addMatch}
          variant="outline"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          Add Match
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="sm"
          leftIcon={<Save className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : `Submit ${matches.length}`}
        </Button>
      </div>
    </form>
  );
}
