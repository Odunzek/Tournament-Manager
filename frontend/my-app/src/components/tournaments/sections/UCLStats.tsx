"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Shield, TrendingUp, Zap } from 'lucide-react';
import { Tournament, TournamentParticipant } from '@/lib/tournamentUtils';
import type { UCLMatch } from '@/lib/uclUtils';
import Card from '../../ui/Card';

interface UCLStatsProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
  uclMatches: UCLMatch[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface PlayerStat {
  name: string;
  value: number;
  detail?: string;
}

export default function UCLStats({ uclMatches, tournamentMembers }: UCLStatsProps) {
  const playedMatches = useMemo(() => uclMatches.filter(m => m.played), [uclMatches]);

  const playerStats = useMemo(() => {
    const stats: Record<string, {
      name: string;
      goalsFor: number;
      goalsAgainst: number;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      cleanSheets: number;
    }> = {};

    for (const m of tournamentMembers) {
      if (!m.id) continue;
      stats[m.id] = {
        name: m.name,
        goalsFor: 0, goalsAgainst: 0,
        played: 0, wins: 0, draws: 0, losses: 0, cleanSheets: 0,
      };
    }

    for (const m of playedMatches) {
      const a = stats[m.playerAId];
      const b = stats[m.playerBId];
      if (!a || !b) continue;

      const sA = m.scoreA ?? 0;
      const sB = m.scoreB ?? 0;

      a.played++; b.played++;
      a.goalsFor += sA; a.goalsAgainst += sB;
      b.goalsFor += sB; b.goalsAgainst += sA;

      if (sA > sB)      { a.wins++; b.losses++; }
      else if (sA < sB) { b.wins++; a.losses++; }
      else              { a.draws++; b.draws++; }

      if (sB === 0) a.cleanSheets++;
      if (sA === 0) b.cleanSheets++;
    }

    return Object.values(stats).filter(s => s.played > 0);
  }, [playedMatches, tournamentMembers]);

  // Derived leaderboards
  const topScorers = useMemo<PlayerStat[]>(() =>
    [...playerStats]
      .sort((a, b) => b.goalsFor - a.goalsFor || b.played - a.played)
      .slice(0, 5)
      .map(s => ({ name: s.name, value: s.goalsFor, detail: `in ${s.played} games` })),
    [playerStats]);

  const bestAttack = useMemo<PlayerStat[]>(() =>
    [...playerStats]
      .filter(s => s.played > 0)
      .sort((a, b) => b.goalsFor / b.played - a.goalsFor / a.played)
      .slice(0, 5)
      .map(s => ({ name: s.name, value: parseFloat((s.goalsFor / s.played).toFixed(2)), detail: 'goals / game' })),
    [playerStats]);

  const bestDefence = useMemo<PlayerStat[]>(() =>
    [...playerStats]
      .filter(s => s.played > 0)
      .sort((a, b) => a.goalsAgainst / a.played - b.goalsAgainst / b.played)
      .slice(0, 5)
      .map(s => ({ name: s.name, value: parseFloat((s.goalsAgainst / s.played).toFixed(2)), detail: 'conceded / game' })),
    [playerStats]);

  const mostWins = useMemo<PlayerStat[]>(() =>
    [...playerStats]
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
      .slice(0, 5)
      .map(s => ({ name: s.name, value: s.wins, detail: `${s.losses}L ${s.draws}D` })),
    [playerStats]);

  const cleanSheets = useMemo<PlayerStat[]>(() =>
    [...playerStats]
      .sort((a, b) => b.cleanSheets - a.cleanSheets)
      .filter(s => s.cleanSheets > 0)
      .slice(0, 5)
      .map(s => ({ name: s.name, value: s.cleanSheets, detail: `in ${s.played} games` })),
    [playerStats]);

  // Top single match (biggest win)
  const biggestWin = useMemo(() => {
    let best: { winner: string; loser: string; score: string; diff: number } | null = null;
    for (const m of playedMatches) {
      const sA = m.scoreA ?? 0;
      const sB = m.scoreB ?? 0;
      const diff = Math.abs(sA - sB);
      if (!best || diff > best.diff || (diff === best.diff && Math.max(sA, sB) > parseInt(best.score))) {
        if (sA !== sB) {
          best = {
            winner: sA > sB ? m.playerAName : m.playerBName,
            loser: sA > sB ? m.playerBName : m.playerAName,
            score: sA > sB ? `${sA}-${sB}` : `${sB}-${sA}`,
            diff,
          };
        }
      }
    }
    return best;
  }, [playedMatches]);

  const totalGoals = useMemo(() =>
    playedMatches.reduce((sum, m) => sum + (m.scoreA ?? 0) + (m.scoreB ?? 0), 0),
    [playedMatches]);

  const avgGoals = playedMatches.length > 0
    ? (totalGoals / playedMatches.length).toFixed(2)
    : '—';

  if (playedMatches.length === 0) {
    return (
      <div className="text-center py-16">
        <TrendingUp className="w-12 h-12 text-light-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-light-600 dark:text-gray-400">Stats will appear once matches are played.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-light-900 dark:text-white">League Stats</h2>
        <p className="text-sm text-light-600 dark:text-gray-400">
          {playedMatches.length} matches played · {totalGoals} goals · {avgGoals} per game
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Matches', value: playedMatches.length },
          { label: 'Total Goals', value: totalGoals },
          { label: 'Avg Goals', value: avgGoals },
          { label: 'Clean Sheets', value: cleanSheets.reduce((s, p) => s + p.value, 0) },
        ].map(stat => (
          <div key={stat.label} className="bg-white/90 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-cyber-600 dark:text-cyber-400">{stat.value}</p>
            <p className="text-[10px] text-light-600 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Biggest win callout */}
      {biggestWin && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-light-900 dark:text-white">
            <span className="font-bold">{biggestWin.winner}</span>
            <span className="text-light-600 dark:text-gray-400"> beat </span>
            <span className="font-bold">{biggestWin.loser}</span>
            <span className="text-yellow-400 font-bold ml-2">{biggestWin.score}</span>
          </p>
          <span className="ml-auto text-[10px] text-light-500 dark:text-gray-500 shrink-0">Biggest Win</span>
        </div>
      )}

      {/* Leaderboard grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LeaderboardCard title="Top Scorers" icon={<Trophy className="w-4 h-4 text-yellow-400" />} rows={topScorers} unit="goals" />
        <LeaderboardCard title="Most Wins" icon={<Target className="w-4 h-4 text-green-400" />} rows={mostWins} unit="wins" />
        <LeaderboardCard title="Best Attack" icon={<TrendingUp className="w-4 h-4 text-cyber-400" />} rows={bestAttack} unit="avg" />
        <LeaderboardCard title="Best Defence" icon={<Shield className="w-4 h-4 text-electric-400" />} rows={bestDefence} unit="avg" reverse />
      </div>
    </div>
  );
}

function LeaderboardCard({
  title,
  icon,
  rows,
  unit,
  reverse = false,
}: {
  title: string;
  icon: React.ReactNode;
  rows: PlayerStat[];
  unit: string;
  reverse?: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <Card variant="glass">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-bold text-light-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] w-4 text-light-500 dark:text-gray-500 font-bold">{i + 1}</span>
            <span className="flex-1 text-xs font-semibold text-light-900 dark:text-white truncate">{row.name}</span>
            {row.detail && (
              <span className="text-[10px] text-light-500 dark:text-gray-500 shrink-0">{row.detail}</span>
            )}
            <span className={`text-sm font-black shrink-0 tabular-nums ${
              i === 0 ? (reverse ? 'text-electric-400' : 'text-cyber-400') : 'text-light-700 dark:text-gray-300'
            }`}>
              {row.value}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
