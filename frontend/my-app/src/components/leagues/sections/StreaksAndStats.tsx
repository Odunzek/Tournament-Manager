"use client";

import React, { useState } from 'react';
import { Flame, Trophy, TrendingUp, ShieldCheck } from 'lucide-react';
import { WinStreak, LeaguePlayer } from '@/types/league';
import Card from '../../ui/Card';
import WinStreakCard from '../WinStreakCard';

interface StreaksAndStatsProps {
  streaks: WinStreak[];
  standings: LeaguePlayer[];
  isLoading: boolean;
}

export default function StreaksAndStats({ streaks, standings, isLoading }: StreaksAndStatsProps) {
  const [currentTab, setCurrentTab] = useState<'win' | 'unbeaten'>('win');

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

  // Current unbeaten runs (top 3) — only show if > win streak alone
  const currentUnbeatenStreaks = streaks
    .filter((s) => s.currentUnbeaten > 0)
    .sort((a, b) => b.currentUnbeaten - a.currentUnbeaten)
    .slice(0, 3)
    .map((s) => ({ ...s, currentStreak: s.currentUnbeaten })); // reuse card with unbeaten value

  // All-time best win streaks (top 3)
  const allTimeBestStreaks = [...streaks]
    .sort((a, b) => b.longestStreak - a.longestStreak)
    .slice(0, 3);

  // League leaders
  const qualifiedPlayers = standings.filter((p) => p.played >= 3);

  const highestWinRate =
    qualifiedPlayers.length > 0
      ? [...qualifiedPlayers].sort((a, b) => {
          const winRateA = a.played > 0 ? a.won / a.played : 0;
          const winRateB = b.played > 0 ? b.won / b.played : 0;
          return winRateB - winRateA;
        })[0]
      : null;

  const topScorer =
    standings.length > 0 ? [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0] : null;

  const bestDefense =
    standings.length > 0
      ? [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0]
      : null;

  const bestGoalsPerGame =
    qualifiedPlayers.length > 0
      ? [...qualifiedPlayers].sort(
          (a, b) => b.goalsFor / b.played - a.goalsFor / a.played
        )[0]
      : null;

  const activeList = currentTab === 'win' ? currentWinStreaks : currentUnbeatenStreaks;
  const emptyWinLabel = 'No active win streaks';
  const emptyUnbeatenLabel = 'No active unbeaten runs';

  return (
    <div className="space-y-4">
      {/* Current Streaks — tabbed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-light-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Current Streaks
          </h2>
          {/* Tabs */}
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
          </div>
        </div>

        {activeList.length > 0 ? (
          <div className="space-y-2">
            {activeList.map((streak, index) => (
              <WinStreakCard key={streak.playerId} streak={streak} rank={index + 1} showCurrent={true} />
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-8">
              <Flame className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-light-600 dark:text-gray-400 text-sm">
                {currentTab === 'win' ? emptyWinLabel : emptyUnbeatenLabel}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* All-Time Best Win Streaks */}
      <div>
        <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          All-Time Best Streaks
        </h2>

        {allTimeBestStreaks.length > 0 && allTimeBestStreaks[0].longestStreak > 0 ? (
          <div className="space-y-2">
            {allTimeBestStreaks.map((streak, index) => (
              <WinStreakCard key={streak.playerId} streak={streak} rank={index + 1} showCurrent={false} />
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-light-600 dark:text-gray-400 text-sm">No streaks recorded yet</p>
            </div>
          </Card>
        )}
      </div>

      {/* League Leaders */}
      {standings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-light-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyber-400" />
            League Leaders
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {highestWinRate && (
              <Card variant="glass" className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30 !p-3">
                <div className="text-center">
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Win Rate</p>
                  <p className="text-sm font-bold text-light-900 dark:text-white mb-1 truncate">{highestWinRate.name}</p>
                  <p className="text-xl font-black text-green-400">
                    {highestWinRate.played > 0 && highestWinRate.won !== undefined
                      ? ((highestWinRate.won / highestWinRate.played) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mt-1">
                    {highestWinRate.won}W / {highestWinRate.played}P
                  </p>
                </div>
              </Card>
            )}

            {bestGoalsPerGame && (
              <Card variant="glass" className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 !p-3">
                <div className="text-center">
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Goals / Game</p>
                  <p className="text-sm font-bold text-light-900 dark:text-white mb-1 truncate">{bestGoalsPerGame.name}</p>
                  <p className="text-xl font-black text-orange-400">
                    {(bestGoalsPerGame.goalsFor / bestGoalsPerGame.played).toFixed(1)}
                  </p>
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mt-1">
                    {bestGoalsPerGame.goalsFor}G / {bestGoalsPerGame.played}P
                  </p>
                </div>
              </Card>
            )}

            {topScorer && (
              <Card variant="glass" className="bg-gradient-to-br from-cyber-500/20 to-cyber-600/20 border-cyber-500/30 !p-3">
                <div className="text-center">
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Most Goals</p>
                  <p className="text-sm font-bold text-light-900 dark:text-white mb-1 truncate">{topScorer.name}</p>
                  <p className="text-xl font-black text-cyber-400">{topScorer.goalsFor || 0}</p>
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mt-1">goals scored</p>
                </div>
              </Card>
            )}

            {bestDefense && (
              <Card variant="glass" className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-electric-500/30 !p-3">
                <div className="text-center">
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Best Defense</p>
                  <p className="text-sm font-bold text-light-900 dark:text-white mb-1 truncate">{bestDefense.name}</p>
                  <p className="text-xl font-black text-electric-400">{bestDefense.goalsAgainst || 0}</p>
                  <p className="text-[10px] text-light-600 dark:text-gray-400 mt-1">goals conceded</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
