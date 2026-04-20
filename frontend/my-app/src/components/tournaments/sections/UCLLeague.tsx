"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, ArrowRight, ArrowDown } from 'lucide-react';
import { Tournament, TournamentParticipant } from '@/lib/tournamentUtils';
import { UCLMatch, computeLeagueStandings, applyZones, computeUCLCutoffs, UCLStanding } from '@/lib/uclUtils';
import Card from '../../ui/Card';

interface UCLLeagueProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
  uclMatches: UCLMatch[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

function getPositionBadge(pos: number) {
  if (pos === 1) return <div className="flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-yellow-400" /><span className="font-bold text-yellow-400 text-xs">1</span></div>;
  if (pos === 2) return <div className="flex items-center gap-1"><Medal className="w-3.5 h-3.5 text-light-400 dark:text-gray-300" /><span className="font-bold text-light-500 dark:text-gray-300 text-xs">2</span></div>;
  if (pos === 3) return <div className="flex items-center gap-1"><Medal className="w-3.5 h-3.5 text-orange-400" /><span className="font-bold text-orange-400 text-xs">3</span></div>;
  return <span className="font-bold text-light-600 dark:text-gray-400 text-xs">{pos}</span>;
}

function FormBar({ form }: { form: ('W' | 'D' | 'L')[] }) {
  if (!form?.length) return <span className="text-xs text-light-500 dark:text-gray-500">—</span>;
  const colors = { W: 'bg-green-500', D: 'bg-yellow-500', L: 'bg-red-500' };
  return (
    <div className="flex gap-0.5">
      {form.slice(0, 5).map((r, i) => <div key={i} className={`w-1.5 h-4 ${colors[r]} rounded-sm`} />)}
    </div>
  );
}

export default function UCLLeague({ tournament, tournamentMembers, uclMatches, isAuthenticated, isLoading }: UCLLeagueProps) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-light-900 dark:text-white">League Phase</h2>
          <p className="text-sm text-light-600 dark:text-gray-400">{playedMatches} / {totalMatches} matches played</p>
        </div>
        <div className="bg-light-100/50 dark:bg-dark-100/50 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5">
          <span className="text-xs text-light-600 dark:text-gray-400">{progress}% complete</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-light-300 dark:bg-dark-200 rounded-full h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="bg-gradient-to-r from-cyber-500 to-electric-500 h-1.5 rounded-full"
        />
      </div>

      {/* Zone legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border-l-2 border-green-500 bg-green-500/10" /><span className="text-light-600 dark:text-gray-400">↑ Direct to knockout ({cutoffs.direct})</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyber-500/10 border border-cyber-500/20" /><span className="text-light-600 dark:text-gray-400">⚔ Playoff ({cutoffs.playoffPool})</span></div>
        {cutoffs.eliminated > 0 && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/10 border border-red-500/20" /><span className="text-light-600 dark:text-gray-400">✗ Eliminated ({cutoffs.eliminated})</span></div>}
      </div>

      {/* Standings table */}
      <Card variant="glass">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider w-8">Pos</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Pot</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">P</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">W</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">D</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">L</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">GF</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">GA</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">GD</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">Pts</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-light-600 dark:text-gray-400 uppercase tracking-wider">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => {
                  const isDirect = s.zone === 'direct';
                  const isElim = s.zone === 'eliminated';
                  const isLastDirect = isDirect && idx === cutoffs.direct - 1;
                  const isLastPlayoff = s.zone === 'playoff' && idx === cutoffs.direct + cutoffs.playoffPool - 1;

                  return (
                    <React.Fragment key={s.memberId}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        className={`
                          border-b border-light-300/50 dark:border-white/5 transition-all duration-200
                          hover:bg-cyber-500/10 hover:shadow-light-cyber dark:hover:shadow-glow
                          ${isDirect ? 'bg-gradient-to-r from-green-500/8 to-transparent' : ''}
                          ${isElim ? 'opacity-45' : ''}
                        `}
                      >
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className={`${isDirect ? 'pl-0.5 border-l-2 border-green-500' : isElim ? 'border-l-2 border-red-500/30 pl-0.5' : 'pl-1'}`}>
                            {getPositionBadge(s.position)}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`font-bold text-sm ${isElim ? 'text-light-500 dark:text-gray-500' : 'text-cyber-400'}`}>{s.playerName}</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap hidden sm:table-cell">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-light-200/70 dark:bg-dark-100/70 text-light-600 dark:text-gray-400">{s.potName}</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-light-900 dark:text-white">{s.played}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-green-400">{s.won}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-yellow-400">{s.drawn}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-red-400">{s.lost}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-light-900 dark:text-white hidden sm:table-cell">{s.goalsFor}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-light-900 dark:text-white hidden sm:table-cell">{s.goalsAgainst}</td>
                        <td className={`px-2 py-2 whitespace-nowrap text-xs font-semibold ${s.goalDifference > 0 ? 'text-green-400' : s.goalDifference < 0 ? 'text-red-400' : 'text-light-600 dark:text-gray-400'}`}>
                          {s.goalDifference > 0 ? '+' : ''}{s.goalDifference}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`text-sm font-bold ${isElim ? 'text-light-500 dark:text-gray-500' : 'text-cyber-400'}`}>{s.points}</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap"><FormBar form={s.form} /></td>
                      </motion.tr>

                      {/* Zone separator rows */}
                      {isLastDirect && (
                        <tr className="border-b border-green-500/30">
                          <td colSpan={12} className="px-2 py-0.5 bg-green-500/5">
                            <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold">
                              <ArrowRight className="w-3 h-3" />
                              <span>Direct qualifiers — advance to knockout</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isLastPlayoff && cutoffs.eliminated > 0 && (
                        <tr className="border-b border-red-500/30">
                          <td colSpan={12} className="px-2 py-0.5 bg-red-500/5">
                            <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold">
                              <ArrowDown className="w-3 h-3" />
                              <span>Eliminated below</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

    </div>
  );
}
