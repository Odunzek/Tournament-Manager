"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Trophy, Check } from 'lucide-react';
import Button from '../ui/Button';
import { TournamentParticipant } from '@/lib/tournamentUtils';

interface UCLSeedingModalProps {
  members: TournamentParticipant[];
  onConfirm: (potAssignments: { potId: string; potName: string; memberIds: string[] }[]) => Promise<void>;
  onClose: () => void;
}

const POT_DEFS = [
  { id: 'pot1', name: 'Pot 1', border: 'border-cyber-500/40',    text: 'text-cyber-400',    ring: 'ring-cyber-500/50',    bg: 'bg-cyber-500/8',    badge: 'bg-cyber-500/20 text-cyber-400',    selBg: 'bg-cyber-500/25 border-cyber-500/70' },
  { id: 'pot2', name: 'Pot 2', border: 'border-electric-500/40', text: 'text-electric-400', ring: 'ring-electric-500/50', bg: 'bg-electric-500/8', badge: 'bg-electric-500/20 text-electric-400', selBg: 'bg-electric-500/25 border-electric-500/70' },
  { id: 'pot3', name: 'Pot 3', border: 'border-pink-500/40',     text: 'text-pink-400',     ring: 'ring-pink-500/50',     bg: 'bg-pink-500/8',     badge: 'bg-pink-500/20 text-pink-400',         selBg: 'bg-pink-500/25 border-pink-500/70' },
  { id: 'pot4', name: 'Pot 4', border: 'border-purple-500/40',   text: 'text-purple-400',   ring: 'ring-purple-500/50',   bg: 'bg-purple-500/8',   badge: 'bg-purple-500/20 text-purple-400',     selBg: 'bg-purple-500/25 border-purple-500/70' },
];

function distributeEvenly(members: TournamentParticipant[]): Record<string, string> {
  const assignment: Record<string, string> = {};
  members.forEach((m, i) => {
    if (m.id) assignment[m.id] = POT_DEFS[i % 4].id;
  });
  return assignment;
}

export default function UCLSeedingModal({ members, onConfirm, onClose }: UCLSeedingModalProps) {
  const defaultAssignment = useMemo(() => distributeEvenly(members), [members]);
  const [assignment, setAssignment] = useState<Record<string, string>>(defaultAssignment);
  const [selected, setSelected] = useState<{ memberId: string; fromPotId: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const potMembers = useMemo(() => {
    const map: Record<string, TournamentParticipant[]> = { pot1: [], pot2: [], pot3: [], pot4: [] };
    for (const m of members) {
      if (!m.id) continue;
      const potId = assignment[m.id] ?? 'pot1';
      map[potId] = [...(map[potId] ?? []), m];
    }
    return map;
  }, [assignment, members]);

  const potsEqual = useMemo(() => {
    const sizes = Object.values(potMembers).map(arr => arr.length);
    return sizes.every(s => s === sizes[0]);
  }, [potMembers]);

  const handlePlayerTap = (memberId: string, potId: string) => {
    if (!selected) {
      setSelected({ memberId, fromPotId: potId });
      return;
    }
    if (selected.memberId === memberId) {
      setSelected(null);
      return;
    }
    const newAssignment = { ...assignment };
    newAssignment[selected.memberId] = potId;
    newAssignment[memberId] = selected.fromPotId;
    setAssignment(newAssignment);
    setSelected(null);
  };

  const handleMoveToPot = (targetPotId: string) => {
    if (!selected) return;
    if (selected.fromPotId === targetPotId) { setSelected(null); return; }
    const newAssignment = { ...assignment };
    newAssignment[selected.memberId] = targetPotId;
    setAssignment(newAssignment);
    setSelected(null);
  };

  const handleReset = () => {
    setAssignment(defaultAssignment);
    setSelected(null);
    setError('');
  };

  const handleConfirm = async () => {
    if (!potsEqual) { setError('All 4 pots must have equal size before confirming.'); return; }
    const minSize = Math.min(...Object.values(potMembers).map(a => a.length));
    if (minSize < 2) { setError('Each pot needs at least 2 players.'); return; }
    setError('');
    setIsConfirming(true);
    try {
      await onConfirm(POT_DEFS.map(pot => ({
        potId: pot.id,
        potName: pot.name,
        memberIds: (potMembers[pot.id] ?? []).map(m => m.id!).filter(Boolean),
      })));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to confirm draw. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const selectedName = members.find(m => m.id === selected?.memberId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full sm:max-w-3xl bg-light-50 dark:bg-dark-200 sm:rounded-2xl rounded-t-2xl border border-black/10 dark:border-white/10 shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-light-400 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-500/30 to-electric-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-cyber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-light-900 dark:text-white">Pot Draw</h2>
              <p className="text-[11px] text-light-500 dark:text-gray-500">Tap a player to select, tap another to swap or tap a pot to move.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/8 dark:hover:bg-white/8 transition-colors">
            <X className="w-4 h-4 text-light-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Selected banner */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="flex items-center gap-3 px-5 py-2.5 bg-cyber-500/10 border-b border-cyber-500/20">
                <div className="w-2 h-2 rounded-full bg-cyber-400 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-cyber-400 flex-1 truncate">
                  <span className="text-light-900 dark:text-white">{selectedName}</span> — tap a player to swap or a pot to move
                </span>
                <button onClick={() => setSelected(null)} className="text-[10px] text-light-500 dark:text-gray-500 hover:text-light-900 dark:hover:text-white transition-colors shrink-0">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pots grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POT_DEFS.map(pot => {
              const potPlayers = potMembers[pot.id] ?? [];
              const isTarget = selected && selected.fromPotId !== pot.id;
              return (
                <div
                  key={pot.id}
                  onClick={isTarget ? () => handleMoveToPot(pot.id) : undefined}
                  className={`rounded-xl border-2 ${pot.border} ${pot.bg} flex flex-col transition-all ${isTarget ? `ring-2 ${pot.ring} cursor-pointer` : ''}`}
                >
                  {/* Pot header */}
                  <div className={`flex items-center justify-between px-3 py-2.5 border-b ${pot.border}`}>
                    <span className={`text-xs font-bold ${pot.text}`}>{pot.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pot.badge}`}>{potPlayers.length}</span>
                  </div>

                  {/* Players */}
                  <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5 min-h-[60px]">
                    {potPlayers.map((member, idx) => {
                      const isSelected = selected?.memberId === member.id;
                      return (
                        <button
                          key={member.id}
                          onClick={e => { e.stopPropagation(); handlePlayerTap(member.id!, pot.id); }}
                          className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-all ${
                            isSelected
                              ? `${pot.selBg} border-2 rounded-lg m-1`
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-[10px] font-black tabular-nums w-4 shrink-0 ${pot.text} opacity-50`}>{idx + 1}</span>
                          <span className="text-xs font-semibold text-light-900 dark:text-white truncate flex-1">{member.name}</span>
                        </button>
                      );
                    })}
                    {potPlayers.length === 0 && (
                      <div className="flex-1 flex items-center justify-center py-5">
                        <span className="text-[10px] text-light-400 dark:text-gray-600">Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!potsEqual && (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2.5">
              <p className="text-yellow-400 text-xs font-semibold">Pots must have equal size before confirming.</p>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/10 dark:border-white/10 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
            disabled={isConfirming}
          >
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isConfirming}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={handleConfirm}
              isLoading={isConfirming}
              disabled={!potsEqual || isConfirming}
              glow
            >
              Confirm Draw
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
