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

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, Trophy, Target, ChevronDown } from 'lucide-react';
import { Tournament, GroupMatch, KnockoutTie, TournamentGroup, updateTournament, getTournamentById } from '@/lib/tournamentUtils';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize all groups as expanded on desktop, collapsed on mobile
  useEffect(() => {
    if (!isMobile && tournament.groups) {
      setExpandedGroups(new Set(tournament.groups.map(g => g.name)));
    } else {
      setExpandedGroups(new Set());
    }
  }, [isMobile, tournament.groups]);

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

  // Statistics
  const totalMatches = allMatches.length;
  const playedMatches = allMatches.filter((m) => m.played).length;
  const upcomingMatches = totalMatches - playedMatches;
  const groupMatches = allMatches.filter((m) => m.phase === 'group').length;
  const knockoutMatchesCount = allMatches.filter((m) => m.phase === 'knockout').length;

  // Separate played and upcoming for display
  const playedList = filteredMatches.filter((m) => m.played);
  const upcomingList = filteredMatches.filter((m) => !m.played);

  // Group matches by group (for group stage)
  const groupedByGroup = useMemo(() => {
    const grouped: Record<string, UnifiedMatch[]> = {};

    filteredMatches.forEach((match) => {
      if (match.phase === 'group' && match.groupName) {
        if (!grouped[match.groupName]) {
          grouped[match.groupName] = [];
        }
        grouped[match.groupName].push(match);
      }
    });

    return grouped;
  }, [filteredMatches]);

  const knockoutMatches = filteredMatches.filter((m) => m.phase === 'knockout');
  const hasGroupMatches = Object.keys(groupedByGroup).length > 0;
  const hasKnockoutMatches = knockoutMatches.length > 0;

  /**
   * Handle match result submission
   */
  const handleMatchResultSubmit = async (homeScore: number, awayScore: number) => {
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
        // Update knockout match
        const updatedBracket = freshTournament.knockoutBracket?.map((tie) => {
          if (tie.id !== recordingMatch.tieId) return tie;

          if (recordingMatch.leg === 'first') {
            return {
              ...tie,
              firstLeg: {
                id: tie.firstLeg?.id || `${tie.id}_leg1`,
                leg: 'first' as const,
                homeTeam: recordingMatch.homeTeam,
                awayTeam: recordingMatch.awayTeam,
                homeScore,
                awayScore,
                played: true,
              },
            };
          } else {
            // Calculate aggregate for second leg
            const firstLegHomeScore = tie.firstLeg?.homeScore || 0;
            const firstLegAwayScore = tie.firstLeg?.awayScore || 0;
            const aggregateHome = firstLegHomeScore + awayScore;
            const aggregateAway = firstLegAwayScore + homeScore;

            return {
              ...tie,
              secondLeg: {
                id: tie.secondLeg?.id || `${tie.id}_leg2`,
                leg: 'second' as const,
                homeTeam: recordingMatch.homeTeam,
                awayTeam: recordingMatch.awayTeam,
                homeScore,
                awayScore,
                played: true,
              },
              winner: aggregateHome > aggregateAway ? tie.team1 : tie.team2,
              completed: true,
            };
          }
        });

        await updateTournament(tournament.id!, { knockoutBracket: updatedBracket });
      }

      // Refresh tournament data
      const refreshed = await getTournamentById(tournament.id!);
      if (refreshed) setTournament(refreshed);

      setRecordingMatch(null);
    } catch (error) {
      console.error('Error recording match:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Fixtures & Results</h2>
          <p className="text-gray-400">All tournament matches</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass">
          <div className="text-center">
            <Calendar className="w-6 h-6 text-cyber-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{totalMatches}</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <p className="text-xs text-gray-400 mb-1">Played</p>
            <p className="text-2xl font-bold text-white">{playedMatches}</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="text-center">
            <Target className="w-6 h-6 text-electric-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Groups</p>
            <p className="text-2xl font-bold text-white">{groupMatches}</p>
          </div>
        </Card>

        <Card variant="glass">
          <div className="text-center">
            <Trophy className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Knockout</p>
            <p className="text-2xl font-bold text-white">{knockoutMatchesCount}</p>
          </div>
        </Card>
      </div>

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
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-7 h-7 text-cyber-400" />
            Group Stage Fixtures
          </h2>

          {Object.keys(groupedByGroup).sort().map((groupName) => {
            const groupMatches = groupedByGroup[groupName];
            const playedCount = groupMatches.filter((m) => m.played).length;
            const totalCount = groupMatches.length;
            const isExpanded = expandedGroups.has(groupName);

            return (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-cyber-500/10 to-electric-500/10 border-2 border-cyber-500/30 rounded-tech-lg overflow-hidden"
              >
                {/* Group Header - Clickable on mobile */}
                <button
                  onClick={() => isMobile && toggleGroup(groupName)}
                  className={`w-full flex items-center justify-between p-6 ${isMobile ? 'cursor-pointer hover:bg-cyber-500/5 active:bg-cyber-500/10' : 'cursor-default'} transition-colors ${!isExpanded ? 'pb-6' : 'pb-4 border-b-2 border-cyber-500/30'}`}
                >
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-10 h-10 rounded-tech bg-gradient-cyber flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    Group {groupName}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-400">
                      {playedCount}/{totalCount} matches
                    </div>
                    {isMobile && (
                      <ChevronDown
                        className={`w-5 h-5 text-cyber-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>
                </button>

                {/* Group Matches Grid - Collapsible */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={isMobile ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={isMobile ? { height: 0, opacity: 0 } : {}}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6 pt-4">
                        {groupMatches.map((match, index) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                      index={index}
                      isAuthenticated={isAuthenticated}
                      isLoading={isLoading}
                      onRecordMatch={setRecordingMatch}
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

      {/* Knockout Matches */}
      {(phaseFilter === 'all' || phaseFilter === 'knockout') && hasKnockoutMatches && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Trophy className="w-7 h-7 text-pink-400" />
            Knockout Stage Fixtures
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {knockoutMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                index={index}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
                onRecordMatch={setRecordingMatch}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredMatches.length === 0 && (
        <div className="text-center py-20">
          <Filter className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">
            {searchQuery || phaseFilter !== 'all' || statusFilter !== 'all'
              ? 'No matches found'
              : 'No matches yet'}
          </h3>
          <p className="text-gray-400">
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
 * Match Card Component
 */
interface MatchCardProps {
  match: UnifiedMatch;
  index: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  onRecordMatch: (match: UnifiedMatch) => void;
}

function MatchCard({ match, index, isAuthenticated, isLoading, onRecordMatch }: MatchCardProps) {
  // Determine gradient based on phase
  const gradient = match.phase === 'group'
    ? 'from-cyber-500/20 to-electric-500/20'
    : 'from-pink-500/20 to-purple-500/20';

  const border = match.played
    ? 'border-green-500/30'
    : 'border-yellow-500/30';

  // Determine winner/loser for score styling
  const homeWon = match.played && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore;
  const awayWon = match.played && match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore;
  const isDraw = match.played && match.homeScore === match.awayScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card variant="glass" className={`bg-gradient-to-br ${gradient} border ${border}`}>
        {/* Match Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.phase === 'group' ? (
              <Target className="w-4 h-4 text-cyber-400" />
            ) : (
              <Trophy className="w-4 h-4 text-pink-400" />
            )}
            <span className="text-sm font-semibold text-gray-300">
              {match.round}
              {match.groupName && ` - ${match.groupName}`}
              {match.leg && ` (${match.leg === 'first' ? '1st' : '2nd'} Leg)`}
            </span>
          </div>
          <div
            className={`px-2 py-1 rounded-tech text-xs font-semibold ${
              match.played
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {match.played ? 'Played' : 'Upcoming'}
          </div>
        </div>

        {/* Teams with Winner/Loser Styling */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between rounded-tech p-3 transition-all ${
            homeWon ? 'bg-green-500/10 border-2 border-green-500/30' :
            awayWon ? 'bg-dark-100/20' :
            'bg-dark-100/30'
          }`}>
            <span className={`font-bold ${homeWon ? 'text-green-400' : 'text-white'}`}>
              {match.homeTeam}
            </span>
            {match.played && match.homeScore !== undefined && (
              <span className={`text-2xl font-extrabold ${
                homeWon ? 'text-green-400' :
                awayWon ? 'text-gray-500' :
                'text-white'
              }`}>
                {match.homeScore}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center">
            <span className="text-gray-500 font-bold">vs</span>
          </div>

          <div className={`flex items-center justify-between rounded-tech p-3 transition-all ${
            awayWon ? 'bg-green-500/10 border-2 border-green-500/30' :
            homeWon ? 'bg-dark-100/20' :
            'bg-dark-100/30'
          }`}>
            <span className={`font-bold ${awayWon ? 'text-green-400' : 'text-white'}`}>
              {match.awayTeam}
            </span>
            {match.played && match.awayScore !== undefined && (
              <span className={`text-2xl font-extrabold ${
                awayWon ? 'text-green-400' :
                homeWon ? 'text-gray-500' :
                'text-white'
              }`}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Admin Action Button */}
        {isAuthenticated && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Button
              variant={match.played ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onRecordMatch(match)}
              disabled={isLoading || (match.phase === 'knockout' && match.leg === 'second' && !match.tieId)}
              className="w-full"
              glow={!match.played}
            >
              {match.played ? 'Edit Result' : 'Record Result'}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
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
