"use client";

import React, { useState, useMemo } from 'react';
import { ListChecks, Filter, Users, Trophy, Edit3, User, ChevronDown, ChevronUp } from 'lucide-react';
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

function getMatchResult(match: LeagueMatch, perspectivePlayerId: string) {
  const isPlayerA = match.playerA === perspectivePlayerId;
  const myScore = isPlayerA ? (match.scoreA || 0) : (match.scoreB || 0);
  const oppScore = isPlayerA ? (match.scoreB || 0) : (match.scoreA || 0);
  if (myScore > oppScore) return { label: 'W', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
  if (myScore < oppScore) return { label: 'L', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
  return { label: 'D', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' };
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
        <div className={`flex-1 text-right ${playerAWon ? 'opacity-100' : 'opacity-60'}`}>
          <div className="flex items-center justify-end gap-1.5">
            {playerAWon && <Trophy className="w-3 h-3 text-yellow-400" />}
            <span className="font-bold text-light-900 dark:text-white text-xs">{match.playerAName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3">
          <span className={`text-sm font-black ${playerAWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>
            {scoreA}
          </span>
          <span className="text-gray-500 text-xs">-</span>
          <span className={`text-sm font-black ${playerBWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-light-600 dark:text-gray-400'}`}>
            {scoreB}
          </span>
        </div>

        <div className={`flex-1 text-left ${playerBWon ? 'opacity-100' : 'opacity-60'}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-light-900 dark:text-white text-xs">{match.playerBName}</span>
            {playerBWon && <Trophy className="w-3 h-3 text-yellow-400" />}
          </div>
        </div>

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

function CompactMatchRow({ match, perspectivePlayerId, onMatchUpdated }: {
  match: LeagueMatch;
  perspectivePlayerId: string;
  onMatchUpdated?: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const result = getMatchResult(match, perspectivePlayerId);
  const isHome = match.playerA === perspectivePlayerId;
  const myScore = isHome ? (match.scoreA || 0) : (match.scoreB || 0);
  const oppScore = isHome ? (match.scoreB || 0) : (match.scoreA || 0);
  const matchDate = convertTimestamp(match.date);

  return (
    <>
      <div className={`flex items-center justify-between px-2 py-1 rounded-lg border ${result.bg}`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold w-4 text-center ${result.color}`}>{result.label}</span>
          <span className="text-[10px] font-semibold text-gray-500 w-4">
            {isHome ? 'H' : 'A'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${result.color}`}>{myScore} – {oppScore}</span>
          <span className="text-[10px] text-gray-400">
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

function MatchupSection({ matchup, perspectivePlayerId, onMatchUpdated }: {
  matchup: MatchupGroup;
  perspectivePlayerId: string;
  onMatchUpdated?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { w, d, l } = matchup.matches.reduce(
    (acc, match) => {
      const r = getMatchResult(match, perspectivePlayerId);
      if (r.label === 'W') acc.w++;
      else if (r.label === 'D') acc.d++;
      else acc.l++;
      return acc;
    },
    { w: 0, d: 0, l: 0 }
  );

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-light-100/30 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:bg-light-200/40 dark:hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-3 h-3 text-gray-500 shrink-0" />
          <span className="text-xs font-semibold text-light-900 dark:text-white truncate">
            vs {matchup.opponentName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-green-400 font-bold">{w}W</span>
            <span className="text-yellow-400 font-bold">{d}D</span>
            <span className="text-red-400 font-bold">{l}L</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="mt-1 space-y-1 pl-2">
          {matchup.matches.map((match) => (
            <CompactMatchRow
              key={match.id}
              match={match}
              perspectivePlayerId={perspectivePlayerId}
              onMatchUpdated={onMatchUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerSection({ group, onMatchUpdated }: { group: PlayerGroup; onMatchUpdated?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-light-100/50 dark:bg-white/5 rounded-xl transition-colors hover:bg-light-200/50 dark:hover:bg-white/10"
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

      {expanded && (
        <div className="mt-2 space-y-1.5 pl-2">
          {group.matchups.map((matchup) => (
            <MatchupSection
              key={matchup.opponentName}
              matchup={matchup}
              perspectivePlayerId={group.playerId}
              onMatchUpdated={onMatchUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Results({ matches, players, isLoading, onMatchUpdated }: ResultsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

  const filteredMatches = useMemo(() => {
    if (selectedPlayer === 'all') return matches;
    return matches.filter((match) => match.playerA === selectedPlayer || match.playerB === selectedPlayer);
  }, [matches, selectedPlayer]);

  const matchupGroups = useMemo(() => {
    const groups = new Map<string, { opponentName: string; matches: LeagueMatch[] }>();

    filteredMatches.forEach((match) => {
      const ids = [match.playerA, match.playerB].sort();
      const key = ids.join('-');

      if (!groups.has(key)) {
        const opponentName = selectedPlayer !== 'all'
          ? (selectedPlayer === match.playerA ? match.playerBName : match.playerAName)
          : `${ids[0] === match.playerA ? match.playerAName : match.playerBName} vs ${ids[1] === match.playerB ? match.playerBName : match.playerAName}`;
        groups.set(key, { opponentName, matches: [] });
      }
      groups.get(key)!.matches.push(match);
    });

    return Array.from(groups.values());
  }, [filteredMatches, selectedPlayer]);

  const playerGroups = useMemo(() => {
    if (selectedPlayer !== 'all') return [];

    const groupMap = new Map<string, PlayerGroup>();

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

    matches.forEach((match) => {
      const scoreA = match.scoreA || 0;
      const scoreB = match.scoreB || 0;
      const isDraw = scoreA === scoreB;

      const groupA = groupMap.get(match.playerA);
      if (groupA) {
        let matchup = groupA.matchups.find((m) => m.opponentName === match.playerBName);
        if (!matchup) { matchup = { opponentName: match.playerBName, matches: [] }; groupA.matchups.push(matchup); }
        matchup.matches.push(match);
        groupA.totalMatches++;
        if (isDraw) groupA.draws++;
        else if (scoreA > scoreB) groupA.wins++;
        else groupA.losses++;
      }

      const groupB = groupMap.get(match.playerB);
      if (groupB) {
        let matchup = groupB.matchups.find((m) => m.opponentName === match.playerAName);
        if (!matchup) { matchup = { opponentName: match.playerAName, matches: [] }; groupB.matchups.push(matchup); }
        matchup.matches.push(match);
        groupB.totalMatches++;
        if (isDraw) groupB.draws++;
        else if (scoreB > scoreA) groupB.wins++;
        else groupB.losses++;
      }
    });

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
    <div className="space-y-3">
      {/* Header with Filter — single compact row */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-light-900 dark:text-white flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-cyber-400" />
          Results
          <span className="text-xs font-normal text-light-500 dark:text-gray-500">
            {selectedPlayer === 'all'
              ? `${matches.length} matches`
              : `${filteredMatches.length} matches`}
          </span>
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="px-2.5 py-1.5 bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 rounded-xl text-light-900 dark:text-white text-xs focus:outline-none focus:border-cyber-500/50 transition-all"
          >
            <option value="all">All Players</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* All Players View */}
      {selectedPlayer === 'all' ? (
        <div className="space-y-2">
          {playerGroups.map((group) => (
            <PlayerSection key={group.playerId} group={group} onMatchUpdated={onMatchUpdated} />
          ))}
        </div>
      ) : (
        /* Filtered Player View — compact H&A style */
        matchupGroups.length > 0 ? (
          <div className="space-y-2">
            {matchupGroups.map((group) => (
              <Card key={group.opponentName} variant="glass" className="!p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyber-400" />
                    <span className="text-sm font-bold text-light-900 dark:text-white">
                      vs {group.opponentName}
                    </span>
                  </div>
                  {group.matches.length > 1 && (
                    <span className="text-[10px] text-light-500 dark:text-gray-500">
                      {group.matches.length} legs
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {group.matches.map((match) => (
                    <CompactMatchRow
                      key={match.id}
                      match={match}
                      perspectivePlayerId={selectedPlayer}
                      onMatchUpdated={onMatchUpdated}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-12">
              <p className="text-light-600 dark:text-gray-400 text-sm">No matches found for this player</p>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
