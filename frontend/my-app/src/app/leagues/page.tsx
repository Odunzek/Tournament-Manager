/**
 * Leagues Listing Page — `/leagues`
 *
 * Displays all leagues with search, season, and status filtering.
 * Admins can create new leagues from this page via the CreateLeagueModal.
 *
 * Data flow:
 *   - `useLeagues()` — real-time snapshot of all league documents, newest first.
 *   - `usePlayers()` — needed to resolve player names when calculating league leaders.
 *   - `useActiveSeason()` / `useSeasons()` — drive the season filter dropdown.
 *
 * Filtering logic (applied in order):
 *   1. Season filter  — defaults to the currently active season; can be changed to
 *                       any past season or "All Seasons".
 *   2. Search query   — case-insensitive substring match on league name or season name.
 *   3. Status filter  — All / Active / Upcoming / Completed toggle buttons.
 *
 * League leaders are fetched asynchronously (non-blocking) after the league list loads,
 * so the cards render immediately with a placeholder until standings are ready.
 */
"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Trophy, Loader2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/layouts/PageHeader';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import LeagueCard from '@/components/leagues/LeagueCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLeagues } from '@/hooks/useLeagues';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/lib/AuthContext';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { useSeasons } from '@/hooks/useSeasons';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { LeagueFilters } from '@/types/league';
import { calculateStandings, createLeague } from '@/lib/leagueUtils';
import { Timestamp } from 'firebase/firestore';
import CreateLeagueModal from '@/components/leagues/CreateLeagueModal';

export default function LeaguesPage() {
  const router = useRouter();
  const { leagues, loading: leaguesLoading } = useLeagues();
  const { players } = usePlayers();
  const { isAuthenticated } = useAuth();
  const { activeSeason } = useActiveSeason();
  const { seasons } = useSeasons();
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<string>('active_season');
  const [filters, setFilters] = useState<LeagueFilters>({
    search: '',
    status: 'all',
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  /**
   * League leaders map: { [leagueId]: playerName }.
   * Populated asynchronously after leagues load — each card shows the
   * current points leader once their standings have been calculated.
   */
  const [leagueLeaders, setLeagueLeaders] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchLeaders = async () => {
      const leaders: Record<string, string> = {};

      for (const league of leagues) {
        // Only compute standings for leagues that have been played (active or completed)
        // and have at least one player assigned
        if ((league.status === 'active' || league.status === 'completed') && league.id && league.playerIds && league.playerIds.length > 0) {
          try {
            const leaguePlayers = players.filter((p) => league.playerIds.includes(p.id!));
            if (leaguePlayers.length > 0) {
              const standings = await calculateStandings(league.id, leaguePlayers);
              if (standings.length > 0) {
                leaders[league.id] = standings[0].name; // Position 1 = leader
              }
            }
          } catch (error) {
            console.error(`Error calculating standings for league ${league.id}:`, error);
          }
        }
      }

      setLeagueLeaders(leaders);
    };

    // Wait until both datasets are ready before attempting standings calculation
    if (leagues.length > 0 && players.length > 0) {
      fetchLeaders();
    }
  }, [leagues, players]);

  /**
   * Filtered leagues array derived from all three active filter states.
   * Runs client-side (no extra Firestore queries) since all leagues are already loaded.
   */
  const filteredLeagues = useMemo(() => {
    let result = [...leagues];

    // --- 1. Season filter ---
    // 'active_season' matches leagues whose seasonId equals the current active season's ID,
    // OR (for legacy leagues that store season as a name string) whose season name matches.
    if (seasonFilter === 'active_season' && activeSeason?.id) {
      result = result.filter((league) =>
        league.seasonId === activeSeason.id ||
        (!league.seasonId && league.season === activeSeason.name)
      );
    } else if (seasonFilter !== 'all' && seasonFilter !== 'active_season') {
      // A specific past season is selected
      const selectedSeason = seasons.find((s) => s.id === seasonFilter);
      result = result.filter((league) =>
        league.seasonId === seasonFilter ||
        (!league.seasonId && selectedSeason && league.season === selectedSeason.name)
      );
    }

    // --- 2. Text search ---
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (league) =>
          league.name.toLowerCase().includes(query) ||
          league.season.toLowerCase().includes(query)
      );
    }

    // --- 3. Status filter ---
    if (filters.status !== 'all') {
      result = result.filter((league) => league.status === filters.status);
    }

    return result;
  }, [searchQuery, filters, leagues, seasonFilter, activeSeason, seasons]);

  /** Navigate to the league detail page when a league card is clicked. */
  const handleLeagueClick = (leagueId: string) => {
    router.push(`/leagues/${leagueId}`);
  };

  /**
   * Create a new league from the form data submitted by CreateLeagueModal.
   * Calculates `totalMatches` using the round-robin formula `n*(n-1)/2` so the
   * league progress bar is accurate from the moment the league is created.
   */
  const handleCreateLeagueSubmit = async (data: {
    name: string;
    season: string;
    seasonId?: string;
    status: 'active' | 'upcoming' | 'completed';
    startDate: string;
    endDate: string;
    playerIds: string[];
  }) => {
    try {
      const numPlayers = data.playerIds.length;
      const totalMatches = (numPlayers * (numPlayers - 1)) / 2;

      await createLeague({
        name: data.name,
        season: data.season,
        ...(data.seasonId && { seasonId: data.seasonId }),
        status: data.status,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        ...(data.endDate ? { endDate: Timestamp.fromDate(new Date(data.endDate)) } : {}),
        playerIds: data.playerIds,
        totalMatches,
        matchesPlayed: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-4 sm:py-8">
        {/* Header */}
        <PageHeader
          title="LEAGUES"
          subtitle={`Manage your ${filteredLeagues.length} league${filteredLeagues.length !== 1 ? 's' : ''}${
            seasonFilter === 'active_season' && activeSeason
              ? ` in ${activeSeason.name}`
              : seasonFilter !== 'all' && seasonFilter !== 'active_season'
                ? ` in ${seasons.find((s) => s.id === seasonFilter)?.name ?? 'Season'}`
                : ''
          }`}
          gradient="electric"
        />

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6"
        >
          <div className="flex-1">
            <Input
              placeholder="Search leagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Season Filter */}
            {seasons.length > 0 && (
              <>
                <CustomDropdown
                  value={seasonFilter}
                  onChange={(val) => setSeasonFilter(val as string)}
                  options={[
                    ...(activeSeason ? [{ value: 'active_season', label: `● ${activeSeason.name}` }] : []),
                    { value: 'all', label: 'All Seasons' },
                    ...seasons
                      .filter((s) => s.id !== activeSeason?.id)
                      .map((s) => ({ value: s.id!, label: s.name })),
                  ]}
                  className="w-40 sm:w-48"
                />
                <div className="w-px bg-white/10 mx-1 self-stretch" />
              </>
            )}

            {/* Status Filter */}
            {(['all', 'active', 'upcoming', 'completed'] as const).map((status) => (
              <Button
                key={status}
                variant={filters.status === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilters({ ...filters, status })}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* Admin-only: Create League Button */}
          {isAuthenticated && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
              glow
            >
              Create
            </Button>
          )}
        </motion.div>

        {/* Leagues Grid */}
        {leaguesLoading ? (
          <div className="flex flex-col items-center justify-center py-10 sm:py-20">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-cyber-400 animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400">Loading leagues...</p>
          </div>
        ) : filteredLeagues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {filteredLeagues.map((league, index) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <LeagueCard
                  league={league}
                  onClick={() => handleLeagueClick(league.id!)}
                  leagueLeader={league.id ? leagueLeaders[league.id] : undefined}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-10 sm:py-20"
          >
            <Filter className="w-12 h-12 sm:w-20 sm:h-20 text-gray-600 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-lg sm:text-2xl font-bold text-light-900 dark:text-white mb-1 sm:mb-2">No leagues found</h3>
            <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400 mb-4 sm:mb-8">
              {searchQuery || filters.status !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first league to get started'}
            </p>
          </motion.div>
        )}

        {/* Stats Footer — inline glass grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 bg-white/90 dark:bg-white/5 backdrop-blur-xl border-2 border-cyber-500/30 dark:border-white/10 rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-4 divide-x divide-black/10 dark:divide-white/10">
            {[
              { label: 'Total', value: filteredLeagues.length },
              { label: 'Active', value: filteredLeagues.filter((l) => l.status === 'active').length },
              { label: 'Upcoming', value: filteredLeagues.filter((l) => l.status === 'upcoming').length },
              { label: 'Done', value: filteredLeagues.filter((l) => l.status === 'completed').length },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2.5 sm:py-3 px-1">
                <p className="text-base sm:text-xl font-bold text-light-900 dark:text-white">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-light-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>

      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLeagueSubmit}
        players={players}
      />
    </MainLayout>
  );
}
