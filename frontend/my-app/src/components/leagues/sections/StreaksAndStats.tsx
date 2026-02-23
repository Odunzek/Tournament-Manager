"use client";

import React, { useState } from 'react';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { WinStreak, LeaguePlayer } from '@/types/league';
import Card from '../../ui/Card';
import WinStreakCard from '../WinStreakCard';

interface StreaksAndStatsProps {
  streaks: WinStreak[];
  standings: LeaguePlayer[];
  isLoading: boolean;
}

export default function StreaksAndStats({ streaks, standings, isLoading }: StreaksAndStatsProps) {
  const [currentTab, setCurrentTab] = useState<'win' | 'unbeaten' | 'alltime'>('win');

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-light-600 dark:text-gray-400">Loading streaks...</p>
      </div>
    );
  }

  // Current win streaks (top 3)
  const currentWinStreaks = streaks
    .filter((s) => s.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 3);

  // Current unbeaten runs (top 3)
  const currentUnbeatenStreaks = streaks
    .filter((s) => s.currentUnbeaten > 0)
    .sort((a, b) => b.currentUnbeaten - a.currentUnbeaten)
    .slice(0, 3)
    .map((s) => ({ ...s, currentStreak: s.currentUnbeaten }));

  // All-time best win streaks (top 3, only those with at least 1)
  const allTimeList = [...streaks]
    .sort((a, b) => b.longestStreak - a.longestStreak)
    .slice(0, 3)
    .filter((s) => s.longestStreak > 0);

  const activeList =
    currentTab === 'win'
      ? currentWinStreaks
      : currentTab === 'unbeaten'
      ? currentUnbeatenStreaks
      : allTimeList;

  const showCurrentForTab = currentTab !== 'alltime';

  const emptyLabel =
    currentTab === 'win'
      ? 'No active win streaks'
      : currentTab === 'unbeaten'
      ? 'No active unbeaten runs'
      : 'No streaks recorded yet';

  const emptyIcon =
    currentTab === 'alltime' ? (
      <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
    ) : (
      <Flame className="w-10 h-10 text-gray-600 mx-auto mb-3" />
    );

  // League leaders — qualified (3+ games)
  const qualifiedPlayers = standings.filter((p) => p.played >= 3);

  const highestWinRate =
    qualifiedPlayers.length > 0
      ? [...qualifiedPlayers].sort(
          (a, b) => b.won / b.played - a.won / a.played
        )[0]
      : null;

  const bestGoalsPerGame =
    qualifiedPlayers.length > 0
      ? [...qualifiedPlayers].sort(
          (a, b) => b.goalsFor / b.played - a.goalsFor / a.played
        )[0]
      : null;

  const bestDefense =
    qualifiedPlayers.length > 0
      ? [...qualifiedPlayers].sort(
          (a, b) => a.goalsAgainst / a.played - b.goalsAgainst / b.played
        )[0]
      : null;

  const worstDefense =
    qualifiedPlayers.length > 0
      ? [...qualifiedPlayers].sort(
          (a, b) => b.goalsAgainst / b.played - a.goalsAgainst / a.played
        )[0]
      : null;

  const topGD =
    standings.length > 0
      ? [...standings].sort((a, b) => b.goalDifference - a.goalDifference)[0]
      : null;

  const mostDraws =
    standings.length > 0
      ? [...standings].sort((a, b) => b.draw - a.draw)[0]
      : null;

  const formScore = (p: LeaguePlayer) =>
    p.form.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);

  const bestForm =
    standings.length > 0
      ? [...standings].sort((a, b) => formScore(b) - formScore(a))[0]
      : null;

  // Stat rows definition — skip row if player is null
  const statRows: {
    label: string;
    player: LeaguePlayer | null;
    value: string;
    dotColor: string;
    textColor: string;
  }[] = [
    {
      label: 'Win Rate',
      player: highestWinRate,
      value: highestWinRate
        ? `${((highestWinRate.won / highestWinRate.played) * 100).toFixed(1)}%`
        : '',
      dotColor: 'bg-green-400',
      textColor: 'text-green-400',
    },
    {
      label: 'Goals/Game',
      player: bestGoalsPerGame,
      value: bestGoalsPerGame
        ? (bestGoalsPerGame.goalsFor / bestGoalsPerGame.played).toFixed(2)
        : '',
      dotColor: 'bg-orange-400',
      textColor: 'text-orange-400',
    },
    {
      label: 'Best Defense',
      player: bestDefense,
      value: bestDefense
        ? (bestDefense.goalsAgainst / bestDefense.played).toFixed(2)
        : '',
      dotColor: 'bg-electric-400',
      textColor: 'text-electric-400',
    },
    {
      label: 'Top GD',
      player: topGD,
      value: topGD
        ? topGD.goalDifference > 0
          ? `+${topGD.goalDifference}`
          : String(topGD.goalDifference)
        : '',
      dotColor: 'bg-cyber-400',
      textColor: 'text-cyber-400',
    },
    {
      label: 'Best Form',
      player: bestForm,
      value: bestForm ? `${formScore(bestForm)} / 15` : '',
      dotColor: 'bg-yellow-400',
      textColor: 'text-yellow-400',
    },
    {
      label: 'Most Draws',
      player: mostDraws,
      value: mostDraws ? String(mostDraws.draw) : '',
      dotColor: 'bg-slate-400',
      textColor: 'text-slate-400',
    },
    {
      label: 'Worst Defense',
      player: worstDefense,
      value: worstDefense
        ? (worstDefense.goalsAgainst / worstDefense.played).toFixed(2)
        : '',
      dotColor: 'bg-rose-400',
      textColor: 'text-rose-400',
    },
  ].filter((row) => row.player !== null);

  return (
    <div className="space-y-4">
      {/* Streaks — 3-tab: Win · Unbeaten · All-Time */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-light-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Streaks
          </h2>
          <div className="flex items-center gap-1 bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentTab('win')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                currentTab === 'win'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white'
              }`}
            >
              Win
            </button>
            <button
              onClick={() => setCurrentTab('unbeaten')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                currentTab === 'unbeaten'
                  ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30'
                  : 'text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white'
              }`}
            >
              Unbeaten
            </button>
            <button
              onClick={() => setCurrentTab('alltime')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                currentTab === 'alltime'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white'
              }`}
            >
              All-Time
            </button>
          </div>
        </div>

        {activeList.length > 0 ? (
          <div className="space-y-2">
            {activeList.map((streak, index) => (
              <WinStreakCard
                key={streak.playerId}
                streak={streak}
                rank={index + 1}
                showCurrent={showCurrentForTab}
              />
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-8">
              {emptyIcon}
              <p className="text-light-600 dark:text-gray-400 text-sm">{emptyLabel}</p>
            </div>
          </Card>
        )}
      </div>

      {/* League Leaders — compact row list */}
      {statRows.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyber-400" />
            League Leaders
          </h2>

          <Card variant="glass" className="!px-3 !py-1">
            {statRows.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center gap-2.5 py-2.5 ${
                  i < statRows.length - 1 ? 'border-b border-white/5 dark:border-white/5' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${row.dotColor}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-light-500 dark:text-gray-500 w-[72px] shrink-0">
                  {row.label}
                </span>
                <span className="flex-1 text-sm font-medium text-light-900 dark:text-white truncate min-w-0">
                  {row.player!.name}
                </span>
                <span className={`text-sm font-bold shrink-0 ${row.textColor}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
