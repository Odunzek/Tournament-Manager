"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { useLeague, useLeagueMatches } from '@/hooks/useLeagues';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/lib/AuthContext';
import { calculateStandings, calculateWinStreaks, addPlayersToLeague, updateLeague } from '@/lib/leagueUtils';
import { LeaguePlayer, WinStreak } from '@/types/league';

export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const { league, loading: leagueLoading } = useLeague(leagueId);
  const { matches, loading: matchesLoading } = useLeagueMatches(leagueId);
  const { players } = usePlayers();
  const { isAuthenticated } = useAuth();

  const [activeSection, setActiveSection] = useState('overview');
  const [standings, setStandings] = useState<LeaguePlayer[]>([]);
  const [streaks, setStreaks] = useState<WinStreak[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);

  // Filter players to only those in this league
  const leaguePlayers = useMemo(() => {
    if (!league) return [];

    // If league has playerIds (new format), use it
    if (league.playerIds && league.playerIds.length > 0) {
      return players.filter((player) => league.playerIds.includes(player.id!));
    }

    // For old leagues without playerIds, extract player IDs from matches
    const playerIdsFromMatches = new Set<string>();
    const playerNamesMap = new Map<string, string>(); // Map player ID to name

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

    // Build player list: real players + virtual players for legacy IDs
    const leaguePlayersList = [];

    playerIdsFromMatches.forEach((playerId) => {
      // Try to find real player
      const realPlayer = players.find((player) => player.id === playerId);

      if (realPlayer) {
        leaguePlayersList.push(realPlayer);
      } else if (playerId.startsWith('legacy_')) {
        // Create virtual player object for legacy player
        const playerName = playerNamesMap.get(playerId) || playerId.replace('legacy_', '').replace(/_/g, ' ');
        leaguePlayersList.push({
          id: playerId,
          name: playerName,
          psnId: playerName, // Use name as PSN ID for legacy players
          createdAt: null,
          updatedAt: null,
        });
      }
    });

    return leaguePlayersList;
  }, [league, players, matches]);

  // Calculate standings and streaks whenever matches change
  useEffect(() => {
    const calculateData = async () => {
      if (!league?.id || leaguePlayers.length === 0) return;

      setIsCalculating(true);
      try {
        const calculatedStandings = await calculateStandings(league.id, leaguePlayers);
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
  }, [league, leaguePlayers, matches]);

  // Calculate total goals
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

  // Get league leader
  const leagueLeader = standings.length > 0 ? standings[0] : null;

  // Handle adding players to league
  const handleAddPlayers = async (newPlayerIds: string[]) => {
    if (!league?.id) return;

    try {
      await addPlayersToLeague(league.id, newPlayerIds);
      // Modal will close automatically on success
      // Data will update automatically through real-time listeners
    } catch (error) {
      console.error('Error adding players to league:', error);
      throw error; // Let modal handle error display
    }
  };

  // Handle ending league
  const handleEndLeague = async () => {
    if (!league?.id) return;

    const confirmed = confirm('Are you sure you want to end this league? This will mark it as completed.');
    if (!confirmed) return;

    try {
      await updateLeague(league.id, {
        status: 'completed',
      });
    } catch (error) {
      console.error('Error ending league:', error);
      alert('Failed to end league. Please try again.');
    }
  };

  const loading = leagueLoading || matchesLoading;

  if (loading) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-8 sm:py-12">
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading league...</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!league) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-8 sm:py-12">
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-gray-400 mb-2">League Not Found</h3>
            <p className="text-gray-500 mb-6">This league does not exist or has been deleted</p>
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
            onAddPlayers={() => setIsAddPlayersModalOpen(true)}
            onEndLeague={handleEndLeague}
            {...sectionProps}
          />
        );
      case 'standings':
        return <Standings standings={standings} leagueId={league.id!} {...sectionProps} />;
      case 'results':
        return <Results matches={matches} players={leaguePlayers} {...sectionProps} />;
      case 'streaks':
        return <StreaksAndStats streaks={streaks} standings={standings} {...sectionProps} />;
      case 'record':
        return (
          <RecordMatch
            leagueId={league.id!}
            players={leaguePlayers}
            isAuthenticated={isAuthenticated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/leagues')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leagues</span>
        </button>

        {/* Layout with Sidebar */}
        <div className="flex flex-col md:flex-row gap-8">
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
    </MainLayout>
  );
}
