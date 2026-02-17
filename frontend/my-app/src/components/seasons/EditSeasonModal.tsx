"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2 } from 'lucide-react';
import { Season } from '@/types/season';
import { updateSeason, generateSlug, isValidSlug, isSlugUnique } from '@/lib/seasonUtils';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface EditSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  season: Season;
}

export default function EditSeasonModal({
  isOpen,
  onClose,
  season,
}: EditSeasonModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [gameVersion, setGameVersion] = useState('');
  const [description, setDescription] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when season changes or modal opens
  useEffect(() => {
    if (isOpen && season) {
      setName(season.name);
      setSlug(season.slug);
      setGameVersion(season.gameVersion);
      setDescription(season.description || '');
      setSlugManuallyEdited(true); // Don't auto-generate on edit
      setErrors({});
    }
  }, [isOpen, season]);

  // Auto-generate slug from name when not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Season name is required';
    if (!slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!isValidSlug(slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    if (!gameVersion.trim()) newErrors.gameVersion = 'Game version is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Check slug uniqueness if it changed
      if (slug !== season.slug) {
        const unique = await isSlugUnique(slug, season.id);
        if (!unique) {
          setErrors({ slug: `Slug "${slug}" is already taken.` });
          setIsSubmitting(false);
          return;
        }
      }

      await updateSeason(season.id!, {
        name: name.trim(),
        slug,
        gameVersion: gameVersion.trim(),
        description: description.trim(),
      });

      onClose();
    } catch (error: any) {
      console.error('Error updating season:', error);
      setErrors({ submit: error.message || 'Failed to update season.' });
    } finally {
      setIsSubmitting(false);
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl my-8"
            >
              <Card variant="glass" className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-6 h-6 text-cyber-400" />
                    <h2 className="text-2xl font-bold text-light-900 dark:text-white">Edit Season</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Season Name */}
                  <div>
                    <label className="block text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">
                      Season Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g., FC 26 Season 1"
                      className={`w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                        errors.name ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                      } rounded-xl text-light-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors`}
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-light-600 dark:text-gray-400 text-sm">/seasons/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="fc-26-season-1"
                        className={`flex-1 px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                          errors.slug ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                        } rounded-xl text-light-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors`}
                      />
                    </div>
                    {errors.slug && <p className="text-red-400 text-sm mt-1">{errors.slug}</p>}
                  </div>

                  {/* Game Version */}
                  <div>
                    <label className="block text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">
                      Game Version *
                    </label>
                    <input
                      type="text"
                      value={gameVersion}
                      onChange={(e) => {
                        setGameVersion(e.target.value);
                        if (errors.gameVersion) setErrors((prev) => ({ ...prev, gameVersion: '' }));
                      }}
                      placeholder="e.g., EA FC 26"
                      className={`w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 ${
                        errors.gameVersion ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'
                      } rounded-xl text-light-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors`}
                    />
                    {errors.gameVersion && <p className="text-red-400 text-sm mt-1">{errors.gameVersion}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this season about?"
                      rows={3}
                      className="w-full px-4 py-3 bg-light-100 dark:bg-dark-100 border-2 border-black/10 dark:border-white/10 rounded-xl text-light-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-400 text-sm">{errors.submit}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
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
