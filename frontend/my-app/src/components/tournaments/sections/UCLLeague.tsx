"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Tournament, TournamentParticipant } from '@/lib/tournamentUtils';
import { UCLMatch, computeLeagueStandings, applyZones, computeUCLCutoffs } from '@/lib/uclUtils';
import Card from '../../ui/Card';
import PlayerStatsModal from '../PlayerStatsModal';

interface UCLLeagueProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
  uclMatches: UCLMatch[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

function FormBar({ form }: { form: ('W' | 'D' | 'L')[] }) {
  if (!form?.length) return <span className="text-xs text-light-500 dark:text-gray-600">—</span>;
  const colors = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' };
  return (
    <div className="flex gap-0.5">
      {form.slice(0, 5).map((r, i) => (
        <div key={i} className={`w-1.5 h-3.5 rounded-sm ${colors[r]} opacity-80`} />
      ))}
    </div>
  );
}

export default function UCLLeague({ tournament, tournamentMembers, uclMatches }: UCLLeagueProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const potMap = useMemo(() => {
    const map: Record<string, { potId: string; potName: string }> = {};
    for (const m of tournamentMembers) {
      if (!m.id) continue;
      const pot = tournament.pots?.find(p => p.id === m.groupId);
      map[m.id] = { potId: m.groupId ?? '', potName: pot?.name ?? '' };
    }
    return map;
  }, [tournamentMembers, tournament.pots]);

  const standings = useMemo(() => {
    const simplePlayers = tournamentMembers.map(m => ({ id: m.id!, name: m.name }));
    const raw = computeLeagueStandings(uclMatches, simplePlayers, potMap);
    const cutoffs = computeUCLCutoffs(tournamentMembers.length);
    return applyZones(raw, cutoffs);
  }, [uclMatches, tournamentMembers, potMap]);

  const totalMatches = uclMatches.length;
  const playedMatches = uclMatches.filter(m => m.played).length;
  const progress = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;
  const cutoffs = useMemo(() => computeUCLCutoffs(tournamentMembers.length), [tournamentMembers.length]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-light-900 dark:text-white">League Phase</h2>
          <p className="text-sm text-light-500 dark:text-gray-500">{playedMatches} / {totalMatches} played</p>
        </div>
        <span className="text-xs font-semibold text-light-500 dark:text-gray-500 tabular-nums">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-light-300 dark:bg-dark-200 rounded-full h-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="bg-gradient-to-r from-cyber-500 to-electric-500 h-1 rounded-full"
        />
      </div>

      {/* Zone legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-light-500 dark:text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm border-l-2 border-green-500" />
          <span>Direct ({cutoffs.direct})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm border-l-2 border-cyber-500/60" />
          <span>Playoff ({cutoffs.playoffPool})</span>
        </div>
        {cutoffs.eliminated > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm border-l-2 border-white/20" />
            <span>Out ({cutoffs.eliminated})</span>
          </div>
        )}
      </div>

      {/* Standings table */}
      <Card variant="glass">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider w-8">#</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">Player</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">Pot</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">P</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">W</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">D</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">L</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">GF</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">GA</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">GD</th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">Pts</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-light-500 dark:text-gray-500 uppercase tracking-wider">Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => {
                const isDirect = s.zone === 'direct';
                const isElim = s.zone === 'eliminated';
                const isLastDirect = isDirect && idx === cutoffs.direct - 1;
                const isLastPlayoff = s.zone === 'playoff' && idx === cutoffs.direct + cutoffs.playoffPool - 1;

                const leftBorder = isDirect
                  ? 'border-l-2 border-green-500'
                  : s.zone === 'playoff'
                    ? 'border-l-2 border-cyber-500/40'
                    : 'border-l-2 border-transparent';

                return (
                  <React.Fragment key={s.memberId}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isDirect ? 'bg-green-500/5' : ''} ${isElim ? 'opacity-40' : ''}`}
                    >
                      <td className={`px-2 py-2.5 whitespace-nowrap ${leftBorder}`}>
                        <span className="text-xs font-bold text-light-700 dark:text-gray-300 tabular-nums">{s.position}</span>
                      </td>

                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPlayer(s.playerName)}
                          className="text-sm font-semibold text-light-900 dark:text-white hover:text-cyber-400 dark:hover:text-cyber-400 transition-colors text-left"
                        >
                          {s.playerName}
                        </button>
                      </td>

                      <td className="px-2 py-2.5 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-light-200/60 dark:bg-white/5 text-light-500 dark:text-gray-500">{s.potName}</span>
                      </td>

                      <td className="px-2 py-2.5 text-center text-xs text-light-700 dark:text-gray-400 tabular-nums">{s.played}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-light-700 dark:text-gray-400 tabular-nums">{s.won}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-light-700 dark:text-gray-400 tabular-nums">{s.drawn}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-light-700 dark:text-gray-400 tabular-nums">{s.lost}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-light-700 dark:text-gray-400 tabular-nums hidden sm:table-cell">{s.goalsFor}</td>
                      <td className="px-2 py-2.5 text-center text-xs text-light-700 dark:text-gray-400 tabular-nums hidden sm:table-cell">{s.goalsAgainst}</td>

                      <td className="px-2 py-2.5 text-center text-xs font-semibold tabular-nums">
                        <span className={s.goalDifference > 0 ? 'text-green-500' : s.goalDifference < 0 ? 'text-red-400' : 'text-light-500 dark:text-gray-500'}>
                          {s.goalDifference > 0 ? '+' : ''}{s.goalDifference}
                        </span>
                      </td>

                      <td className="px-2 py-2.5 text-center whitespace-nowrap">
                        <span className="text-sm font-bold text-light-900 dark:text-white tabular-nums">{s.points}</span>
                      </td>

                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <FormBar form={s.form} />
                      </td>
                    </motion.tr>

                    {isLastDirect && (
                      <tr>
                        <td colSpan={12} className="px-3 py-1 bg-green-500/5 border-b border-green-500/20">
                          <span className="text-[10px] text-green-500/70 font-medium tracking-wide uppercase">Direct knockout ↑</span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

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
