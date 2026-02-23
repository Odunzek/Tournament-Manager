"use client";

import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { LeagueMatch } from '@/types/league';
import { editMatch } from '@/lib/leagueUtils';

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LeagueMatch;
  onSuccess?: () => void;
}

export default function EditMatchModal({
  isOpen,
  onClose,
  match,
  onSuccess,
}: EditMatchModalProps) {
  const [scoreA, setScoreA] = useState(match.scoreA.toString());
  const [scoreB, setScoreB] = useState(match.scoreB.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const newScoreA = parseInt(scoreA);
    const newScoreB = parseInt(scoreB);

    if (isNaN(newScoreA) || isNaN(newScoreB) || newScoreA < 0 || newScoreB < 0) {
      setError('Please enter valid scores (0 or greater)');
      return;
    }

    try {
      setIsSubmitting(true);
      await editMatch(match.id, {
        scoreA: newScoreA,
        scoreB: newScoreB,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error editing match:', err);
      setError('Failed to update match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      setScoreA(match.scoreA.toString());
      setScoreB(match.scoreB.toString());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-light-50 to-light-100 dark:from-dark-100 dark:to-dark-200 rounded-tech shadow-card-light dark:shadow-glow border border-cyber-500/20 dark:border-cyber-500/30 max-w-md w-full mx-4 transform transition-all duration-300">
        <div className="p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-cyber rounded-tech shadow-glow">
            <Edit3 className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-light-900 dark:text-white text-center mb-3">
            Edit Match Result
          </h3>
          <p className="text-light-600 dark:text-gray-400 text-center mb-6 text-sm">
            Update the scores for this match
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match Info */}
            <div className="bg-cyber-500/10 border border-cyber-500/30 rounded-tech p-4">
              <p className="text-sm text-light-600 dark:text-gray-400 mb-2">Editing match:</p>
              <p className="text-lg font-bold text-light-900 dark:text-white">
                {match.playerAName} vs {match.playerBName}
              </p>
              <p className="text-xs text-light-600 dark:text-gray-400 mt-1">
                Current Score: {match.scoreA} - {match.scoreB}
              </p>
            </div>

            {/* Score Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-light-700 dark:text-gray-300 mb-3">
                  {match.playerAName}
                </label>
                <input
                  type="number"
                  min="0"
                  value={scoreA}
                  onChange={(e) => {
                    setScoreA(e.target.value);
                    setError('');
                  }}
                  placeholder="Score"
                  disabled={isSubmitting}
                  className="w-full px-4 py-4 rounded-tech bg-light-200 dark:bg-dark-50 text-light-900 dark:text-white focus:outline-none transition-all duration-300 border-2 border-black/10 dark:border-white/10 focus:border-cyber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-light-700 dark:text-gray-300 mb-3">
                  {match.playerBName}
                </label>
                <input
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={(e) => {
                    setScoreB(e.target.value);
                    setError('');
                  }}
                  placeholder="Score"
                  disabled={isSubmitting}
                  className="w-full px-4 py-4 rounded-tech bg-light-200 dark:bg-dark-50 text-light-900 dark:text-white focus:outline-none transition-all duration-300 border-2 border-black/10 dark:border-white/10 focus:border-cyber-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-tech px-3 py-2">
                <span className="text-sm">⚠️</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-light-200 hover:bg-light-300 dark:bg-dark-50 dark:hover:bg-dark-100 text-light-700 dark:text-gray-300 px-6 py-4 rounded-tech font-bold transition-all duration-300 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-cyber hover:shadow-glow text-white px-6 py-4 rounded-tech font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
