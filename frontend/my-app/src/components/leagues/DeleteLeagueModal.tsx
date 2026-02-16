"use client";

import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { League } from '@/types/league';
import { deleteLeagueWithMatches } from '@/lib/leagueUtils';
import { useRouter } from 'next/navigation';

interface DeleteLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League;
}

export default function DeleteLeagueModal({
  isOpen,
  onClose,
  league,
}: DeleteLeagueModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await deleteLeagueWithMatches(league.id!);

      // Redirect to leagues page after successful deletion
      router.push('/leagues');
    } catch (err) {
      console.error('Error deleting league:', err);
      setError('Failed to delete league. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError('');
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-light-50 to-light-100 dark:from-dark-100 dark:to-dark-200 rounded-tech shadow-card-light dark:shadow-glow border border-red-500/30 max-w-md w-full mx-4 transform transition-all duration-300">
        <div className="p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-tech border-2 border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-light-900 dark:text-white text-center mb-3">
            Delete League
          </h3>
          <p className="text-light-600 dark:text-gray-400 text-center mb-6 text-sm">
            This action cannot be undone!
          </p>

          {/* Warning Section */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-tech p-4 mb-6">
            <p className="text-sm text-light-700 dark:text-gray-300 leading-relaxed mb-3">
              Deleting this league will permanently remove:
            </p>
            <ul className="space-y-2 text-sm text-light-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>The league "{league.name}"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>All {league.matchesPlayed} recorded matches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>All player statistics and standings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>All historical data for this league</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-light-700 dark:text-gray-300 mb-3">
              Type <span className="text-red-400 font-mono">delete</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder="Type 'delete' here"
              disabled={isDeleting}
              className={`w-full px-4 py-4 rounded-tech bg-light-200 dark:bg-dark-50 text-light-900 dark:text-white focus:outline-none transition-all duration-300 border-2 ${
                error
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-red-500/30 focus:border-red-500'
              }`}
              autoFocus
            />
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-tech px-3 py-2">
                <span className="text-sm">⚠️</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 bg-light-200 hover:bg-light-300 dark:bg-dark-50 dark:hover:bg-dark-100 text-light-700 dark:text-gray-300 px-6 py-4 rounded-tech font-bold transition-all duration-300 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || confirmText.toLowerCase() !== 'delete'}
              className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-glow text-white px-6 py-4 rounded-tech font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete League</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
