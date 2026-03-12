"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Calendar, Save } from 'lucide-react';
import { League } from '@/types/league';
import { updateLeague } from '@/lib/leagueUtils';
import { Timestamp } from 'firebase/firestore';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface EditLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League;
}

export default function EditLeagueModal({ isOpen, onClose, league }: EditLeagueModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    status: 'upcoming' as 'active' | 'upcoming' | 'completed',
    startDate: '',
    endDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill with current league data when modal opens
  useEffect(() => {
    if (isOpen && league) {
      const toDateString = (ts: any) => {
        if (!ts) return '';
        try {
          const d = ts.toDate ? ts.toDate() : new Date(ts);
          return d.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      setFormData({
        name: league.name,
        season: league.season,
        status: league.status === 'completed' ? 'completed' : league.status,
        startDate: toDateString(league.startDate),
        endDate: toDateString(league.endDate),
      });
      setErrors({});
    }
  }, [isOpen, league]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'League name is required';
    if (!formData.season.trim()) newErrors.season = 'Season is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (formData.endDate && formData.startDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !league.id) return;
    setIsSubmitting(true);
    try {
      await updateLeague(league.id, {
        name: formData.name.trim(),
        season: formData.season.trim(),
        status: formData.status,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        ...(formData.endDate
          ? { endDate: Timestamp.fromDate(new Date(formData.endDate)) }
          : {}),
      });
      onClose();
    } catch (err) {
      console.error('Error updating league:', err);
      setErrors({ submit: 'Failed to save changes. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: 'upcoming' | 'active' | 'completed'; label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <div className="bg-light-50 dark:bg-dark-50 border border-black/10 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cyber-400" />
                  <h2 className="text-base font-bold text-light-900 dark:text-white">Edit League</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-light-600 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

                <Input
                  label="League Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Premier League Season 1"
                  error={errors.name}
                  leftIcon={<Trophy className="w-4 h-4" />}
                />

                <Input
                  label="Season *"
                  value={formData.season}
                  onChange={(e) => handleChange('season', e.target.value)}
                  placeholder="e.g. 2024 Spring"
                  error={errors.season}
                />

                {/* Status */}
                <div>
                  <p className="text-sm font-medium text-light-800 dark:text-gray-300 mb-2">Status</p>
                  <div className="flex gap-2">
                    {statusOptions.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('status', value)}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          formData.status === value
                            ? value === 'active'
                              ? 'bg-green-500/20 text-green-400 border-green-500/40'
                              : value === 'completed'
                              ? 'bg-gray-500/20 text-gray-400 border-gray-500/40'
                              : 'bg-cyber-500/20 text-cyber-400 border-cyber-500/40'
                            : 'bg-light-100 dark:bg-dark-100 text-light-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:text-light-900 dark:hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Date *"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    error={errors.startDate}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    error={errors.endDate}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>

                {errors.submit && (
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-xs">{errors.submit}</p>
                  </div>
                )}

                <div className="flex gap-3 pb-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    leftIcon={<Save className="w-4 h-4" />}
                    isLoading={isSubmitting}
                    glow
                  >
                    Save Changes
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
