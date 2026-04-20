"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, UserPlus, X, Loader2, Trash2, Shuffle } from 'lucide-react';
import {
  Tournament,
  TournamentParticipant,
  addMemberToTournament,
  removePlayerFromTournament,
  confirmUCLDraw,
} from '@/lib/tournamentUtils';
import { UCLMatch } from '@/lib/uclUtils';
import { usePlayers } from '@/hooks/usePlayers';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import UCLSeedingModal from '../UCLSeedingModal';
import PlayerStatsModal from '../PlayerStatsModal';

interface UCLPotsProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
  isAuthenticated: boolean;
  isLoading: boolean;
  uclMatches?: UCLMatch[];
}

const POT_DEFS = [
  { id: 'pot1', name: 'Pot 1', gradient: 'from-cyber-500/20 to-cyan-500/20', border: 'border-cyber-500/30', text: 'text-cyber-400', badge: 'bg-cyber-500/20 text-cyber-400' },
  { id: 'pot2', name: 'Pot 2', gradient: 'from-electric-500/20 to-purple-500/20', border: 'border-electric-500/30', text: 'text-electric-400', badge: 'bg-electric-500/20 text-electric-400' },
  { id: 'pot3', name: 'Pot 3', gradient: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-400' },
  { id: 'pot4', name: 'Pot 4', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
];

export default function UCLPots({ tournament, tournamentMembers, isAuthenticated, isLoading, uclMatches }: UCLPotsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<TournamentParticipant | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const { players, loading: playersLoading } = usePlayers();

  const isSetup = tournament.status === 'setup';
  const hasPots = (tournament.pots?.length ?? 0) > 0;

  const availablePlayers = players.filter(
    p => !tournamentMembers.some(m => m.name === p.name)
  );

  const filteredPlayers = availablePlayers.filter(p =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const filteredMembers = tournamentMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayer = (id: string) =>
    setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAddPlayers = async () => {
    if (!selectedPlayerIds.length || !tournament.id) return;
    setIsAdding(true);
    setAddError('');
    try {
      const toAdd = players.filter(p => p.id && selectedPlayerIds.includes(p.id));
      await Promise.all(toAdd.map(p => addMemberToTournament(tournament.id!, { name: p.name, psnId: p.psnId })));
      setSelectedPlayerIds([]);
      setPlayerSearch('');
      setIsAddModalOpen(false);
    } catch {
      setAddError('Failed to add players. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (member: TournamentParticipant) => {
    if (!tournament.id || !member.id) return;
    setRemovingId(member.id);
    try {
      await removePlayerFromTournament(tournament.id, member.id, member.name);
    } finally {
      setRemovingId(null);
      setPendingRemove(null);
    }
  };

  const handleDrawConfirm = async (potAssignments: { potId: string; potName: string; memberIds: string[] }[]) => {
    if (!tournament.id) return;
    await confirmUCLDraw(tournament.id, potAssignments);
    setShowDrawModal(false);
  };

  // After draw: show 4 pot columns
  if (hasPots) {
    const potMembers: Record<string, TournamentParticipant[]> = {};
    for (const pot of (tournament.pots ?? [])) {
      potMembers[pot.id] = tournamentMembers.filter(m => m.groupId === pot.id);
    }
    const potDefs = tournament.pots!.map((p, i) => ({ ...p, ...(POT_DEFS[i] ?? POT_DEFS[3]) }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-light-900 dark:text-white">Pots</h2>
            <p className="text-sm text-light-600 dark:text-gray-400">{tournamentMembers.length} players drawn into {tournament.pots?.length ?? 4} pots</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {potDefs.map(pot => {
            const list = potMembers[pot.id] ?? [];
            return (
              <Card key={pot.id} variant="glass" className={`bg-gradient-to-b ${pot.gradient} border-2 ${pot.border} !p-0 overflow-hidden`}>
                {/* Pot header */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${pot.border}`}>
                  <span className={`text-sm font-bold ${pot.text}`}>{pot.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pot.badge}`}>{list.length}</span>
                </div>
                {/* Player rows */}
                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {list.map((m, idx) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedPlayer(m.name)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <span className={`text-[10px] font-black tabular-nums w-4 shrink-0 ${pot.text} opacity-60`}>{idx + 1}</span>
                      <span className="text-sm font-semibold text-light-900 dark:text-white truncate flex-1">{m.name}</span>
                    </motion.button>
                  ))}
                  {list.length === 0 && (
                    <p className="text-[10px] text-light-400 dark:text-gray-600 text-center py-4">Empty</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {selectedPlayer && (
          <PlayerStatsModal
            tournament={tournament}
            playerName={selectedPlayer}
            uclMatches={uclMatches}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    );
  }

  // Setup phase: flat player list + draw button
  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-light-900 dark:text-white">Players</h2>
          <p className="text-sm text-light-600 dark:text-gray-400">
            {tournamentMembers.length} enrolled — need {Math.max(0, 8 - tournamentMembers.length)} more minimum
          </p>
        </div>
        {isAuthenticated && isSetup && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Players
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Shuffle className="w-4 h-4" />}
              onClick={() => setShowDrawModal(true)}
              disabled={tournamentMembers.length < 8 || tournamentMembers.length % 4 !== 0}
              glow
            >
              Draw Pots
            </Button>
          </div>
        )}
      </div>

      {/* Draw guard */}
      {isAuthenticated && isSetup && tournamentMembers.length < 8 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-3">
          <p className="text-yellow-400 text-xs font-semibold">Need at least 8 players and a count divisible by 4 to draw pots.</p>
          <p className="text-yellow-300/70 text-xs mt-0.5">Currently: {tournamentMembers.length} player{tournamentMembers.length !== 1 ? 's' : ''}</p>
        </div>
      )}
      {isAuthenticated && isSetup && tournamentMembers.length >= 8 && tournamentMembers.length % 4 !== 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-tech p-3">
          <p className="text-yellow-400 text-xs font-semibold">Player count must be divisible by 4.</p>
          <p className="text-yellow-300/70 text-xs mt-0.5">Currently: {tournamentMembers.length} — add {4 - (tournamentMembers.length % 4)} more or remove some.</p>
        </div>
      )}

      {/* Search */}
      {tournamentMembers.length > 0 && (
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search players..."
          leftIcon={<Search className="w-4 h-4" />}
        />
      )}

      {/* Player list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredMembers.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center justify-between bg-light-100/70 dark:bg-dark-100/60 border border-black/10 dark:border-white/10 rounded-tech px-3 py-2.5 hover:border-cyber-500/30 transition-all"
          >
            <button onClick={() => setSelectedPlayer(member.name)} className="min-w-0 text-left">
              <p className="text-sm font-semibold text-light-900 dark:text-white truncate hover:text-cyber-400 transition-colors">{member.name}</p>
              {member.psnId && <p className="text-xs text-light-500 dark:text-gray-500 truncate">{member.psnId}</p>}
            </button>
            {isAuthenticated && isSetup && (
              removingId === member.id ? (
                <Loader2 className="w-4 h-4 text-light-500 dark:text-gray-500 animate-spin shrink-0" />
              ) : pendingRemove?.id === member.id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-red-400">Remove?</span>
                  <button onClick={() => handleRemove(member)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Yes</button>
                  <button onClick={() => setPendingRemove(null)} className="text-[10px] text-light-500 dark:text-gray-500 hover:text-light-900 dark:hover:text-white">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingRemove(member)}
                  className="p-1 rounded hover:bg-red-500/15 transition-colors text-light-500 dark:text-gray-500 hover:text-red-400 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </motion.div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <Users className="w-10 h-10 text-light-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-light-600 dark:text-gray-400 text-sm">
              {tournamentMembers.length === 0 ? 'No players enrolled yet.' : 'No players match your search.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Players Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-dark-200 border-2 border-cyber-500/30 rounded-tech-lg p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Add Players</h3>
                <button onClick={() => { setIsAddModalOpen(false); setSelectedPlayerIds([]); setPlayerSearch(''); }} className="p-1.5 rounded-lg hover:bg-white/10">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <input
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                placeholder="Search players..."
                className="w-full px-3 py-2 mb-3 bg-dark-100/50 border border-white/10 rounded-tech text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyber-500/50"
              />

              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1.5 bg-gray-900/30 rounded-lg p-2 border border-white/10 mb-4">
                {playersLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-cyber-400 animate-spin" /></div>
                ) : filteredPlayers.length === 0 ? (
                  <p className="text-center text-gray-500 text-xs py-4">No players available</p>
                ) : (
                  filteredPlayers.map(player => {
                    const isSelected = selectedPlayerIds.includes(player.id!);
                    return (
                      <button
                        key={player.id}
                        onClick={() => togglePlayer(player.id!)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-tech text-left transition-all border-2 ${
                          isSelected
                            ? 'bg-cyber-500/20 border-cyber-500/50'
                            : 'bg-gray-800/50 border-black/10 dark:border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{player.name}</p>
                          {player.psnId && <p className="text-xs text-gray-400">{player.psnId}</p>}
                        </div>
                        {isSelected && <div className="w-4 h-4 rounded-full bg-cyber-500 flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-white" /></div>}
                      </button>
                    );
                  })
                )}
              </div>

              {addError && <p className="text-red-400 text-xs mb-3">{addError}</p>}

              {selectedPlayerIds.length > 0 && (
                <div className="bg-cyber-500/10 border border-cyber-500/30 rounded-lg p-2 text-xs text-cyber-400 mb-3">
                  {selectedPlayerIds.length} player{selectedPlayerIds.length !== 1 ? 's' : ''} selected
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => { setIsAddModalOpen(false); setSelectedPlayerIds([]); }} disabled={isAdding}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleAddPlayers} isLoading={isAdding} disabled={!selectedPlayerIds.length || isAdding} glow>
                  Add Selected
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seeding Modal */}
      {showDrawModal && (
        <UCLSeedingModal
          members={tournamentMembers}
          onConfirm={handleDrawConfirm}
          onClose={() => setShowDrawModal(false)}
        />
      )}

      {selectedPlayer && (
        <PlayerStatsModal
          tournament={tournament}
          playerName={selectedPlayer}
          uclMatches={uclMatches}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
