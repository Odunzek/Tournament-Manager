"use client";

import React, { useState, useMemo } from 'react';
import { ListChecks, Filter, Users, Trophy, Calendar, Edit3, User, ChevronDown, ChevronUp } from 'lucide-react';
import { LeagueMatch } from '@/types/league';
import { Player } from '@/types/player';
import { convertTimestamp } from '@/lib/leagueUtils';
import { useAuth } from '@/lib/AuthContext';
import Card from '../../ui/Card';
import EditMatchModal from '../EditMatchModal';

interface ResultsProps {
  matches: LeagueMatch[];
  players: Player[];
  isLoading: boolean;
  onMatchUpdated?: () => void;
}

interface MatchupGroup {
  opponentName: string;
  matches: LeagueMatch[];
}

interface PlayerGroup {
  playerId: string;
  playerName: string;
  matchups: MatchupGroup[];
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
}

function MatchRow({ match, onMatchUpdated }: { match: LeagueMatch; onMatchUpdated?: () => void }) {
  const { isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const matchDate = convertTimestamp(match.date);
  const scoreA = match.scoreA || 0;
  const scoreB = match.scoreB || 0;
  const isDraw = scoreA === scoreB;
  const playerAWon = scoreA > scoreB;
  const playerBWon = scoreB > scoreA;

  return (
    <>
      <div className="flex items-center justify-between py-2">
        {/* Player A */}
        <div className={`flex-1 text-right ${playerAWon ? 'opacity-100' : 'opacity-60'}`}>
          <div className="flex items-center justify-end gap-1.5">
            {playerAWon && <Trophy className="w-3 h-3 text-yellow-400" />}
            <span className="font-bold text-light-900 dark:text-white text-xs">{match.playerAName}</span>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 px-3">
          <span className={`text-sm font-black ${playerAWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>
            {scoreA}
          </span>
          <span className="text-gray-500 text-xs">-</span>
          <span className={`text-sm font-black ${playerBWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>
            {scoreB}
          </span>
        </div>

        {/* Player B */}
        <div className={`flex-1 text-left ${playerBWon ? 'opacity-100' : 'opacity-60'}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-light-900 dark:text-white text-xs">{match.playerBName}</span>
            {playerBWon && <Trophy className="w-3 h-3 text-yellow-400" />}
          </div>
        </div>

        {/* Date + Edit */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[10px] text-light-500 dark:text-gray-500 hidden sm:inline">
            {matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {isAuthenticated && (
            <button
              onClick={() => setShowEditModal(true)}
              className="text-light-500 dark:text-gray-500 hover:text-cyber-400 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <EditMatchModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        match={match}
        onSuccess={() => { if (onMatchUpdated) onMatchUpdated(); }}
      />
    </>
  );
}

function PlayerSection({ group, onMatchUpdated }: { group: PlayerGroup; onMatchUpdated?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* Player Header - tappable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-light-100/50 dark:bg-white/5 rounded-xl transition-colors hover:bg-light-200/50 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-4 h-4 text-cyber-400 shrink-0" />
          <span className="text-sm font-bold text-light-900 dark:text-white truncate">{group.playerName}</span>
          <div className="flex items-center gap-1.5 text-[10px] shrink-0">
            <span className="text-green-400 font-semibold">{group.wins}W</span>
            <span className="text-yellow-400 font-semibold">{group.draws}D</span>
            <span className="text-red-400 font-semibold">{group.losses}L</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] text-light-500 dark:text-gray-500 hidden sm:inline">
            {group.totalMatches} played
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-light-500 dark:text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-light-500 dark:text-gray-500" />
          )}
        </div>
      </button>

      {/* Matchups - shown when expanded */}
      {expanded && (
        <div className="mt-2 space-y-2 pl-2">
          {group.matchups.map((matchup) => (
            <Card key={matchup.opponentName} variant="glass" className="!p-2.5 sm:!p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-light-600 dark:text-gray-400">
                  vs {matchup.opponentName}
                </span>
                <span className="text-[10px] text-light-500 dark:text-gray-500">
                  {matchup.matches.length} {matchup.matches.length === 1 ? 'leg' : 'legs'}
                </span>
              </div>
              <div className="divide-y divide-light-200 dark:divide-white/5">
                {matchup.matches.map((match) => (
                  <MatchRow key={match.id} match={match} onMatchUpdated={onMatchUpdated} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Results({ matches, players, isLoading, onMatchUpdated }: ResultsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

  const filteredMatches = useMemo(() => {
    if (selectedPlayer === 'all') {
      return matches;
    }
    return matches.filter(
      (match) => match.playerA === selectedPlayer || match.playerB === selectedPlayer
    );
  }, [matches, selectedPlayer]);

  // Group by player pair (used when a specific player is filtered)
  const matchupGroups = useMemo(() => {
    const groups = new Map<string, { opponentName: string; matches: LeagueMatch[] }>();

    filteredMatches.forEach((match) => {
      const ids = [match.playerA, match.playerB].sort();
      const key = ids.join('-');

      if (!groups.has(key)) {
        // When filtered by player, show opponent name; otherwise show both
        const nameA = ids[0] === match.playerA ? match.playerAName : match.playerBName;
        const nameB = ids[1] === match.playerB ? match.playerBName : match.playerAName;
        const opponentName = selectedPlayer !== 'all'
          ? (selectedPlayer === match.playerA ? match.playerBName : match.playerAName)
          : `${nameA} vs ${nameB}`;
        groups.set(key, { opponentName, matches: [] });
      }
      groups.get(key)!.matches.push(match);
    });

    return Array.from(groups.values());
  }, [filteredMatches, selectedPlayer]);

  // Group by player (used when "All Players" is selected)
  const playerGroups = useMemo(() => {
    if (selectedPlayer !== 'all') return [];

    const groupMap = new Map<string, PlayerGroup>();

    // Create a group per player
    players.forEach((player) => {
      groupMap.set(player.id!, {
        playerId: player.id!,
        playerName: player.name,
        matchups: [],
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      });
    });

    // Assign matches to each player's matchups
    matches.forEach((match) => {
      const scoreA = match.scoreA || 0;
      const scoreB = match.scoreB || 0;
      const isDraw = scoreA === scoreB;

      // For player A
      const groupA = groupMap.get(match.playerA);
      if (groupA) {
        let matchup = groupA.matchups.find((m) => m.opponentName === match.playerBName);
        if (!matchup) {
          matchup = { opponentName: match.playerBName, matches: [] };
          groupA.matchups.push(matchup);
        }
        matchup.matches.push(match);
        groupA.totalMatches++;
        if (isDraw) groupA.draws++;
        else if (scoreA > scoreB) groupA.wins++;
        else groupA.losses++;
      }

      // For player B
      const groupB = groupMap.get(match.playerB);
      if (groupB) {
        let matchup = groupB.matchups.find((m) => m.opponentName === match.playerAName);
        if (!matchup) {
          matchup = { opponentName: match.playerAName, matches: [] };
          groupB.matchups.push(matchup);
        }
        matchup.matches.push(match);
        groupB.totalMatches++;
        if (isDraw) groupB.draws++;
        else if (scoreB > scoreA) groupB.wins++;
        else groupB.losses++;
      }
    });

    // Filter out players with no matches, sort by most matches
    return Array.from(groupMap.values())
      .filter((g) => g.totalMatches > 0)
      .sort((a, b) => b.totalMatches - a.totalMatches);
  }, [matches, players, selectedPlayer]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-light-600 dark:text-gray-400">Loading results...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card variant="glass">
        <div className="text-center py-16">
          <ListChecks className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-light-600 dark:text-gray-400 mb-2">No Results Yet</h3>
          <p className="text-gray-500">Match results will appear here after they are recorded</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-light-900 dark:text-white flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-cyber-400" />
          Match Results
        </h2>

        {/* Player Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="px-4 py-2.5 bg-dark-100/50 border-2 border-white/10 rounded-tech text-white text-sm focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm hover:border-cyber-500/50"
          >
            <option value="all" className="bg-dark-100 text-white">All Players</option>
            {players.map((player) => (
              <option key={player.id} value={player.id} className="bg-dark-100 text-white">
                {player.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-light-600 dark:text-gray-400">
        {selectedPlayer === 'all'
          ? `${matches.length} total matches across ${playerGroups.length} players`
          : `Showing ${filteredMatches.length} matches across ${matchupGroups.length} matchups`
        }
      </div>

      {/* All Players View - grouped by player with collapsible sections */}
      {selectedPlayer === 'all' ? (
        <div className="space-y-2">
          {playerGroups.map((group) => (
            <PlayerSection key={group.playerId} group={group} onMatchUpdated={onMatchUpdated} />
          ))}
        </div>
      ) : (
        /* Filtered Player View - grouped by matchup */
        matchupGroups.length > 0 ? (
          <div className="space-y-3">
            {matchupGroups.map((group) => (
              <Card key={group.opponentName} variant="glass" className="!p-3 sm:!p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyber-400" />
                    <span className="text-xs font-semibold text-light-700 dark:text-gray-300">
                      vs {group.opponentName}
                    </span>
                  </div>
                  <span className="text-[10px] text-light-500 dark:text-gray-500">
                    {group.matches.length} {group.matches.length === 1 ? 'leg' : 'legs'}
                  </span>
                </div>
                <div className="divide-y divide-light-200 dark:divide-white/5">
                  {group.matches.map((match) => (
                    <MatchRow key={match.id} match={match} onMatchUpdated={onMatchUpdated} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-light-600 dark:text-gray-400">No matches found for this player</p>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
