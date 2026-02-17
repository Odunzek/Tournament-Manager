"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Target,
  Users,
  Calendar,
  ArrowLeft,
  Play,
  CheckCircle,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LeagueCard from '@/components/leagues/LeagueCard';
import TournamentCard from '@/components/tournaments/TournamentCard';
import SeasonRankingsSection from '@/components/seasons/SeasonRankingsSection';
import SeasonSidebar from '@/components/seasons/SeasonSidebar';
import AssignToSeasonModal from '@/components/seasons/AssignToSeasonModal';
import EditSeasonModal from '@/components/seasons/EditSeasonModal';
import { useSeasonBySlug } from '@/hooks/useSeasons';
import { useSeasonLeagues } from '@/hooks/useSeasonLeagues';
import { useSeasonTournaments } from '@/hooks/useSeasonTournaments';
import { useAuth } from '@/lib/AuthContext';
import { activateSeason, completeSeason, deleteSeason, getActiveSeason } from '@/lib/seasonUtils';
import { copyGlobalRankingsToSeason, recomputeSeasonStats, unassignLeagueFromSeason, unassignTournamentFromSeason } from '@/lib/seasonIntegrationUtils';

export default function SeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { season, loading } = useSeasonBySlug(slug);
  const { isAuthenticated } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Real data hooks
  const { leagues, loading: leaguesLoading } = useSeasonLeagues(season?.id);
  const { tournaments, loading: tournamentsLoading } = useSeasonTournaments(season?.id);

  // Recompute season stats when leagues/tournaments change
  const prevCountRef = useRef<string>('');
  useEffect(() => {
    if (!season?.id) return;
    const key = `${leagues.length}-${tournaments.length}`;
    if (prevCountRef.current && prevCountRef.current !== key) {
      recomputeSeasonStats(season.id).catch(console.error);
    }
    prevCountRef.current = key;
  }, [season?.id, leagues.length, tournaments.length]);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = () => {
    if (!season) return null;
    const badges = {
      active: {
        label: 'Active',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: Play,
      },
      setup: {
        label: 'Setup',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Calendar,
      },
      completed: {
        label: 'Completed',
        className: 'bg-gray-500/20 text-light-600 dark:text-gray-400 border-gray-500/30',
        icon: CheckCircle,
      },
    };
    const badge = badges[season.status];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const handleActivate = async () => {
    if (!season?.id) return;

    // Check if there's a currently active season and confirm before auto-completing it
    const currentActive = await getActiveSeason();
    if (currentActive && currentActive.id !== season.id) {
      const confirmed = confirm(
        `"${currentActive.name}" is currently active and will be marked as completed. Continue?`
      );
      if (!confirmed) return;
    }

    setActionLoading('activate');
    try {
      await activateSeason(season.id);
      // Initialize per-season rankings from global P4P on activation
      await copyGlobalRankingsToSeason(season.id);
    } catch (error) {
      console.error('Error activating season:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!season?.id) return;
    setActionLoading('complete');
    try {
      await completeSeason(season.id);
    } catch (error) {
      console.error('Error completing season:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!season?.id) return;
    setActionLoading('delete');
    try {
      await deleteSeason(season.id);
      router.push('/seasons');
    } catch (error) {
      console.error('Error deleting season:', error);
    } finally {
      setActionLoading(null);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-cyber-400 mx-auto mb-4 animate-spin" />
            <p className="text-light-600 dark:text-gray-400">Loading season...</p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (!season) {
    return (
      <MainLayout>
        <GlobalNavigation />
        <Container maxWidth="2xl" className="py-16">
          <div className="text-center">
            <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-2">Season not found</h2>
            <p className="text-light-600 dark:text-gray-400 mb-6">
              The season you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/seasons')}>
              Back to Seasons
            </Button>
          </div>
        </Container>
      </MainLayout>
    );
  }

  const stats = season.stats || {
    totalLeagues: 0,
    totalTournaments: 0,
    totalMatches: 0,
    activePlayers: 0,
  };

  // ---------- Section renderers ----------

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Leagues Summary Card */}
      <Card variant="default">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-500/20 border border-cyber-600/30 dark:border-transparent flex items-center justify-center">
              <Trophy className="w-5 h-5 text-cyber-600 dark:text-cyber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-900 dark:text-white">Leagues</h2>
              <p className="text-sm text-light-600 dark:text-gray-400">
                {leagues.length} league{leagues.length !== 1 ? 's' : ''} in this season
              </p>
            </div>
          </div>
          {leagues.length > 0 && (
            <button
              onClick={() => setActiveSection('leagues')}
              className="text-sm font-semibold text-cyber-600 dark:text-cyber-400 hover:text-cyber-700 dark:hover:text-cyber-300 transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {leaguesLoading ? (
          <div className="text-center py-6">
            <Loader2 className="w-6 h-6 text-cyber-400 mx-auto animate-spin" />
          </div>
        ) : leagues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leagues.slice(0, 4).map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                onClick={() => router.push(`/leagues/${league.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className="w-10 h-10 text-light-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-light-600 dark:text-gray-400">No leagues yet</p>
          </div>
        )}
      </Card>

      {/* Tournaments Summary Card */}
      <Card variant="default">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-600/30 dark:border-transparent flex items-center justify-center">
              <Target className="w-5 h-5 text-electric-600 dark:text-electric-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-900 dark:text-white">Tournaments</h2>
              <p className="text-sm text-light-600 dark:text-gray-400">
                {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} in this season
              </p>
            </div>
          </div>
          {tournaments.length > 0 && (
            <button
              onClick={() => setActiveSection('tournaments')}
              className="text-sm font-semibold text-electric-600 dark:text-electric-400 hover:text-electric-700 dark:hover:text-electric-300 transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {tournamentsLoading ? (
          <div className="text-center py-6">
            <Loader2 className="w-6 h-6 text-electric-400 mx-auto animate-spin" />
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tournaments.slice(0, 4).map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onClick={() => router.push(`/tournaments/${tournament.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Target className="w-10 h-10 text-light-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-light-600 dark:text-gray-400">No tournaments yet</p>
          </div>
        )}
      </Card>
    </motion.div>
  );

  const renderLeagues = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="default">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-500/20 border border-cyber-600/30 dark:border-transparent flex items-center justify-center">
              <Trophy className="w-5 h-5 text-cyber-600 dark:text-cyber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-900 dark:text-white">Leagues</h2>
              {leagues.length > 0 && (
                <p className="text-sm text-light-600 dark:text-gray-400">
                  {leagues.length} league{leagues.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {isAuthenticated && season.status !== 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Assign Existing
            </Button>
          )}
        </div>

        {leaguesLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-cyber-400 mx-auto animate-spin" />
          </div>
        ) : leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leagues.map((league) => (
              <div key={league.id} className="relative group">
                <LeagueCard
                  league={league}
                  onClick={() => router.push(`/leagues/${league.id}`)}
                />
                {isAuthenticated && season.status !== 'completed' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`Unassign "${league.name}" from ${season.name}?`)) return;
                      await unassignLeagueFromSeason(league.id!);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all"
                  >
                    Unassign
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-light-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-light-600 dark:text-gray-400">
              No leagues in this season yet. Create a new league or assign existing ones.
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );

  const renderTournaments = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="default">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-600/30 dark:border-transparent flex items-center justify-center">
              <Target className="w-5 h-5 text-electric-600 dark:text-electric-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-900 dark:text-white">Tournaments</h2>
              {tournaments.length > 0 && (
                <p className="text-sm text-light-600 dark:text-gray-400">
                  {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {isAuthenticated && season.status !== 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Assign Existing
            </Button>
          )}
        </div>

        {tournamentsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-electric-400 mx-auto animate-spin" />
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="relative group">
                <TournamentCard
                  tournament={tournament}
                  onClick={() => router.push(`/tournaments/${tournament.id}`)}
                />
                {isAuthenticated && season.status !== 'completed' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`Unassign "${tournament.name}" from ${season.name}?`)) return;
                      await unassignTournamentFromSeason(tournament.id!);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all"
                  >
                    Unassign
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-light-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-light-600 dark:text-gray-400">
              No tournaments in this season yet. Create a new tournament or assign existing ones.
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );

  const renderRankings = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <SeasonRankingsSection
        seasonId={season.id!}
        seasonStatus={season.status}
      />
    </motion.div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'leagues':
        return renderLeagues();
      case 'tournaments':
        return renderTournaments();
      case 'rankings':
        return renderRankings();
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/seasons')}
          className="flex items-center gap-2 text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Seasons</span>
        </motion.button>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="gradient" className="relative overflow-hidden">
            {/* Decorative gradient overlay for active seasons */}
            {season.status === 'active' && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-500/5 to-electric-500/5 pointer-events-none" />
            )}

            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-light-900 dark:text-white mb-2">
                    {season.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-light-600 dark:text-gray-400">
                      <Gamepad2 className="w-4 h-4" />
                      {season.gameVersion}
                    </span>
                    <span className="text-light-400 dark:text-gray-600">|</span>
                    <span className="flex items-center gap-1.5 text-light-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(season.startDate)}
                      {season.endDate && ` - ${formatDate(season.endDate)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                </div>
              </div>

              {season.description && (
                <p className="text-light-700 dark:text-gray-300 mb-6">{season.description}</p>
              )}

              {/* Admin Actions */}
              {isAuthenticated && (
                <div className="flex flex-wrap gap-3">
                  {season.status === 'setup' && (
                    <Button
                      onClick={handleActivate}
                      isLoading={actionLoading === 'activate'}
                      leftIcon={<Play className="w-4 h-4" />}
                    >
                      Activate Season
                    </Button>
                  )}
                  {season.status === 'active' && (
                    <Button
                      variant="secondary"
                      onClick={handleComplete}
                      isLoading={actionLoading === 'complete'}
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                    >
                      Complete Season
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => setEditModalOpen(true)}
                    leftIcon={<Pencil className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Leagues', value: stats.totalLeagues, icon: Trophy, color: 'cyber' },
            { label: 'Tournaments', value: stats.totalTournaments, icon: Target, color: 'electric' },
            { label: 'Matches', value: stats.totalMatches, icon: Gamepad2, color: 'pink' },
            { label: 'Players', value: stats.activePlayers, icon: Users, color: 'amber' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="default">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 border border-${stat.color}-600/30 dark:border-transparent flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-light-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-light-600 dark:text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* Sidebar + Content Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <SeasonSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </Container>

      {/* Assign to Season Modal */}
      <AssignToSeasonModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        seasonId={season.id!}
        seasonName={season.name}
      />

      {/* Edit Season Modal */}
      <EditSeasonModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        season={season}
      />

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md"
              >
                <Card variant="glass">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-light-900 dark:text-white">Delete Season</h3>
                  </div>
                  <p className="text-light-600 dark:text-gray-400 mb-2">
                    Are you sure you want to delete <strong className="text-light-900 dark:text-white">{season.name}</strong>?
                  </p>
                  <p className="text-sm text-light-500 dark:text-gray-500 mb-6">
                    Linked leagues and tournaments will be unassigned but not deleted. Season rankings will be permanently removed.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="flex-1"
                      disabled={actionLoading === 'delete'}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDelete}
                      isLoading={actionLoading === 'delete'}
                      className="flex-1 bg-red-500 hover:bg-red-600 border-red-500"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      {actionLoading === 'delete' ? 'Deleting...' : 'Delete Season'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
