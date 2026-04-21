/**
 * Tournament Fixtures Section
 *
 * Displays all matches across the tournament (group stage + knockout).
 * Provides filtering, search, and match result viewing.
 * **Admin-only**: Record and edit match results.
 *
 * @component
 * @features
 * - Unified match display (groups + knockout)
 * - Filter by phase (all/groups/knockout) and status (all/played/upcoming)
 * - Search by team name or round
 * - Match statistics summary
 * - Admin: Record new match results
 * - Admin: Edit existing match results
 * - Cyber-themed UI
 */

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trophy, Target, ChevronDown, Pencil } from 'lucide-react';
import { Tournament, GroupMatch, KnockoutTie, TournamentGroup, updateTournament, recordKnockoutMatch, getTournamentById } from '@/lib/tournamentUtils';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import RecordResultModal from '../RecordResultModal';

interface FixturesProps {
  tournament: Tournament;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTournament: (tournament: Tournament) => void;
}

/**
 * Recalculate group standings based on match results
 */
function recalcGroupStandings(group: TournamentGroup) {
  const standingsMap: Record<string, {
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  }> = {};

  // Initialize standings for all teams
  group.members.forEach((m) => {
    standingsMap[m.name] = {
      teamName: m.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  // Calculate standings from matches
  group.matches.forEach((match) => {
    if (!match.played) return;

    const home = standingsMap[match.homeTeam];
    const away = standingsMap[match.awayTeam];
    if (!home || !away) return;

    const hs = match.homeScore ?? 0;
    const as = match.awayScore ?? 0;

    home.played++;
    away.played++;

    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (hs < as) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  });

  const standings = Object.values(standingsMap).map((s, i) => ({
    ...s,
    memberId: s.teamName,
    position: i + 1,
  }));

  return standings;
}

/**
 * Unified match type for display and editing
 */
interface UnifiedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  phase: 'group' | 'knockout';
  round: string;
  groupName?: string;
  groupId?: string; // For group matches
  leg?: 'first' | 'second';
  tieId?: string; // For knockout matches
}

interface MatchupGroup {
  key: string;
  team1: string;
  team2: string;
  matches: UnifiedMatch[];
}

export default function Fixtures({
  tournament,
  isAuthenticated,
  isLoading,
  setTournament,
}: FixturesProps) {
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'groups' | 'knockout'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'played' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingMatch, setRecordingMatch] = useState<UnifiedMatch | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [expandedMatchups, setExpandedMatchups] = useState<Set<string>>(new Set());

  // All groups and rounds start collapsed

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const toggleRound = (roundKey: string) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundKey)) {
        newSet.delete(roundKey);
      } else {
        newSet.add(roundKey);
      }
      return newSet;
    });
  };

  const toggleMatchup = (matchupKey: string) => {
    setExpandedMatchups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchupKey)) {
        newSet.delete(matchupKey);
      } else {
        newSet.add(matchupKey);
      }
      return newSet;
    });
  };

  /**
   * Extract and transform all matches from tournament
   */
  const allMatches = useMemo(() => {
    const matches: UnifiedMatch[] = [];

    // Extract group matches
    tournament.groups?.forEach((group) => {
      group.matches.forEach((match, index) => {
        matches.push({
          id: `group-${group.id}-${index}`,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          played: match.played,
          phase: 'group',
          round: 'Group Stage',
          groupName: group.name,
          groupId: group.id, // Add groupId for updating
        });
      });
    });

    // Extract knockout matches
    tournament.knockoutBracket?.forEach((tie) => {
      const roundLabel = getRoundLabel(tie.round);

      // First leg
      if (tie.firstLeg) {
        matches.push({
          id: `knockout-${tie.id}-first`,
          homeTeam: tie.team1,
          awayTeam: tie.team2,
          homeScore: tie.firstLeg.homeScore,
          awayScore: tie.firstLeg.awayScore,
          played: tie.firstLeg.played,
          phase: 'knockout',
          round: roundLabel,
          leg: 'first',
          tieId: tie.id, // Add tieId for updating
        });
      }

      // Second leg
      if (tie.secondLeg) {
        matches.push({
          id: `knockout-${tie.id}-second`,
          homeTeam: tie.team2,
          awayTeam: tie.team1,
          homeScore: tie.secondLeg.homeScore,
          awayScore: tie.secondLeg.awayScore,
          played: tie.secondLeg.played,
          phase: 'knockout',
          round: roundLabel,
          leg: 'second',
          tieId: tie.id, // Add tieId for updating
        });
      }
    });

    return matches;
  }, [tournament]);

  /**
   * Filter matches by phase, status, and search
   */
  const filteredMatches = useMemo(() => {
    return allMatches.filter((match) => {
      // Phase filter
      if (phaseFilter === 'groups' && match.phase !== 'group') return false;
      if (phaseFilter === 'knockout' && match.phase !== 'knockout') return false;

      // Status filter
      if (statusFilter === 'played' && !match.played) return false;
      if (statusFilter === 'upcoming' && match.played) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          match.homeTeam.toLowerCase().includes(query) ||
          match.awayTeam.toLowerCase().includes(query) ||
          match.round.toLowerCase().includes(query) ||
          match.groupName?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allMatches, phaseFilter, statusFilter, searchQuery]);

  // Statistics (single pass)
  const stats = useMemo(() => {
    let played = 0, group = 0, knockout = 0;
    for (const m of allMatches) {
      if (m.played) played++;
      if (m.phase === 'group') group++;
      else knockout++;
    }
    return { total: allMatches.length, played, group, knockout };
  }, [allMatches]);

  // Group matches by group, then by player pairing
  const groupedByGroup = useMemo(() => {
    const matchesByGroup: Record<string, UnifiedMatch[]> = {};

    filteredMatches.forEach((match) => {
      if (match.phase === 'group' && match.groupName) {
        if (!matchesByGroup[match.groupName]) {
          matchesByGroup[match.groupName] = [];
        }
        matchesByGroup[match.groupName].push(match);
      }
    });

    const grouped: Record<string, MatchupGroup[]> = {};
    for (const [groupName, matches] of Object.entries(matchesByGroup)) {
      grouped[groupName] = groupMatchesByPairing(matches);
    }

    return grouped;
  }, [filteredMatches]);

  // Group knockout matches by round, then by tie (pairing)
  const { knockoutMatches, groupedByRound } = useMemo(() => {
    const ko: UnifiedMatch[] = [];
    const roundMatches: Record<string, UnifiedMatch[]> = {};
    for (const match of filteredMatches) {
      if (match.phase !== 'knockout') continue;
      ko.push(match);
      if (!roundMatches[match.round]) roundMatches[match.round] = [];
      roundMatches[match.round].push(match);
    }
    // Group each round's matches by tie pairing
    const grouped: Record<string, MatchupGroup[]> = {};
    for (const [round, matches] of Object.entries(roundMatches)) {
      grouped[round] = groupMatchesByPairing(matches);
    }
    return { knockoutMatches: ko, groupedByRound: grouped };
  }, [filteredMatches]);

  const hasGroupMatches = Object.keys(groupedByGroup).length > 0;
  const hasKnockoutMatches = knockoutMatches.length > 0;

  const handleMatchResultSubmit = useCallback(async (homeScore: number, awayScore: number) => {
    if (!recordingMatch) return;

    try {
      const freshTournament = await getTournamentById(tournament.id!);
      if (!freshTournament) return;

      if (recordingMatch.phase === 'group') {
        // Update group match
        const updatedGroups = freshTournament.groups?.map((group) => {
          if (group.id !== recordingMatch.groupId) return group;

          const updatedMatches = group.matches.map((m) => {
            if (m.homeTeam === recordingMatch.homeTeam && m.awayTeam === recordingMatch.awayTeam) {
              return { ...m, homeScore, awayScore, played: true };
            }
            return m;
          });

          // Recalculate standings
          const updatedStandings = recalcGroupStandings({ ...group, matches: updatedMatches });

          return { ...group, matches: updatedMatches, standings: updatedStandings };
        });

        await updateTournament(tournament.id!, { groups: updatedGroups });
      } else {
        // Update knockout match using recordKnockoutMatch for proper round progression
        await recordKnockoutMatch(
          tournament.id!,
          recordingMatch.tieId!,
          recordingMatch.leg!,
          recordingMatch.homeTeam,
          recordingMatch.awayTeam,
          homeScore,
          awayScore
        );
      }

      // Refresh tournament data
      const refreshed = await getTournamentById(tournament.id!);
      if (refreshed) setTournament(refreshed);

      setRecordingMatch(null);
    } catch (error) {
      console.error('Error recording match:', error);
    }
  }, [recordingMatch, tournament.id, setTournament]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-1">Fixtures & Results</h2>
          <p className="text-light-600 dark:text-gray-400">All tournament matches</p>
        </div>
      </div>

      {/* Summary line */}
      <p className="text-sm text-light-600 dark:text-gray-400">
        <span className="font-medium text-light-900 dark:text-white">{stats.total}</span> matches
        {' · '}
        <span className="font-medium text-light-900 dark:text-white">{stats.played}</span> played
        {' · '}
        {stats.knockout > 0 ? (
          <>
            <span className="font-medium text-light-900 dark:text-white">{stats.knockout}</span> knockout
          </>
        ) : (
          <span className="text-light-500 dark:text-gray-500">Knockout pending</span>
        )}
      </p>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by team, round, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Phase Filter */}
          {(['all', 'groups', 'knockout'] as const).map((phase) => (
            <Button
              key={phase}
              variant={phaseFilter === phase ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPhaseFilter(phase)}
              className="capitalize"
            >
              {phase}
            </Button>
          ))}

          <div className="w-px bg-white/10" />

          {/* Status Filter */}
          {(['all', 'played', 'upcoming'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Group Stage Matches - Grouped by Group */}
      {(phaseFilter === 'all' || phaseFilter === 'groups') && hasGroupMatches && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-6 flex items-center gap-3">
            <Target className="w-7 h-7 text-cyber-400" />
            Group Stage Fixtures
          </h2>

          {Object.keys(groupedByGroup).sort().map((groupName) => {
            const matchupGroups = groupedByGroup[groupName];
            const allMatchesInGroup = matchupGroups.flatMap(mg => mg.matches);
            const playedCount = allMatchesInGroup.filter((m) => m.played).length;
            const totalCount = allMatchesInGroup.length;
            const isExpanded = expandedGroups.has(groupName);

            return (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-cyber-500/10 to-electric-500/10 border-2 border-cyber-500/30 rounded-tech-lg overflow-hidden"
              >
                {/* Group Header - Always clickable */}
                <button
                  onClick={() => toggleGroup(groupName)}
                  className={`w-full flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-cyber-500/5 active:bg-cyber-500/10 transition-colors select-none ${!isExpanded ? 'pb-4 sm:pb-6' : 'pb-3 sm:pb-4 border-b-2 border-cyber-500/30'}`}
                >
                  <h3 className="text-sm sm:text-xl font-bold text-light-900 dark:text-white flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-tech bg-gradient-cyber flex items-center justify-center shrink-0">
                      <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-light-900 dark:text-white" />
                    </div>
                    {groupName}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-[10px] sm:text-sm text-light-600 dark:text-gray-400">
                      {playedCount}/{totalCount}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-cyber-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Group Matchups Grid - Collapsible */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6 pt-4">
                        {matchupGroups.map((matchup, index) => (
                          <MatchupCard
                            key={matchup.key}
                            matchup={matchup}
                            index={index}
                            isAuthenticated={isAuthenticated}
                            isLoading={isLoading}
                            onRecordMatch={setRecordingMatch}
                            isExpanded={expandedMatchups.has(`${groupName}::${matchup.key}`)}
                            onToggle={() => toggleMatchup(`${groupName}::${matchup.key}`)}
                          />
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

      {/* Knockout Matches - Grouped by Round */}
      {(phaseFilter === 'all' || phaseFilter === 'knockout') && hasKnockoutMatches && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-6 flex items-center gap-3">
            <Trophy className="w-7 h-7 text-pink-400" />
            Knockout Stage Fixtures
          </h2>

          {['Round of 16', 'Quarter Finals', 'Semi Finals', 'Final'].map((roundLabel) => {
            const matchupGroups = groupedByRound[roundLabel];
            if (!matchupGroups || matchupGroups.length === 0) return null;

            const allRoundMatches = matchupGroups.flatMap(mg => mg.matches);
            const playedCount = allRoundMatches.filter((m) => m.played).length;
            const totalCount = allRoundMatches.length;
            const isExpanded = expandedRounds.has(roundLabel);

            const roundColors: Record<string, { gradient: string; border: string; text: string }> = {
              'Round of 16': { gradient: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500 dark:text-cyan-400' },
              'Quarter Finals': { gradient: 'from-pink-500/10 to-purple-500/10', border: 'border-pink-500/30', text: 'text-pink-500 dark:text-pink-400' },
              'Semi Finals': { gradient: 'from-orange-500/10 to-red-500/10', border: 'border-orange-500/30', text: 'text-orange-500 dark:text-orange-400' },
              'Final': { gradient: 'from-yellow-500/10 to-amber-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400' },
            };

            const colors = roundColors[roundLabel] || roundColors['Round of 16'];

            return (
              <motion.div
                key={roundLabel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} rounded-tech-lg overflow-hidden`}
              >
                {/* Round Header */}
                <button
                  onClick={() => toggleRound(roundLabel)}
                  className={`w-full flex items-center justify-between p-6 cursor-pointer hover:opacity-80 transition-all select-none ${!isExpanded ? 'pb-6' : 'pb-4 border-b-2 ' + colors.border}`}
                >
                  <h3 className={`text-xl font-bold ${colors.text} flex items-center gap-2`}>
                    <div className={`w-10 h-10 rounded-tech bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} flex items-center justify-center`}>
                      <Trophy className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    {roundLabel}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-light-600 dark:text-gray-400">
                      {playedCount}/{totalCount} matches
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 ${colors.text} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Round Matches - Collapsible */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6 pt-4">
                        {matchupGroups.map((matchup, index) => (
                          <MatchupCard
                            key={matchup.key}
                            matchup={matchup}
                            index={index}
                            isAuthenticated={isAuthenticated}
                            isLoading={isLoading}
                            onRecordMatch={setRecordingMatch}
                            isExpanded={expandedMatchups.has(`ko::${roundLabel}::${matchup.key}`)}
                            onToggle={() => toggleMatchup(`ko::${roundLabel}::${matchup.key}`)}
                          />
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

      {/* Empty State */}
      {filteredMatches.length === 0 && (
        <div className="text-center py-20">
          <Filter className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-light-900 dark:text-white mb-2">
            {searchQuery || phaseFilter !== 'all' || statusFilter !== 'all'
              ? 'No matches found'
              : 'No matches yet'}
          </h3>
          <p className="text-light-600 dark:text-gray-400">
            {searchQuery || phaseFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Matches will appear here once the tournament begins'}
          </p>
        </div>
      )}

      {/* Record/Edit Match Modal */}
      {recordingMatch && (
        <RecordResultModal
          isOpen={true}
          onClose={() => setRecordingMatch(null)}
          onSubmit={handleMatchResultSubmit}
          homeTeam={recordingMatch.homeTeam}
          awayTeam={recordingMatch.awayTeam}
          initialHomeScore={recordingMatch.homeScore}
          initialAwayScore={recordingMatch.awayScore}
          title={recordingMatch.played ? 'Edit Match Result' : 'Record Match Result'}
        />
      )}
    </div>
  );
}

/**
 * Matchup Card Component — groups all matches between two players
 */
interface MatchupCardProps {
  matchup: MatchupGroup;
  index: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  onRecordMatch: (match: UnifiedMatch) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const MatchupCard = React.memo(function MatchupCard({
  matchup,
  index,
  isAuthenticated,
  isLoading,
  onRecordMatch,
  isExpanded,
  onToggle,
}: MatchupCardProps) {
  const playedMatches = matchup.matches.filter(m => m.played);
  const hasAnyPlayed = playedMatches.length > 0;

  // Calculate aggregate goals for each team across all played matches
  const team1Goals = playedMatches.reduce((sum, m) => {
    return sum + (m.homeTeam === matchup.team1 ? (m.homeScore ?? 0) : (m.awayScore ?? 0));
  }, 0);
  const team2Goals = playedMatches.reduce((sum, m) => {
    return sum + (m.homeTeam === matchup.team2 ? (m.homeScore ?? 0) : (m.awayScore ?? 0));
  }, 0);

  const team1Won = hasAnyPlayed && team1Goals > team2Goals;
  const team2Won = hasAnyPlayed && team2Goals > team1Goals;

  // Determine card colors based on phase
  const isKnockout = matchup.matches[0]?.phase === 'knockout';
  const roundLabel = matchup.matches[0]?.round;
  const knockoutCardColors: Record<string, { gradient: string; border: string }> = {
    'Round of 16': { gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
    'Quarter Finals': { gradient: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-500/30' },
    'Semi Finals': { gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' },
    'Final': { gradient: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30' },
  };
  const cardColors = isKnockout && roundLabel
    ? knockoutCardColors[roundLabel] ?? { gradient: 'from-cyber-500/20 to-electric-500/20', border: 'border-cyber-500/30' }
    : { gradient: 'from-cyber-500/20 to-electric-500/20', border: 'border-cyber-500/30' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.15) }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${cardColors.gradient} border ${cardColors.border} !p-2.5 sm:!p-3`}>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 select-none"
        >
          {/* Team 1 */}
          <div className={`flex-1 text-right ${team1Won ? 'opacity-100' : hasAnyPlayed ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-center justify-end gap-1.5">
              {team1Won && <Trophy className="w-3 h-3 text-green-400 shrink-0" />}
              <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">{matchup.team1}</span>
            </div>
          </div>

          {/* Aggregate Score */}
          <div className="flex items-center gap-1.5 px-1.5 sm:px-3 shrink-0">
            {hasAnyPlayed ? (
              <>
                <span className={`text-sm sm:text-lg font-black ${team1Won ? 'text-green-400' : team2Won ? 'text-light-600 dark:text-gray-400' : 'text-light-900 dark:text-white'}`}>
                  {team1Goals}
                </span>
                <span className="text-light-600 dark:text-gray-500 text-xs">-</span>
                <span className={`text-sm sm:text-lg font-black ${team2Won ? 'text-green-400' : team1Won ? 'text-light-600 dark:text-gray-400' : 'text-light-900 dark:text-white'}`}>
                  {team2Goals}
                </span>
              </>
            ) : (
              <span className="text-xs text-light-500 dark:text-gray-500 font-semibold">vs</span>
            )}
          </div>

          {/* Team 2 */}
          <div className={`flex-1 text-left ${team2Won ? 'opacity-100' : hasAnyPlayed ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">{matchup.team2}</span>
              {team2Won && <Trophy className="w-3 h-3 text-green-400 shrink-0" />}
            </div>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="w-3.5 h-3.5 text-light-500 dark:text-gray-500" />
          </motion.div>
        </button>

        {/* Expanded: individual game rows + admin actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5">
                {matchup.matches.map((match, i) => {
                  const homeWon = match.played && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                  const awayWon = match.played && (match.awayScore ?? 0) > (match.homeScore ?? 0);

                  return (
                    <div key={match.id} className="flex items-center justify-between bg-light-100/50 dark:bg-dark-100/50 rounded-tech p-1.5 sm:p-2">
                      <span className="text-[10px] sm:text-xs font-semibold text-light-700 dark:text-gray-300 w-8 sm:w-10">
                        {match.leg ? (match.leg === 'first' ? 'L1' : 'L2') : matchup.matches.length > 1 ? `G${i + 1}` : 'Game'}
                      </span>
                      {match.played ? (
                        <div className="flex items-center gap-1.5 flex-1 justify-center">
                          <span className={`text-xs sm:text-sm ${homeWon ? 'text-green-400 font-bold' : 'text-light-900 dark:text-white'}`}>{match.homeTeam}</span>
                          <span className="text-xs sm:text-sm font-bold text-light-900 dark:text-white">{match.homeScore}-{match.awayScore}</span>
                          <span className={`text-xs sm:text-sm ${awayWon ? 'text-green-400 font-bold' : 'text-light-900 dark:text-white'}`}>{match.awayTeam}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-1 justify-center">
                          <span className="text-xs sm:text-sm text-light-900 dark:text-white">{match.homeTeam}</span>
                          <span className="text-[10px] sm:text-xs text-yellow-400 font-semibold">vs</span>
                          <span className="text-xs sm:text-sm text-light-900 dark:text-white">{match.awayTeam}</span>
                        </div>
                      )}
                      {isAuthenticated && match.played && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRecordMatch(match); }}
                          disabled={isLoading}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50 ml-1"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {isAuthenticated && !match.played && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRecordMatch(match); }}
                          disabled={isLoading}
                          className="bg-cyber-500 hover:bg-cyber-600 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-tech font-semibold transition-colors disabled:opacity-50 ml-1"
                        >
                          Record
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

/**
 * Group matches by player pairing (canonical alphabetical key)
 */
function groupMatchesByPairing(matches: UnifiedMatch[]): MatchupGroup[] {
  const map = new Map<string, MatchupGroup>();

  for (const match of matches) {
    const [team1, team2] = [match.homeTeam, match.awayTeam].sort();
    const key = `${team1}::${team2}`;

    if (!map.has(key)) {
      map.set(key, { key, team1, team2, matches: [] });
    }
    map.get(key)!.matches.push(match);
  }

  return Array.from(map.values());
}

/**
 * Get round label from round key
 */
function getRoundLabel(round: string): string {
  const labels: Record<string, string> = {
    'round_16': 'Round of 16',
    'quarter_final': 'Quarter Finals',
    'semi_final': 'Semi Finals',
    'final': 'Final',
  };
  return labels[round] || round;
}
