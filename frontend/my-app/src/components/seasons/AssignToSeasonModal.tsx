"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Loader2, CheckSquare } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import {
  getUnscopedLeagues,
  getUnscopedTournaments,
  assignLeaguesToSeason,
  assignTournamentsToSeason,
  recomputeSeasonStats,
} from '@/lib/seasonIntegrationUtils';
import type { League } from '@/types/league';
import type { Tournament } from '@/lib/tournamentUtils';

interface AssignToSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasonId: string;
  seasonName: string;
}

export default function AssignToSeasonModal({
  isOpen,
  onClose,
  seasonId,
  seasonName,
}: AssignToSeasonModalProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(new Set());
  const [selectedTournaments, setSelectedTournaments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.all([getUnscopedLeagues(), getUnscopedTournaments()])
      .then(([l, t]) => {
        setLeagues(l);
        setTournaments(t);
        setSelectedLeagues(new Set());
        setSelectedTournaments(new Set());
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const toggleLeague = (id: string) => {
    setSelectedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTournament = (id: string) => {
    setSelectedTournaments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSelected = selectedLeagues.size + selectedTournaments.size;

  const handleAssign = async () => {
    if (totalSelected === 0) return;
    setAssigning(true);
    try {
      const promises: Promise<void>[] = [];
      if (selectedLeagues.size > 0) {
        promises.push(assignLeaguesToSeason([...selectedLeagues], seasonId));
      }
      if (selectedTournaments.size > 0) {
        promises.push(assignTournamentsToSeason([...selectedTournaments], seasonId));
      }
      await Promise.all(promises);
      await recomputeSeasonStats(seasonId);
      onClose();
    } catch (error) {
      console.error('Error assigning to season:', error);
    } finally {
      setAssigning(false);
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
                  <div>
                    <h2 className="text-xl font-bold text-light-900 dark:text-white">
                      Assign to {seasonName}
                    </h2>
                    <p className="text-sm text-light-600 dark:text-gray-400 mt-1">
                      Select unassigned leagues and tournaments to add to this season.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-cyber-400 mx-auto animate-spin" />
                    <p className="text-light-600 dark:text-gray-400 mt-3">Loading unassigned items...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Unassigned Leagues */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-cyber-600 dark:text-cyber-400" />
                        <h3 className="font-semibold text-light-900 dark:text-white">
                          Unassigned Leagues ({leagues.length})
                        </h3>
                      </div>
                      {leagues.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 bg-light-100 dark:bg-dark-100 border border-black/10 dark:border-white/10 rounded-xl p-3">
                          {leagues.map((league) => (
                            <label
                              key={league.id}
                              className="flex items-center gap-3 p-2.5 rounded-tech hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedLeagues.has(league.id!)}
                                onChange={() => toggleLeague(league.id!)}
                                className="w-5 h-5 rounded-lg border-2 border-white/20 bg-light-100 dark:bg-dark-100 text-cyber-500 focus:ring-cyber-500 focus:ring-offset-0 focus:ring-2"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-light-900 dark:text-white truncate">
                                  {league.name}
                                </p>
                                <p className="text-xs text-light-600 dark:text-gray-400">
                                  {league.season} &middot; {league.playerIds?.length || 0} players
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                league.status === 'active'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : league.status === 'completed'
                                  ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}>
                                {league.status}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-light-500 dark:text-gray-500 py-3 text-center">
                          All leagues are already assigned to a season.
                        </p>
                      )}
                    </div>

                    {/* Unassigned Tournaments */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-electric-600 dark:text-electric-400" />
                        <h3 className="font-semibold text-light-900 dark:text-white">
                          Unassigned Tournaments ({tournaments.length})
                        </h3>
                      </div>
                      {tournaments.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 bg-light-100 dark:bg-dark-100 border border-black/10 dark:border-white/10 rounded-xl p-3">
                          {tournaments.map((tournament) => (
                            <label
                              key={tournament.id}
                              className="flex items-center gap-3 p-2.5 rounded-tech hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTournaments.has(tournament.id!)}
                                onChange={() => toggleTournament(tournament.id!)}
                                className="w-5 h-5 rounded-lg border-2 border-white/20 bg-light-100 dark:bg-dark-100 text-electric-500 focus:ring-electric-500 focus:ring-offset-0 focus:ring-2"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-light-900 dark:text-white truncate">
                                  {tournament.name}
                                </p>
                                <p className="text-xs text-light-600 dark:text-gray-400">
                                  {tournament.type.replace('_', ' ')} &middot; {tournament.maxTeams} teams max
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                tournament.status === 'completed'
                                  ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  : tournament.status === 'setup'
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                              }`}>
                                {tournament.status.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-light-500 dark:text-gray-500 py-3 text-center">
                          All tournaments are already assigned to a season.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={assigning}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssign}
                        isLoading={assigning}
                        disabled={totalSelected === 0}
                        leftIcon={<CheckSquare className="w-4 h-4" />}
                        className="flex-1"
                      >
                        {assigning
                          ? 'Assigning...'
                          : `Assign Selected (${totalSelected})`}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
