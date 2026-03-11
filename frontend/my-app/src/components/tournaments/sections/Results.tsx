/**
 * Tournament Results & Insights Section
 */

"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, ChevronDown, Award, Target } from 'lucide-react';
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

  const allMatches = useMemo(() => {
    const matches: any[] = [];

    tournament.groups?.forEach(group => {
      group.matches.forEach(match => {
        if (match.played) {
          matches.push({ ...match, phase: 'group', groupName: group.name });
        }
      });
    });

    tournament.knockoutBracket?.forEach(tie => {
      if (tie.firstLeg?.played) {
        matches.push({ ...tie.firstLeg, phase: 'knockout', round: tie.round });
      }
      if (tie.secondLeg?.played) {
        matches.push({ ...tie.secondLeg, phase: 'knockout', round: tie.round });
      }
    });

    return matches;
  }, [tournament]);

  const { champion, runnerUp } = useMemo(() => {
    if (tournament.status !== 'completed' || !tournament.knockoutBracket) {
      return { champion: null, runnerUp: null };
    }
    const finalTie = tournament.knockoutBracket.find(tie => tie.round === 'final');
    if (!finalTie?.winner) return { champion: null, runnerUp: null };
    const champion = finalTie.winner;
    const runnerUp = finalTie.team1 === champion ? finalTie.team2 : finalTie.team1;
    return { champion, runnerUp };
  }, [tournament]);

  const analytics = useMemo(() => {
    // Initialise per-team accumulators
    const teamStats: Record<string, {
      name: string; goalsFor: number; goalsAgainst: number; played: number; wins: number; cleanSheets: number;
    }> = {};

    tournamentMembers.forEach(member => {
      teamStats[member.name] = { name: member.name, goalsFor: 0, goalsAgainst: 0, played: 0, wins: 0, cleanSheets: 0 };
    });

    // Aggregate stats from every played match
    allMatches.forEach(match => {
      const h = teamStats[match.homeTeam];
      const a = teamStats[match.awayTeam];
      if (h && a) {
        h.goalsFor     += match.homeScore || 0;
        h.goalsAgainst += match.awayScore || 0;
        a.goalsFor     += match.awayScore || 0;
        a.goalsAgainst += match.homeScore || 0;
        h.played++;
        a.played++;
        if ((match.homeScore || 0) > (match.awayScore || 0)) h.wins++;
        else if ((match.awayScore || 0) > (match.homeScore || 0)) a.wins++;
        if (match.awayScore === 0) h.cleanSheets++;
        if (match.homeScore === 0) a.cleanSheets++;
      }
    });

    const teams = Object.values(teamStats);
    const fallback = { name: 'N/A', goalsFor: 0, goalsAgainst: 0, played: 0, wins: 0, cleanSheets: 0 };

    // Best offense: most total goals scored
    const topScorer = teams.reduce((p, c) => c.goalsFor > p.goalsFor ? c : p, teams[0] || fallback);

    // Best defense: lowest average goals conceded per game (min 1 game played)
    const teamsWithGames = teams.filter(t => t.played > 0);
    const bestDefense = teamsWithGames.length > 0
      ? teamsWithGames.reduce((p, c) => {
          const cAvg = c.goalsAgainst / c.played;
          const pAvg = p.goalsAgainst / p.played;
          return cAvg < pAvg ? c : p;
        })
      : (teams[0] || fallback);

    const mostWins = teams.reduce((p, c) => c.wins > p.wins ? c : p, teams[0] || fallback);

    let biggestVictory = { margin: 0, match: '' };
    let highestScoring = { totalGoals: 0, match: '' };

    allMatches.forEach(match => {
      const margin = Math.abs((match.homeScore || 0) - (match.awayScore || 0));
      if (margin > biggestVictory.margin) {
        biggestVictory = { margin, match: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}` };
      }
      const totalGoals = (match.homeScore || 0) + (match.awayScore || 0);
      if (totalGoals > highestScoring.totalGoals) {
        highestScoring = { totalGoals, match: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}` };
      }
    });

    // Average goals conceded per game for the best defense
    const bestDefenseAvg = bestDefense.played > 0
      ? (bestDefense.goalsAgainst / bestDefense.played).toFixed(2)
      : '0.00';

    return {
      topScorer, bestDefense, bestDefenseAvg, mostWins, biggestVictory, highestScoring,
      totalMatches: allMatches.length,
      // Divide by 2 since each goal is counted once per team (home + away)
      totalGoals: teams.reduce((sum, t) => sum + t.goalsFor, 0) / 2,
    };
  }, [allMatches, tournamentMembers]);

  const topScoringTeams = useMemo(() => {
    const s: Record<string, { name: string; goals: number }> = {};
    tournamentMembers.forEach(m => { s[m.name] = { name: m.name, goals: 0 }; });
    allMatches.forEach(match => {
      if (s[match.homeTeam]) s[match.homeTeam].goals += match.homeScore || 0;
      if (s[match.awayTeam]) s[match.awayTeam].goals += match.awayScore || 0;
    });
    return Object.values(s).sort((a, b) => b.goals - a.goals).slice(0, 5);
  }, [allMatches, tournamentMembers]);

  const topWinningTeams = useMemo(() => {
    const s: Record<string, { name: string; wins: number }> = {};
    tournamentMembers.forEach(m => { s[m.name] = { name: m.name, wins: 0 }; });
    allMatches.forEach(match => {
      if ((match.homeScore || 0) > (match.awayScore || 0) && s[match.homeTeam]) s[match.homeTeam].wins++;
      else if ((match.awayScore || 0) > (match.homeScore || 0) && s[match.awayTeam]) s[match.awayTeam].wins++;
    });
    return Object.values(s).sort((a, b) => b.wins - a.wins).slice(0, 5);
  }, [allMatches, tournamentMembers]);

  return (
    <div className="space-y-3 sm:space-y-6">

      {/* Tournament Summary */}
      {tournament.status === 'completed' && champion && (
        <CollapsibleSection
          id="summary"
          title="Tournament Summary"
          icon={<Trophy className="w-4 h-4 sm:w-5 sm:h-5" />}
          isExpanded={expandedSections.has('summary')}
          onToggle={() => toggleSection('summary')}
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-6">
            <Card variant="glass" className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/30">
              <div className="text-center">
                <Trophy className="w-6 h-6 sm:w-12 sm:h-12 text-yellow-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400 mb-0.5">Champion</p>
                <h3 className="text-xs sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 truncate">{champion}</h3>
              </div>
            </Card>
            <Card variant="glass" className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30">
              <div className="text-center">
                <Award className="w-6 h-6 sm:w-12 sm:h-12 text-light-500 dark:text-gray-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400 mb-0.5">Runner-up</p>
                <h3 className="text-xs sm:text-2xl font-bold text-light-800 dark:text-gray-300 truncate">{runnerUp}</h3>
              </div>
            </Card>
          </div>
        </CollapsibleSection>
      )}

      {/* Performance Analytics */}
      <CollapsibleSection
        id="analytics"
        title="Performance Analytics"
        icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
        isExpanded={expandedSections.has('analytics')}
        onToggle={() => toggleSection('analytics')}
      >
        <div className="space-y-2 sm:space-y-6">

          {/* Best Defense — full width */}
          <StatCard
            label="Best Defense"
            value={analytics.bestDefense.name}
            subValue={`${analytics.bestDefenseAvg} conceded/game`}
            icon={<Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-electric-400" />}
            color="electric"
          />

          {/* Match Records — side by side on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Card variant="glass">
              <h4 className="text-[10px] sm:text-sm font-semibold text-light-700 dark:text-gray-300 mb-1">Biggest Victory</h4>
              <p className="text-xs sm:text-base font-bold text-light-900 dark:text-white truncate">{analytics.biggestVictory.match || 'N/A'}</p>
              <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mt-0.5">{analytics.biggestVictory.margin} goal margin</p>
            </Card>
            <Card variant="glass">
              <h4 className="text-[10px] sm:text-sm font-semibold text-light-700 dark:text-gray-300 mb-1">Highest Scoring</h4>
              <p className="text-xs sm:text-base font-bold text-light-900 dark:text-white truncate">{analytics.highestScoring.match || 'N/A'}</p>
              <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mt-0.5">{analytics.highestScoring.totalGoals} total goals</p>
            </Card>
          </div>

          {/* Tournament Totals — single card with 4 inline stats */}
          <Card variant="glass">
            <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10">
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Matches</p>
                <p className="text-base sm:text-2xl font-bold text-cyber-400">{analytics.totalMatches}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Goals</p>
                <p className="text-base sm:text-2xl font-bold text-electric-400">{Math.round(analytics.totalGoals)}</p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Avg/Match</p>
                <p className="text-base sm:text-2xl font-bold text-green-400">
                  {analytics.totalMatches > 0 ? (analytics.totalGoals / analytics.totalMatches).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="text-center px-2 py-1">
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mb-0.5">Teams</p>
                <p className="text-base sm:text-2xl font-bold text-pink-400">{tournamentMembers.length}</p>
              </div>
            </div>
          </Card>

          {/* Bar Charts — stacked on mobile but compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            <Card variant="glass">
              <h4 className="text-xs sm:text-sm font-semibold text-light-900 dark:text-white mb-2 sm:mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyber-400" />
                Top Scoring Teams
              </h4>
              <div className="space-y-2">
                {topScoringTeams.map((team, index) => {
                  const maxGoals = topScoringTeams[0]?.goals || 1;
                  return (
                    <div key={team.name} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-cyber-500/20 text-cyber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-light-900 dark:text-white font-medium truncate">{team.name}</span>
                        </div>
                        <span className="text-cyber-400 font-bold flex-shrink-0 ml-2">{team.goals}</span>
                      </div>
                      <div className="w-full bg-light-300 dark:bg-dark-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(team.goals / maxGoals) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-1.5 bg-gradient-to-r from-cyber-400 to-cyber-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
                {topScoringTeams.length === 0 && (
                  <p className="text-xs text-light-600 dark:text-gray-400 text-center py-3">No data available</p>
                )}
              </div>
            </Card>

            <Card variant="glass">
              <h4 className="text-xs sm:text-sm font-semibold text-light-900 dark:text-white mb-2 sm:mb-4 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-electric-400" />
                Most Wins
              </h4>
              <div className="space-y-2">
                {topWinningTeams.map((team, index) => {
                  const maxWins = topWinningTeams[0]?.wins || 1;
                  return (
                    <div key={team.name} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-electric-500/20 text-electric-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-light-900 dark:text-white font-medium truncate">{team.name}</span>
                        </div>
                        <span className="text-electric-400 font-bold flex-shrink-0 ml-2">{team.wins}</span>
                      </div>
                      <div className="w-full bg-light-300 dark:bg-dark-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(team.wins / maxWins) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-1.5 bg-gradient-to-r from-electric-400 to-electric-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
                {topWinningTeams.length === 0 && (
                  <p className="text-xs text-light-600 dark:text-gray-400 text-center py-3">No data available</p>
                )}
              </div>
            </Card>
          </div>

        </div>
      </CollapsibleSection>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <Card variant="glass">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <h2 className="text-sm sm:text-xl font-bold text-light-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-light-600 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 sm:mt-4"
        >
          {children}
        </motion.div>
      )}
    </Card>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: 'cyber' | 'electric' | 'green';
}

function StatCard({ label, value, subValue, icon, color }: StatCardProps) {
  const gradients = {
    cyber:    'from-cyber-500/20 to-cyber-600/20 border-cyber-500/30',
    electric: 'from-electric-500/20 to-electric-600/20 border-electric-500/30',
    green:    'from-green-500/20 to-green-600/20 border-green-500/30',
  };

  return (
    <Card variant="glass" className={`bg-gradient-to-br ${gradients[color]}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="flex-shrink-0">{icon}</div>
      </div>
      <p className="text-xs sm:text-base font-bold text-light-900 dark:text-white truncate">{value}</p>
      <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400 mt-0.5">{subValue}</p>
    </Card>
  );
}
