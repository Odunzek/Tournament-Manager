"use client";

import React from 'react';
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
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-light-600 dark:text-gray-400">Loading streaks...</p>
      </div>
    );
  }

  // Get current win streaks (active streaks > 0)
  const currentStreaks = streaks
    .filter((s) => s.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 5);

  // Get all-time best streaks
  const allTimeBestStreaks = streaks
    .sort((a, b) => b.longestStreak - a.longestStreak)
    .slice(0, 5);

  // Calculate additional stats from standings
  const highestWinRate =
    standings.length > 0
      ? standings
          .filter((p) => p.played >= 3) // Minimum 3 games
          .sort((a, b) => {
            const winRateA = a.played > 0 ? (a.won / a.played) * 100 : 0;
            const winRateB = b.played > 0 ? (b.won / b.played) * 100 : 0;
            return winRateB - winRateA;
          })[0]
      : null;

  const topScorer = standings.length > 0 ? standings.sort((a, b) => b.goalsFor - a.goalsFor)[0] : null;

  const bestDefense =
    standings.length > 0 ? standings.sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0] : null;

  return (
    <div className="space-y-6">
      {/* Current Win Streaks */}
      <div>
        <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          Current Win Streaks
        </h2>

        {currentStreaks.length > 0 ? (
          <div className="space-y-3">
            {currentStreaks.map((streak, index) => (
              <WinStreakCard key={streak.playerId} streak={streak} rank={index + 1} showCurrent={true} />
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-12">
              <Flame className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-light-600 dark:text-gray-400">No active win streaks</p>
              <p className="text-sm text-light-500 dark:text-gray-500 mt-1">Win consecutive matches to start a streak!</p>
            </div>
          </Card>
        )}
      </div>

      {/* All-Time Best Streaks */}
      <div>
        <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          All-Time Best Streaks
        </h2>

        {allTimeBestStreaks.length > 0 && allTimeBestStreaks[0].longestStreak > 0 ? (
          <div className="space-y-3">
            {allTimeBestStreaks.map((streak, index) => (
              <WinStreakCard key={streak.playerId} streak={streak} rank={index + 1} showCurrent={false} />
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-light-600 dark:text-gray-400">No streaks recorded yet</p>
            </div>
          </Card>
        )}
      </div>

      {/* Additional Stats */}
      {standings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyber-400" />
            League Leaders
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Highest Win Rate */}
            {highestWinRate && (
              <Card variant="glass" className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30">
                <div className="text-center">
                  <p className="text-xs text-light-600 dark:text-gray-400 mb-2">Highest Win Rate</p>
                  <p className="text-xl font-bold text-light-900 dark:text-white mb-1">{highestWinRate.name}</p>
                  <p className="text-2xl font-black text-green-400">
                    {highestWinRate.played > 0 && highestWinRate.won !== undefined
                      ? ((highestWinRate.won / highestWinRate.played) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </p>
                  <p className="text-xs text-light-600 dark:text-gray-400 mt-1">
                    ({highestWinRate.won}W / {highestWinRate.played}P)
                  </p>
                </div>
              </Card>
            )}

            {/* Top Scorer */}
            {topScorer && (
              <Card variant="glass" className="bg-gradient-to-br from-cyber-500/20 to-cyber-600/20 border-cyber-500/30">
                <div className="text-center">
                  <p className="text-xs text-light-600 dark:text-gray-400 mb-2">Most Goals Scored</p>
                  <p className="text-xl font-bold text-light-900 dark:text-white mb-1">{topScorer.name}</p>
                  <p className="text-2xl font-black text-cyber-400">{topScorer.goalsFor || 0}</p>
                  <p className="text-xs text-light-600 dark:text-gray-400 mt-1">goals</p>
                </div>
              </Card>
            )}

            {/* Best Defense */}
            {bestDefense && (
              <Card variant="glass" className="bg-gradient-to-br from-electric-500/20 to-electric-600/20 border-electric-500/30">
                <div className="text-center">
                  <p className="text-xs text-light-600 dark:text-gray-400 mb-2">Best Defense</p>
                  <p className="text-xl font-bold text-light-900 dark:text-white mb-1">{bestDefense.name}</p>
                  <p className="text-2xl font-black text-electric-400">{bestDefense.goalsAgainst || 0}</p>
                  <p className="text-xs text-light-600 dark:text-gray-400 mt-1">goals conceded</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
