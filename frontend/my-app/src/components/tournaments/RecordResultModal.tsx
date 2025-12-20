"use client";

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { RecordResultModalProps, MatchResult } from '@/types/tournament';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function RecordResultModal({
  isOpen,
  onClose,
  match,
  onSubmit
}: RecordResultModalProps) {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      alert('Please enter valid scores');
      return;
    }

    if (homeScoreNum < 0 || awayScoreNum < 0) {
      alert('Scores cannot be negative');
      return;
    }

    setIsSubmitting(true);

    const result: MatchResult = {
      matchId: match.id,
      homeScore: homeScoreNum,
      awayScore: awayScoreNum,
      notes: notes || undefined,
    };

    try {
      await onSubmit(result);
      handleClose();
    } catch (error) {
      console.error('Error submitting result:', error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setHomeScore('');
    setAwayScore('');
    setNotes('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Match Result"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Result
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Match Info */}
        <div className="text-center p-4 bg-dark-200/50 rounded-lg border border-white/10">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-lg font-bold text-white">{match.homeTeamName}</span>
            <span className="text-gray-500">vs</span>
            <span className="text-lg font-bold text-white">{match.awayTeamName}</span>
          </div>
          {match.round && (
            <p className="text-sm text-gray-400">{match.round}</p>
          )}
        </div>

        {/* Score Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={match.homeTeamName}
            type="number"
            min="0"
            placeholder="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="text-center text-2xl font-bold"
          />
          <Input
            label={match.awayTeamName}
            type="number"
            min="0"
            placeholder="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="text-center text-2xl font-bold"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the match..."
            rows={3}
            className="w-full px-4 py-2.5 bg-dark-100/50 backdrop-blur-sm border-2 border-white/10 rounded-tech text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/20 transition-all duration-200 resize-none"
          />
        </div>

        {/* Quick Score Tips */}
        <div className="p-3 bg-cyber-500/10 border border-cyber-500/30 rounded-lg">
          <p className="text-xs text-cyber-300">
            💡 Tip: You can add goal scorers and match details later from the results section
          </p>
        </div>
      </div>
    </Modal>
  );
}
