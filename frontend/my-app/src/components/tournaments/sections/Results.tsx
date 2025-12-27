/**
 * Tournament Results & Insights Section
 *
 * Provides comprehensive analytics and insights for completed/ongoing tournaments:
 * - Tournament Summary (Champion, Runner-up)
 * - Performance Analytics (Top teams, records, bar charts)
 *
 * @component
 */

"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, ChevronDown, Award, Target, Zap } from 'lucide-react';
import { Tournament, TournamentParticipant } from '@/lib/tournamentUtils';
import Card from '../../ui/Card';

interface ResultsProps {
  tournament: Tournament;
  tournamentMembers: TournamentParticipant[];
}

export default function Results({ tournament, tournamentMembers }: ResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'analytics', 'groups'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  /**
   * Calculate all matches from groups and knockout
   */
  const allMatches = useMemo(() => {
    const matches: any[] = [];

    // Group matches
    tournament.groups?.forEach(group => {
      group.matches.forEach(match => {
        if (match.played) {
          matches.push({
            ...match,
            phase: 'group',
            groupName: group.name,
          });
        }
      });
    });

    // Knockout matches
    tournament.knockoutBracket?.forEach(tie => {
      if (tie.firstLeg?.played) {
        matches.push({
          ...tie.firstLeg,
          phase: 'knockout',
          round: tie.round,
        });
      }
      if (tie.secondLeg?.played) {
        matches.push({
          ...tie.secondLeg,
          phase: 'knockout',
          round: tie.round,
        });
      }
    });

    return matches;
  }, [tournament]);

  /**
   * Get champion and runner-up
   */
  const { champion, runnerUp } = useMemo(() => {
    if (tournament.status !== 'completed' || !tournament.knockoutBracket) {
      return { champion: null, runnerUp: null };
    }

    const finalTie = tournament.knockoutBracket.find(tie => tie.round === 'final');
    if (!finalTie || !finalTie.winner) {
      return { champion: null, runnerUp: null };
    }

    const champion = finalTie.winner;
    const runnerUp = finalTie.team1 === champion ? finalTie.team2 : finalTie.team1;

    return { champion, runnerUp };
  }, [tournament]);

  /**
   * Calculate performance analytics
   */
  const analytics = useMemo(() => {
    const teamStats: Record<string, {
      name: string;
      goalsFor: number;
      goalsAgainst: number;
      wins: number;
      cleanSheets: number;
    }> = {};

    // Initialize team stats
    tournamentMembers.forEach(member => {
      teamStats[member.name] = {
        name: member.name,
        goalsFor: 0,
        goalsAgainst: 0,
        wins: 0,
        cleanSheets: 0,
      };
    });

    // Calculate stats from matches
    allMatches.forEach(match => {
      const homeTeam = teamStats[match.homeTeam];
      const awayTeam = teamStats[match.awayTeam];

      if (homeTeam && awayTeam) {
        homeTeam.goalsFor += match.homeScore || 0;
        homeTeam.goalsAgainst += match.awayScore || 0;
        awayTeam.goalsFor += match.awayScore || 0;
        awayTeam.goalsAgainst += match.homeScore || 0;

        if ((match.homeScore || 0) > (match.awayScore || 0)) {
          homeTeam.wins++;
        } else if ((match.awayScore || 0) > (match.homeScore || 0)) {
          awayTeam.wins++;
        }

        if (match.awayScore === 0) homeTeam.cleanSheets++;
        if (match.homeScore === 0) awayTeam.cleanSheets++;
      }
    });

    const teams = Object.values(teamStats);

    // Find top performers
    const topScorer = teams.reduce((prev, curr) =>
      curr.goalsFor > prev.goalsFor ? curr : prev
    , teams[0] || { name: 'N/A', goalsFor: 0 });

    const bestDefense = teams.reduce((prev, curr) =>
      curr.goalsAgainst < prev.goalsAgainst ? curr : prev
    , teams[0] || { name: 'N/A', goalsAgainst: 0 });

    const mostWins = teams.reduce((prev, curr) =>
      curr.wins > prev.wins ? curr : prev
    , teams[0] || { name: 'N/A', wins: 0 });

    // Find biggest victory
    let biggestVictory = { margin: 0, match: '' };
    allMatches.forEach(match => {
      const margin = Math.abs((match.homeScore || 0) - (match.awayScore || 0));
      if (margin > biggestVictory.margin) {
        biggestVictory = {
          margin,
          match: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`
        };
      }
    });

    // Find highest scoring match
    let highestScoring = { totalGoals: 0, match: '' };
    allMatches.forEach(match => {
      const totalGoals = (match.homeScore || 0) + (match.awayScore || 0);
      if (totalGoals > highestScoring.totalGoals) {
        highestScoring = {
          totalGoals,
          match: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`
        };
      }
    });

    return {
      topScorer,
      bestDefense,
      mostWins,
      biggestVictory,
      highestScoring,
      totalMatches: allMatches.length,
      totalGoals: teams.reduce((sum, team) => sum + team.goalsFor, 0) / 2, // Divide by 2 to avoid double counting
    };
  }, [allMatches, tournamentMembers]);

  /**
   * Get top 5 teams by goals scored for bar chart
   */
  const topScoringTeams = useMemo(() => {
    const teamStats: Record<string, { name: string; goals: number }> = {};

    tournamentMembers.forEach(member => {
      teamStats[member.name] = { name: member.name, goals: 0 };
    });

    allMatches.forEach(match => {
      if (teamStats[match.homeTeam]) {
        teamStats[match.homeTeam].goals += match.homeScore || 0;
      }
      if (teamStats[match.awayTeam]) {
        teamStats[match.awayTeam].goals += match.awayScore || 0;
      }
    });

    return Object.values(teamStats)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [allMatches, tournamentMembers]);

  /**
   * Get top 5 teams by wins for bar chart
   */
  const topWinningTeams = useMemo(() => {
    const teamStats: Record<string, { name: string; wins: number }> = {};

    tournamentMembers.forEach(member => {
      teamStats[member.name] = { name: member.name, wins: 0 };
    });

    allMatches.forEach(match => {
      if ((match.homeScore || 0) > (match.awayScore || 0) && teamStats[match.homeTeam]) {
        teamStats[match.homeTeam].wins++;
      } else if ((match.awayScore || 0) > (match.homeScore || 0) && teamStats[match.awayTeam]) {
        teamStats[match.awayTeam].wins++;
      }
    });

    return Object.values(teamStats)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);
  }, [allMatches, tournamentMembers]);

  return (
    <div className="space-y-6">
      {/* Tournament Summary - Only show when completed */}
      {tournament.status === 'completed' && champion && (
        <CollapsibleSection
          id="summary"
          title="Tournament Summary"
          icon={<Trophy className="w-5 h-5" />}
          isExpanded={expandedSections.has('summary')}
          onToggle={() => toggleSection('summary')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Champion */}
            <Card variant="glass" className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/30">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-sm text-light-600 dark:text-gray-400 mb-1">Champion</p>
                <h3 className="text-2xl font-bold text-yellow-400">{champion}</h3>
              </div>
            </Card>

            {/* Runner-up */}
            <Card variant="glass" className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30">
              <div className="text-center">
                <Award className="w-12 h-12 text-light-600 dark:text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-light-600 dark:text-gray-400 mb-1">Runner-up</p>
                <h3 className="text-2xl font-bold text-light-700 dark:text-gray-300">{runnerUp}</h3>
              </div>
            </Card>
          </div>
        </CollapsibleSection>
      )}

      {/* Performance Analytics */}
      <CollapsibleSection
        id="analytics"
        title="Performance Analytics"
        icon={<TrendingUp className="w-5 h-5" />}
        isExpanded={expandedSections.has('analytics')}
        onToggle={() => toggleSection('analytics')}
      >
        <div className="space-y-6">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Top Scoring Team"
              value={analytics.topScorer.name}
              subValue={`${analytics.topScorer.goalsFor} goals`}
              icon={<Target className="w-6 h-6 text-cyber-400" />}
              color="cyber"
            />
            <StatCard
              label="Best Defense"
              value={analytics.bestDefense.name}
              subValue={`${analytics.bestDefense.goalsAgainst} conceded`}
              icon={<Trophy className="w-6 h-6 text-electric-400" />}
              color="electric"
            />
            <StatCard
              label="Most Wins"
              value={analytics.mostWins.name}
              subValue={`${analytics.mostWins.wins} victories`}
              icon={<Zap className="w-6 h-6 text-green-400" />}
              color="green"
            />
          </div>

          {/* Match Records */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="glass">
              <h4 className="text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">Biggest Victory</h4>
              <p className="text-lg font-bold text-light-900 dark:text-white">{analytics.biggestVictory.match || 'N/A'}</p>
              <p className="text-xs text-light-600 dark:text-gray-400 mt-1">{analytics.biggestVictory.margin} goal margin</p>
            </Card>

            <Card variant="glass">
              <h4 className="text-sm font-semibold text-light-700 dark:text-gray-300 mb-2">Highest Scoring Match</h4>
              <p className="text-lg font-bold text-light-900 dark:text-white">{analytics.highestScoring.match || 'N/A'}</p>
              <p className="text-xs text-light-600 dark:text-gray-400 mt-1">{analytics.highestScoring.totalGoals} total goals</p>
            </Card>
          </div>

          {/* Tournament Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="glass">
              <p className="text-xs text-light-600 dark:text-gray-400 mb-1">Total Matches</p>
              <p className="text-2xl font-bold text-cyber-400">{analytics.totalMatches}</p>
            </Card>
            <Card variant="glass">
              <p className="text-xs text-light-600 dark:text-gray-400 mb-1">Total Goals</p>
              <p className="text-2xl font-bold text-electric-400">{Math.round(analytics.totalGoals)}</p>
            </Card>
            <Card variant="glass">
              <p className="text-xs text-light-600 dark:text-gray-400 mb-1">Avg Goals/Match</p>
              <p className="text-2xl font-bold text-green-400">
                {analytics.totalMatches > 0 ? (analytics.totalGoals / analytics.totalMatches).toFixed(1) : '0.0'}
              </p>
            </Card>
            <Card variant="glass">
              <p className="text-xs text-light-600 dark:text-gray-400 mb-1">Teams</p>
              <p className="text-2xl font-bold text-pink-400">{tournamentMembers.length}</p>
            </Card>
          </div>

          {/* Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Scoring Teams Chart */}
            <Card variant="glass">
              <h4 className="text-sm font-semibold text-light-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyber-400" />
                Top Scoring Teams
              </h4>
              <div className="space-y-3">
                {topScoringTeams.map((team, index) => {
                  const maxGoals = topScoringTeams[0]?.goals || 1;
                  const percentage = (team.goals / maxGoals) * 100;

                  return (
                    <div key={team.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyber-500/20 text-cyber-400 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-light-900 dark:text-white font-medium truncate">{team.name}</span>
                        </div>
                        <span className="text-cyber-400 font-bold">{team.goals}</span>
                      </div>
                      <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-2 bg-gradient-to-r from-cyber-400 to-cyber-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
                {topScoringTeams.length === 0 && (
                  <p className="text-sm text-light-600 dark:text-gray-400 text-center py-4">No data available</p>
                )}
              </div>
            </Card>

            {/* Most Wins Chart */}
            <Card variant="glass">
              <h4 className="text-sm font-semibold text-light-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-electric-400" />
                Most Wins
              </h4>
              <div className="space-y-3">
                {topWinningTeams.map((team, index) => {
                  const maxWins = topWinningTeams[0]?.wins || 1;
                  const percentage = (team.wins / maxWins) * 100;

                  return (
                    <div key={team.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-electric-500/20 text-electric-400 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-light-900 dark:text-white font-medium truncate">{team.name}</span>
                        </div>
                        <span className="text-electric-400 font-bold">{team.wins}</span>
                      </div>
                      <div className="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-2 bg-gradient-to-r from-electric-400 to-electric-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
                {topWinningTeams.length === 0 && (
                  <p className="text-sm text-light-600 dark:text-gray-400 text-center py-4">No data available</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

/**
 * Collapsible Section Component
 */
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: CollapsibleSectionProps) {
  return (
    <Card variant="glass">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
      >
        <h2 className="text-xl font-bold text-light-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-light-600 dark:text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </Card>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: 'cyber' | 'electric' | 'green';
}

function StatCard({ label, value, subValue, icon, color }: StatCardProps) {
  const gradients = {
    cyber: 'from-cyber-500/20 to-cyber-600/20 border-cyber-500/30',
    electric: 'from-electric-500/20 to-electric-600/20 border-electric-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  };

  return (
    <Card variant="glass" className={`bg-gradient-to-br ${gradients[color]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-light-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-lg font-bold text-light-900 dark:text-white truncate">{value}</p>
          <p className="text-xs text-light-600 dark:text-gray-400 mt-1">{subValue}</p>
        </div>
      </div>
    </Card>
  );
}
