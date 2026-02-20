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

  // Calculate league leaders for each league
  const [leagueLeaders, setLeagueLeaders] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchLeaders = async () => {
      const leaders: Record<string, string> = {};

      for (const league of leagues) {
        if (league.status === 'active' && league.id && league.playerIds && league.playerIds.length > 0) {
          try {
            const leaguePlayers = players.filter((p) => league.playerIds.includes(p.id!));
            if (leaguePlayers.length > 0) {
              const standings = await calculateStandings(league.id, leaguePlayers);
              if (standings.length > 0) {
                leaders[league.id] = standings[0].name;
              }
            }
          } catch (error) {
            console.error(`Error calculating standings for league ${league.id}:`, error);
          }
        }
      }

      setLeagueLeaders(leaders);
    };

    if (leagues.length > 0 && players.length > 0) {
      fetchLeaders();
    }
  }, [leagues, players]);

  // Filter and search leagues
  const filteredLeagues = useMemo(() => {
    let result = [...leagues];

    // Season filter
    if (seasonFilter === 'active_season' && activeSeason?.id) {
      result = result.filter((league) =>
        league.seasonId === activeSeason.id ||
        (!league.seasonId && league.season === activeSeason.name)
      );
    } else if (seasonFilter !== 'all' && seasonFilter !== 'active_season') {
      const selectedSeason = seasons.find((s) => s.id === seasonFilter);
      result = result.filter((league) =>
        league.seasonId === seasonFilter ||
        (!league.seasonId && selectedSeason && league.season === selectedSeason.name)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (league) =>
          league.name.toLowerCase().includes(query) ||
          league.season.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((league) => league.status === filters.status);
    }

    return result;
  }, [searchQuery, filters, leagues, seasonFilter, activeSeason, seasons]);

  const handleLeagueClick = (leagueId: string) => {
    router.push(`/leagues/${leagueId}`);
  };

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
      <Container maxWidth="2xl" className="py-8 sm:py-12">
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
          className="flex flex-col sm:flex-row gap-4 mb-8"
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
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyber-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading leagues...</p>
          </div>
        ) : filteredLeagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            className="text-center py-20"
          >
            <Filter className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-light-900 dark:text-white mb-2">No leagues found</h3>
            <p className="text-gray-400 mb-8">
              {searchQuery || filters.status !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first league to get started'}
            </p>
          </motion.div>
        )}

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Leagues', value: filteredLeagues.length },
            { label: 'Active', value: filteredLeagues.filter((l) => l.status === 'active').length },
            { label: 'Upcoming', value: filteredLeagues.filter((l) => l.status === 'upcoming').length },
            { label: 'Completed', value: filteredLeagues.filter((l) => l.status === 'completed').length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 bg-light-200/50 dark:bg-dark-100/50 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl"
            >
              <p className="text-xs text-light-700 dark:text-gray-300 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-light-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
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
