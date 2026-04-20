"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ChevronDown, Pencil } from 'lucide-react';
import type { UCLMatch } from '@/lib/uclUtils';
import { recordUCLLeagueMatch } from '@/lib/tournamentUtils';
import RecordResultModal from '../RecordResultModal';

interface UCLFixturesProps {
  uclMatches: UCLMatch[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

type FilterType = 'all' | 'played' | 'unplayed';

interface OpponentPairing {
  opponentId: string;
  opponentName: string;
  home: (UCLMatch & { isPlayerA: boolean }) | null; // match where this player is home
  away: (UCLMatch & { isPlayerA: boolean }) | null; // match where this player is away
}

interface PlayerFixtures {
  playerId: string;
  playerName: string;
  pairings: OpponentPairing[];
}

export default function UCLFixtures({ uclMatches, isAuthenticated, isLoading }: UCLFixturesProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [recordingMatch, setRecordingMatch] = useState<UCLMatch | null>(null);

  // Build per-player fixture lists grouped by opponent
  const playerFixtures = useMemo<PlayerFixtures[]>(() => {
    const playerMap = new Map<string, string>();
    for (const m of uclMatches) {
      playerMap.set(m.playerAId, m.playerAName);
      playerMap.set(m.playerBId, m.playerBName);
    }

    const result: PlayerFixtures[] = [];
    for (const [playerId, playerName] of Array.from(playerMap.entries())) {
      // All matches involving this player, tagged with isPlayerA
      const playerMatches = uclMatches
        .filter(m => m.playerAId === playerId || m.playerBId === playerId)
        .map(m => ({ ...m, isPlayerA: m.playerAId === playerId }));

      // Group by opponent → pairing (H leg + A leg on same row)
      const pairingMap = new Map<string, OpponentPairing>();
      for (const m of playerMatches) {
        const opponentId = m.isPlayerA ? m.playerBId : m.playerAId;
        const opponentName = m.isPlayerA ? m.playerBName : m.playerAName;
        if (!pairingMap.has(opponentId)) {
          pairingMap.set(opponentId, { opponentId, opponentName, home: null, away: null });
        }
        const pairing = pairingMap.get(opponentId)!;
        if (m.isPlayerA) pairing.home = m; // this player is playerA = home
        else pairing.away = m;             // this player is playerB = away
      }

      const pairings = Array.from(pairingMap.values()).sort((a, b) =>
        a.opponentName.localeCompare(b.opponentName)
      );
      result.push({ playerId, playerName, pairings });
    }

    return result.sort((a, b) => a.playerName.localeCompare(b.playerName));
  }, [uclMatches]);

  const filteredPlayerFixtures = useMemo(() => {
    const q = search.trim().toLowerCase();

    return playerFixtures
      .map(pf => {
        let pairings = pf.pairings;

        if (filter === 'played') {
          pairings = pairings
            .map(p => ({
              ...p,
              home: p.home?.played ? p.home : null,
              away: p.away?.played ? p.away : null,
            }))
            .filter(p => p.home || p.away);
        } else if (filter === 'unplayed') {
          pairings = pairings
            .map(p => ({
              ...p,
              home: p.home && !p.home.played ? p.home : null,
              away: p.away && !p.away.played ? p.away : null,
            }))
            .filter(p => p.home || p.away);
        }

        if (q) {
          const nameMatch = pf.playerName.toLowerCase().includes(q);
          if (!nameMatch) {
            pairings = pairings.filter(p =>
              p.opponentName.toLowerCase().includes(q)
            );
          }
        }

        return { ...pf, pairings };
      })
      .filter(pf => {
        if (q) return pf.playerName.toLowerCase().includes(q) || pf.pairings.length > 0;
        return pf.pairings.length > 0 || filter === 'all';
      });
  }, [playerFixtures, filter, search]);

  const togglePlayer = (playerId: string) => {
    setExpandedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const handleRecordSubmit = async (homeScore: number, awayScore: number) => {
    if (!recordingMatch?.id) return;
    try {
      await recordUCLLeagueMatch(recordingMatch.id, homeScore, awayScore);
    } finally {
      setRecordingMatch(null);
    }
  };

  const played = uclMatches.filter(m => m.played).length;
  const total = uclMatches.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-light-900 dark:text-white">League Fixtures</h2>
          <p className="text-sm text-light-600 dark:text-gray-400">{played} / {total} played</p>
        </div>
        <div className="flex gap-1">
          {(['all', 'unplayed', 'played'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-tech text-xs font-semibold transition-all capitalize ${
                filter === f
                  ? 'bg-cyber-500/20 border border-cyber-500/50 text-cyber-400'
                  : 'bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 text-light-600 dark:text-gray-400 hover:border-cyber-500/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-500 dark:text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full pl-9 pr-3 py-2 bg-light-100/70 dark:bg-dark-100/60 border border-black/10 dark:border-white/10 rounded-tech text-sm text-light-900 dark:text-white placeholder-light-500 dark:placeholder-gray-500 focus:outline-none focus:border-cyber-500/50 transition-colors"
        />
      </div>

      {/* Player fixture cards */}
      {filteredPlayerFixtures.length === 0 ? (
        <div className="text-center py-10">
          <Calendar className="w-8 h-8 text-light-400 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-light-600 dark:text-gray-400 text-sm">No matches found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlayerFixtures.map((pf, idx) => {
            const allMatches = pf.pairings.flatMap(p => [p.home, p.away].filter(Boolean) as (UCLMatch & { isPlayerA: boolean })[]);
            const playedCount = allMatches.filter(m => m.played).length;
            const totalCount = allMatches.length;
            const isExpanded = expandedPlayers.has(pf.playerId);

            return (
              <motion.div
                key={pf.playerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.15) }}
                className="bg-gradient-to-br from-cyber-500/10 to-electric-500/10 border-2 border-cyber-500/30 rounded-tech-lg overflow-hidden"
              >
                {/* Card header */}
                <button
                  onClick={() => togglePlayer(pf.playerId)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-cyber-500/5 transition-colors select-none ${
                    isExpanded ? 'border-b-2 border-cyber-500/20' : ''
                  }`}
                >
                  <span className="text-sm font-bold text-light-900 dark:text-white">{pf.playerName}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-light-600 dark:text-gray-400">{playedCount}/{totalCount}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-cyber-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Expanded: one row per opponent, H + A legs side by side */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        {pf.pairings.map(pairing => (
                          <div
                            key={pairing.opponentId}
                            className="flex items-center gap-2 px-3 py-2 rounded-tech border bg-light-200/50 dark:bg-dark-100/60 border-black/10 dark:border-white/10"
                          >
                            {/* Opponent name */}
                            <span className="flex-1 text-xs font-semibold text-light-900 dark:text-white truncate">
                              vs {pairing.opponentName}
                            </span>

                            {/* H leg */}
                            <LegCell
                              label="H"
                              match={pairing.home}
                              isAdmin={isAuthenticated}
                              isLoading={isLoading}
                              onRecord={setRecordingMatch}
                            />

                            <span className="text-light-300 dark:text-gray-700 text-xs shrink-0">·</span>

                            {/* A leg */}
                            <LegCell
                              label="A"
                              match={pairing.away}
                              isAdmin={isAuthenticated}
                              isLoading={isLoading}
                              onRecord={setRecordingMatch}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {recordingMatch && (
        <RecordResultModal
          isOpen
          onClose={() => setRecordingMatch(null)}
          onSubmit={handleRecordSubmit}
          homeTeam={recordingMatch.playerAName}
          awayTeam={recordingMatch.playerBName}
          title={recordingMatch.played ? 'Edit Match Result' : 'Record Match Result'}
          initialHomeScore={recordingMatch.scoreA ?? undefined}
          initialAwayScore={recordingMatch.scoreB ?? undefined}
        />
      )}
    </div>
  );
}

// ── LegCell: renders one leg (H or A) in the pairing row ──────────────────────
interface LegCellProps {
  label: 'H' | 'A';
  match: (UCLMatch & { isPlayerA: boolean }) | null;
  isAdmin: boolean;
  isLoading: boolean;
  onRecord: (m: UCLMatch) => void;
}

function LegCell({ label, match, isAdmin, isLoading, onRecord }: LegCellProps) {
  const labelColor = label === 'H' ? 'text-cyber-400' : 'text-light-400 dark:text-gray-500';

  if (!match) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-[9px] font-bold uppercase ${labelColor}`}>{label}</span>
        <span className="text-[10px] text-light-400 dark:text-gray-600">—</span>
      </div>
    );
  }

  const myScore = match.isPlayerA ? match.scoreA : match.scoreB;
  const oppScore = match.isPlayerA ? match.scoreB : match.scoreA;
  const iWon = match.played && (myScore ?? 0) > (oppScore ?? 0);
  const iLost = match.played && (myScore ?? 0) < (oppScore ?? 0);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className={`text-[9px] font-bold uppercase ${labelColor}`}>{label}</span>
      {match.played ? (
        <>
          <span className={`text-xs font-bold tabular-nums ${iWon ? 'text-green-400' : iLost ? 'text-red-400' : 'text-yellow-400'}`}>
            {myScore}–{oppScore}
          </span>
          {isAdmin && (
            <button
              onClick={() => onRecord(match)}
              disabled={isLoading}
              className="text-light-400 dark:text-gray-600 hover:text-yellow-400 transition-colors disabled:opacity-40"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
          )}
        </>
      ) : (
        isAdmin ? (
          <button
            onClick={() => onRecord(match)}
            disabled={isLoading}
            className="bg-cyber-500 hover:bg-cyber-600 text-white text-[9px] px-1.5 py-0.5 rounded-tech font-semibold transition-colors disabled:opacity-40"
          >
            +
          </button>
        ) : (
          <span className="text-[10px] text-yellow-400/60">vs</span>
        )
      )}
    </div>
  );
}
