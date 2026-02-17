"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Trophy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/layouts/PageHeader';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import LeagueCard from '@/components/leagues/LeagueCard';
import { useLeagues } from '@/hooks/useLeagues';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/lib/AuthContext';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { useSeasons } from '@/hooks/useSeasons';
import { Calendar } from 'lucide-react';
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
        // Only calculate leaders for new leagues with playerIds
        // Old leagues don't have playerIds and require special handling
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
  }, [searchQuery, filters, leagues, seasonFilter, activeSeason]);

  const activeLeaguesCount = filteredLeagues.filter((l) => l.status === 'active').length;
  const upcomingLeaguesCount = filteredLeagues.filter((l) => l.status === 'upcoming').length;
  const completedLeaguesCount = filteredLeagues.filter((l) => l.status === 'completed').length;

  const handleLeagueClick = (leagueId: string) => {
    router.push(`/leagues/${leagueId}`);
  };

  const handleCreateLeague = () => {
    setIsCreateModalOpen(true);
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
      // Calculate total matches (round-robin: n(n-1)/2)
      const numPlayers = data.playerIds.length;
      const totalMatches = (numPlayers * (numPlayers - 1)) / 2;

      await createLeague({
        name: data.name,
        season: data.season,
        ...(data.seasonId && { seasonId: data.seasonId }),
        status: data.status,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : undefined,
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

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{activeLeaguesCount}</div>
                <div className="text-sm text-gray-400">Active Leagues</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/30 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">{upcomingLeaguesCount}</div>
                <div className="text-sm text-gray-400">Upcoming</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-2 border-gray-500/30 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-white">{completedLeaguesCount}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by league name or season..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-12 pr-4 py-3
                  bg-gray-900/50 border-2 border-white/10
                  rounded-2xl
                  text-white placeholder-gray-500
                  focus:outline-none focus:border-cyber-500/50
                  transition-colors
                  backdrop-blur-xl
                "
              />
            </div>

            {/* Create League Button - Admin Only */}
            {isAuthenticated && (
              <button
                onClick={handleCreateLeague}
                className="
                  px-6 py-3
                  bg-gradient-to-r from-cyber-500 to-cyber-600
                  hover:from-cyber-600 hover:to-cyber-700
                  text-white font-bold
                  rounded-2xl
                  transition-all duration-300
                  hover:shadow-glow
                  flex items-center justify-center gap-2
                  whitespace-nowrap
                "
              >
                <Plus className="w-5 h-5" />
                <span>Create League</span>
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-3 mt-4">
            {/* Season Filter */}
            {seasons.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-light-600 dark:text-gray-400 text-sm">Season:</span>
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
                  className="w-48"
                />
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-light-600 dark:text-gray-400 text-sm">Status:</span>
              {(['all', 'active', 'upcoming', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilters({ ...filters, status })}
                  className={`
                    px-4 py-2 rounded-full
                    font-semibold text-sm
                    transition-all duration-300
                    ${
                      filters.status === status
                        ? 'bg-gradient-to-r from-cyber-500 to-electric-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }
                  `}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Leagues Grid */}
        {leaguesLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading leagues...</p>
          </motion.div>
        ) : filteredLeagues.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredLeagues.map((league, index) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
              >
                <LeagueCard
                  league={league}
                  onClick={() => handleLeagueClick(league.id!)}
                  leagueLeader={league.id ? leagueLeaders[league.id] : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center py-16"
          >
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No leagues found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first league'}
            </p>
          </motion.div>
        )}
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
