/**
 * League Detail Page
 *
 * The main page for viewing and managing a single league. Accessible at `/leagues/[id]`.
 *
 * Architecture:
 *   - Uses real-time Firestore hooks (`useLeague`, `useLeagueMatches`) so the UI
 *     updates automatically when data changes without manual refreshes.
 *   - Standings and win streaks are computed client-side via `calculateStandings`
 *     and `calculateWinStreaks` from `leagueUtils.ts` whenever the match list changes.
 *   - The page supports two player-roster formats:
 *       (a) New leagues: `league.playerIds` array (explicit roster)
 *       (b) Legacy leagues: players are inferred from match history
 *
 * Sections (rendered by `renderSection` switch):
 *   - overview    : League header, progress bar, recent results, admin quick actions
 *   - standings   : Full standings table with point adjustment support
 *   - results     : Filterable list of all played matches
 *   - streaks     : Win streak leaderboard and player form analysis
 *   - record      : Admin-only form for recording new match results
 *
 * Admin-only features (gated by `isAuthenticated && league.status !== 'completed'`):
 *   - Add players to the league
 *   - Record match results
 *   - Edit match scores
 *   - Adjust player points (bonuses / deductions)
 *   - End the league (marks as completed, awards title to winner)
 *   - Delete the league
 */
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import LeagueSidebar from '@/components/leagues/LeagueSidebar';
import Overview from '@/components/leagues/sections/Overview';
import Standings from '@/components/leagues/sections/Standings';
import Results from '@/components/leagues/sections/Results';
import StreaksAndStats from '@/components/leagues/sections/StreaksAndStats';
import RecordMatch from '@/components/leagues/sections/RecordMatch';
import AddPlayersModal from '@/components/leagues/AddPlayersModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useLeague, useLeagueMatches } from '@/hooks/useLeagues';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/lib/AuthContext';
import { calculateStandings, calculateWinStreaks, addPlayersToLeague, removePlayerFromLeague, updateLeague, adjustPlayerPoints } from '@/lib/leagueUtils';
import { incrementLeagueWins } from '@/lib/playerUtils';
import { LeaguePlayer, WinStreak } from '@/types/league';

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = params.id as string;

  // Real-time Firestore subscriptions — data updates automatically
  const { league, loading: leagueLoading } = useLeague(leagueId);
  const { matches, loading: matchesLoading } = useLeagueMatches(leagueId);
  const { players } = usePlayers(); // All players in the system
  const { isAuthenticated } = useAuth();

  // Section navigation — can be seeded from URL query param (e.g., ?section=standings)
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'overview');
  // Client-side computed standings (sorted by pts → GD → GF → alpha)
  const [standings, setStandings] = useState<LeaguePlayer[]>([]);
  // Client-side computed win streak data for the Streaks section
  const [streaks, setStreaks] = useState<WinStreak[]>([]);
  // True while standings/streaks are being recalculated asynchronously
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [endLeagueConfirmOpen, setEndLeagueConfirmOpen] = useState(false);
  const [removePlayerConfirm, setRemovePlayerConfirm] = useState<{ id: string; name: string } | null>(null);

  /**
   * Derive the filtered list of players who belong to this league.
   *
   * Supports two data formats:
   *   - **New format**: `league.playerIds` array — filter the global players list.
   *   - **Legacy format**: leagues created before `playerIds` was added have no
   *     roster field, so we reconstruct it from match history. Matches written
   *     in the old schema use `homeTeam`/`awayTeam` name strings which are
   *     normalised to `legacy_<Name>` IDs by `useLeagueMatches`. These become
   *     virtual player stubs so standings can still be computed.
   */
  const leaguePlayers = useMemo(() => {
    if (!league) return [];

    // New format: explicit playerIds roster on the league document
    if (league.playerIds && league.playerIds.length > 0) {
      return players.filter((player) => league.playerIds.includes(player.id!));
    }

    // Legacy format: infer roster from who appeared in match records
    const playerIdsFromMatches = new Set<string>();
    const playerNamesMap = new Map<string, string>(); // playerId → display name

    matches.forEach((match) => {
      if (match.playerA) {
        playerIdsFromMatches.add(match.playerA);
        if (match.playerAName) playerNamesMap.set(match.playerA, match.playerAName);
      }
      if (match.playerB) {
        playerIdsFromMatches.add(match.playerB);
        if (match.playerBName) playerNamesMap.set(match.playerB, match.playerBName);
      }
    });

    // Build player list: real player documents + virtual stubs for legacy IDs
    const leaguePlayersList = [];

    playerIdsFromMatches.forEach((playerId) => {
      const realPlayer = players.find((player) => player.id === playerId);

      if (realPlayer) {
        leaguePlayersList.push(realPlayer);
      } else if (playerId.startsWith('legacy_')) {
        // Construct a minimal virtual player object for players without a Firestore doc
        const playerName = playerNamesMap.get(playerId) || playerId.replace('legacy_', '').replace(/_/g, ' ');
        leaguePlayersList.push({
          id: playerId,
          name: playerName,
          psnId: playerName,
          createdAt: null,
          updatedAt: null,
        });
      }
    });

    return leaguePlayersList;
  }, [league, players, matches]);

  /**
   * Recalculate standings and win streaks whenever the league data or match list changes.
   * Both calculations are async (they re-fetch from Firestore) and run together so
   * both sections are always in sync after a match is recorded or edited.
   */
  useEffect(() => {
    const calculateData = async () => {
      if (!league?.id || leaguePlayers.length === 0) return;

      setIsCalculating(true);
      try {
        // Pass pointAdjustments so manual bonus/deduction records are factored in
        const calculatedStandings = await calculateStandings(league.id, leaguePlayers, league.pointAdjustments || {});
        const calculatedStreaks = await calculateWinStreaks(league.id, leaguePlayers);

        setStandings(calculatedStandings);
        setStreaks(calculatedStreaks);
      } catch (error) {
        console.error('Error calculating standings/streaks:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateData();
  }, [league, leaguePlayers, matches]); // Re-run on any data change

  /** Sum of all goals scored across every completed match in this league. */
  const totalGoals = useMemo(() => {
    return matches.reduce((sum, match) => {
      if (match.played) {
        const scoreA = match.scoreA || 0;
        const scoreB = match.scoreB || 0;
        return sum + scoreA + scoreB;
      }
      return sum;
    }, 0);
  }, [matches]);

  /** The player at position 1 in the sorted standings, or null before first calculation. */
  const leagueLeader = standings.length > 0 ? standings[0] : null;

  /**
   * Add one or more players to this league.
   * The league document's `playerIds` array and `totalMatches` are updated atomically
   * by `addPlayersToLeague`. Real-time listeners automatically refresh the UI.
   */
  const handleAddPlayers = async (newPlayerIds: string[]) => {
    if (!league?.id) return;

    try {
      await addPlayersToLeague(league.id, newPlayerIds);
    } catch (error) {
      console.error('Error adding players to league:', error);
      throw error; // Bubble up so the modal can show an error state
    }
  };

  /** Open the end-league confirmation modal. Actual logic runs in `doEndLeague`. */
  const handleEndLeague = () => {
    if (!league?.id) return;
    setEndLeagueConfirmOpen(true);
  };

  /**
   * Finalise the league after user confirms:
   *   1. Mark the league as 'completed' in Firestore.
   *   2. Re-compute final standings to determine the winner.
   *   3. Increment the winner's league win count (global + per-season).
   */
  const doEndLeague = async () => {
    if (!league?.id) return;
    try {
      await updateLeague(league.id, { status: 'completed' });

      if (leaguePlayers.length > 0) {
        const finalStandings = await calculateStandings(league.id, leaguePlayers, league.pointAdjustments || {});
        if (finalStandings.length > 0 && finalStandings[0].id) {
          // Award the league title and update the player's achievement tier
          await incrementLeagueWins(finalStandings[0].id, league.seasonId);
        }
      }
    } catch (error) {
      console.error('Error ending league:', error);
    } finally {
      setEndLeagueConfirmOpen(false);
    }
  };

  /**
   * Triggered by the EditMatchModal after a score is changed.
   * Manually re-fetches standings/streaks instead of waiting for the
   * Firestore snapshot to propagate (avoids a brief stale-standings flash).
   */
  const handleMatchUpdated = async () => {
    if (!league?.id || leaguePlayers.length === 0) return;

    setIsCalculating(true);
    try {
      const calculatedStandings = await calculateStandings(league.id, leaguePlayers, league?.pointAdjustments || {});
      const calculatedStreaks = await calculateWinStreaks(league.id, leaguePlayers);

      setStandings(calculatedStandings);
      setStreaks(calculatedStreaks);
    } catch (error) {
      console.error('Error recalculating after match update:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Apply a manual point adjustment to a player (bonus or deduction).
   * Writes the adjustment to the league document's `pointAdjustments` map.
   * The Firestore `onSnapshot` listener will fire, causing the standings
   * to be recalculated automatically via the `useEffect` above.
   */
  const handleAdjustPoints = async (playerId: string, adjustment: number, reason: string) => {
    if (!league?.id) return;
    await adjustPlayerPoints(league.id, playerId, adjustment, reason);
  };

  /**
   * Remove a player from the league and delete all their matches.
   * Called after user confirms in the ConfirmModal.
   */
  const doRemovePlayer = async () => {
    if (!league?.id || !removePlayerConfirm) return;
    try {
      await removePlayerFromLeague(league.id, removePlayerConfirm.id);
    } catch (error) {
      console.error('Error removing player from league:', error);
    } finally {
      setRemovePlayerConfirm(null);
    }
  };

  /**
   * Admin controls (edit matches, adjust points, end league) are only active while
   * the league is still ongoing. Completed leagues are read-only.
   */
  const isEditable = isAuthenticated && league?.status !== 'completed';
  const loading = leagueLoading || matchesLoading;

  if (loading) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-4 sm:py-8">
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-light-600 dark:text-gray-400">Loading league...</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!league) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-4 sm:py-8">
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-light-700 dark:text-gray-400 mb-2">League Not Found</h3>
            <p className="text-light-500 dark:text-gray-500 mb-6">This league does not exist or has been deleted</p>
            <button
              onClick={() => router.push('/leagues')}
              className="px-6 py-2 bg-cyber-500 hover:bg-cyber-600 text-white rounded-tech-lg transition-colors"
            >
              Back to Leagues
            </button>
          </div>
        </Container>
      </MainLayout>
    );
  }

  const renderSection = () => {
    const sectionProps = {
      isLoading: isCalculating,
    };

    switch (activeSection) {
      case 'overview':
        return (
          <Overview
            league={league}
            leagueLeader={leagueLeader}
            recentMatches={matches.slice(0, 5)}
            totalGoals={totalGoals}
            playerCount={leaguePlayers.length}
            isAuthenticated={isAuthenticated}
            onAddPlayers={isEditable ? () => setIsAddPlayersModalOpen(true) : undefined}
            onEndLeague={isEditable ? handleEndLeague : undefined}
            onMatchUpdated={handleMatchUpdated}
            {...sectionProps}
          />
        );
      case 'standings':
        return <Standings standings={standings} leagueId={league.id!} isEditable={isEditable} onAdjustPoints={isEditable ? handleAdjustPoints : undefined} onRemovePlayer={isEditable ? (playerId, playerName) => setRemovePlayerConfirm({ id: playerId, name: playerName }) : undefined} {...sectionProps} />;
      case 'results':
        return <Results matches={matches} players={leaguePlayers} onMatchUpdated={isEditable ? handleMatchUpdated : undefined} {...sectionProps} />;
      case 'streaks':
        return <StreaksAndStats streaks={streaks} standings={standings} {...sectionProps} />;
      case 'record':
        return (
          <RecordMatch
            leagueId={league.id!}
            players={leaguePlayers}
            isAuthenticated={isEditable}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-2 sm:py-8 pb-24 md:pb-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/leagues')}
          className="flex items-center gap-2 text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors mb-1 sm:mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leagues</span>
        </button>

        {/* Layout with Sidebar */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-8">
          {/* Sidebar Navigation */}
          <LeagueSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            isAuthenticated={isAuthenticated}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </Container>

      {/* Add Players Modal */}
      <AddPlayersModal
        isOpen={isAddPlayersModalOpen}
        onClose={() => setIsAddPlayersModalOpen(false)}
        onSubmit={handleAddPlayers}
        players={players}
        currentPlayerIds={league?.playerIds || []}
      />

      {/* End League Confirmation */}
      <ConfirmModal
        isOpen={endLeagueConfirmOpen}
        title="End League?"
        message="This will mark the league as completed and award the title to the current leader. This cannot be undone."
        confirmLabel="End League"
        isDestructive
        onConfirm={doEndLeague}
        onCancel={() => setEndLeagueConfirmOpen(false)}
      />

      {/* Remove Player Confirmation */}
      <ConfirmModal
        isOpen={!!removePlayerConfirm}
        title="Remove Player?"
        message={`Remove ${removePlayerConfirm?.name || 'this player'} from the league? All their match results will be deleted. This cannot be undone.`}
        confirmLabel="Remove"
        isDestructive
        onConfirm={doRemovePlayer}
        onCancel={() => setRemovePlayerConfirm(null)}
      />
    </MainLayout>
  );
}
