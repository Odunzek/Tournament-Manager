"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Trophy, Check, ArrowLeftRight } from 'lucide-react';
import Button from '../ui/Button';
import { TournamentParticipant } from '@/lib/tournamentUtils';

interface UCLSeedingModalProps {
  members: TournamentParticipant[];
  onConfirm: (potAssignments: { potId: string; potName: string; memberIds: string[] }[]) => Promise<void>;
  onClose: () => void;
}

const POT_DEFS = [
  { id: 'pot1', name: 'Pot 1', gradient: 'from-cyber-500/20 to-cyan-500/20', border: 'border-cyber-500/30', text: 'text-cyber-400', badge: 'bg-cyber-500/20 text-cyber-400' },
  { id: 'pot2', name: 'Pot 2', gradient: 'from-electric-500/20 to-purple-500/20', border: 'border-electric-500/30', text: 'text-electric-400', badge: 'bg-electric-500/20 text-electric-400' },
  { id: 'pot3', name: 'Pot 3', gradient: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-400' },
  { id: 'pot4', name: 'Pot 4', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
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
    // Swap the two players
    const newAssignment = { ...assignment };
    newAssignment[selected.memberId] = potId;
    newAssignment[memberId] = selected.fromPotId;
    setAssignment(newAssignment);
    setSelected(null);
  };

  const handleMoveToPot = (targetPotId: string) => {
    if (!selected) return;
    if (selected.fromPotId === targetPotId) {
      setSelected(null);
      return;
    }
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
    if (!potsEqual) {
      setError('All 4 pots must have equal size before confirming.');
      return;
    }
    const minSize = Math.min(...Object.values(potMembers).map(a => a.length));
    if (minSize < 2) {
      setError('Each pot needs at least 2 players (8 total minimum).');
      return;
    }
    setError('');
    setIsConfirming(true);
    try {
      const potAssignments = POT_DEFS.map(pot => ({
        potId: pot.id,
        potName: pot.name,
        memberIds: (potMembers[pot.id] ?? []).map(m => m.id!).filter(Boolean),
      }));
      await onConfirm(potAssignments);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to confirm draw. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-4 px-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-light-50 dark:bg-dark-200 border-2 border-cyber-500/30 rounded-tech-lg shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyber-500/30 to-electric-500/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-cyber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-light-900 dark:text-white">UCL Draw — Assign Pots</h2>
              <p className="text-[11px] text-light-600 dark:text-gray-400">Tap a player to select, then tap another player to swap, or tap a pot header to move.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-light-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Selected player banner */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-2 bg-cyber-500/10 border-b border-cyber-500/20 flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyber-400 shrink-0" />
                <span className="text-xs text-cyber-400 font-semibold">
                  {members.find(m => m.id === selected.memberId)?.name} selected — tap another player to swap, or tap a pot to move there
                </span>
                <button onClick={() => setSelected(null)} className="ml-auto text-[10px] text-cyber-400 hover:text-cyber-300 underline">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4-pot grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POT_DEFS.map(pot => {
            const potPlayers = potMembers[pot.id] ?? [];
            const isTargetPot = selected && selected.fromPotId !== pot.id;
            return (
              <div
                key={pot.id}
                className={`rounded-tech border-2 ${pot.border} bg-gradient-to-b ${pot.gradient} flex flex-col transition-all ${isTargetPot ? 'ring-2 ring-cyber-400/60 cursor-pointer' : ''}`}
                onClick={isTargetPot ? () => handleMoveToPot(pot.id) : undefined}
              >
                {/* Pot header */}
                <div className={`flex items-center justify-between px-2.5 py-2 border-b ${pot.border}`}>
                  <span className={`text-xs font-bold ${pot.text}`}>{pot.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pot.badge}`}>{potPlayers.length}</span>
                </div>

                {/* Player list */}
                <div className="flex flex-col gap-1 p-2 min-h-[80px]">
                  {potPlayers.map(member => {
                    const isSelected = selected?.memberId === member.id;
                    return (
                      <button
                        key={member.id}
                        onClick={(e) => { e.stopPropagation(); handlePlayerTap(member.id!, pot.id); }}
                        className={`text-left px-2 py-1.5 rounded-tech text-[11px] font-semibold transition-all
                          ${isSelected
                            ? 'bg-cyber-500/30 border-2 border-cyber-500/70 text-light-900 dark:text-white scale-[1.02]'
                            : 'bg-light-100/70 dark:bg-dark-100/60 border border-black/10 dark:border-white/10 text-light-900 dark:text-white hover:border-cyber-500/40 hover:bg-cyber-500/10'
                          }`}
                      >
                        <span className="truncate block">{member.name}</span>
                        {member.psnId && (
                          <span className="text-[9px] text-light-500 dark:text-gray-500 truncate block">{member.psnId}</span>
                        )}
                      </button>
                    );
                  })}
                  {potPlayers.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[10px] text-light-400 dark:text-gray-600">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pot size warning */}
        {!potsEqual && (
          <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-tech px-3 py-2">
            <p className="text-yellow-400 text-xs font-semibold">Pots must have equal size before confirming the draw.</p>
          </div>
        )}

        {error && (
          <div className="mx-4 mb-3 bg-red-500/10 border border-red-500/20 rounded-tech px-3 py-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-black/10 dark:border-white/10 gap-3">
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
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isConfirming}>
              Cancel
            </Button>
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
