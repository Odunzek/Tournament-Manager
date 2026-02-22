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
  Crown,
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
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useSeasonBySlug } from '@/hooks/useSeasons';
import { useSeasonLeagues } from '@/hooks/useSeasonLeagues';
import { useSeasonTournaments } from '@/hooks/useSeasonTournaments';
import { useHallOfFame } from '@/hooks/usePlayers';
import PlayerAvatar from '@/components/players/PlayerAvatar';
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
  const [completeSeasonConfirmOpen, setCompleteSeasonConfirmOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const { leagues, loading: leaguesLoading } = useSeasonLeagues(season?.id);
  const { tournaments, loading: tournamentsLoading } = useSeasonTournaments(season?.id);
  const { players: hofPlayers, loading: hofLoading } = useHallOfFame(season?.id ?? null);

  const prevCountRef = useRef<string>('');
  useEffect(() => {
    if (!season?.id || !isAuthenticated) return;
    const key = `${leagues.length}-${tournaments.length}`;
    if (prevCountRef.current && prevCountRef.current !== key) {
      recomputeSeasonStats(season.id).catch(console.error);
    }
    prevCountRef.current = key;
  }, [isAuthenticated, season?.id, leagues.length, tournaments.length]);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = () => {
    if (!season) return null;
    const badges = {
      active: { label: 'Active', className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25' },
      setup: { label: 'Setup', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25' },
      completed: { label: 'Completed', className: 'bg-gray-500/15 text-light-600 dark:text-gray-400 border-gray-500/25' },
    };
    const badge = badges[season.status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const handleActivate = async () => {
    if (!season?.id) return;
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
      await copyGlobalRankingsToSeason(season.id);
    } catch (error) {
      console.error('Error activating season:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = () => {
    if (!season?.id) return;
    setCompleteSeasonConfirmOpen(true);
  };

  const doComplete = async () => {
    if (!season?.id) return;
    setCompleteSeasonConfirmOpen(false);
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
            <Loader2 className="w-10 h-10 text-cyber-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-light-600 dark:text-gray-400">Loading season…</p>
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
            <Gamepad2 className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-light-900 dark:text-white mb-2">Season not found</h2>
            <p className="text-light-600 dark:text-gray-400 mb-6">
              The season you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/seasons')}>Back to Seasons</Button>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                <LeagueCard league={league} onClick={() => router.push(`/leagues/${league.id}`)} />
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <SeasonRankingsSection seasonId={season.id!} seasonStatus={season.status} />
    </motion.div>
  );

  const renderHallOfFame = () => {
    const getAch = (p: any) =>
      p.seasonAchievements?.[season.id!] ?? {
        leagueWins: 0,
        tournamentWins: 0,
        totalTitles: 0,
        tier: null,
      };

    const sorted = [...hofPlayers].sort(
      (a, b) => getAch(b).totalTitles - getAch(a).totalTitles
    );

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {hofLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 text-yellow-400 mx-auto animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-14">
            <Crown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-light-600 dark:text-gray-400 font-semibold">No champions yet</p>
            <p className="text-sm text-light-500 dark:text-gray-500 mt-1">
              Complete a league or tournament to crown a winner.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sorted.map((player, index) => {
              const ach = getAch(player);
              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => router.push(`/players/${player.id}`)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl text-center
                             bg-light-100/80 dark:bg-dark-100/60
                             border border-black/8 dark:border-white/8
                             hover:border-yellow-500/30 hover:bg-light-200/60 dark:hover:bg-dark-100/80
                             transition-all group"
                >
                  <PlayerAvatar
                    src={player.avatar}
                    alt={player.name}
                    size="md"
                    showBorder
                    borderColor="border-yellow-500/40"
                  />
                  <span className="text-sm font-bold text-light-900 dark:text-white truncate w-full">
                    {player.name}
                  </span>

                  {/* Trophy breakdown */}
                  <div className="flex items-center justify-center gap-3 text-xs">
                    {ach.leagueWins > 0 && (
                      <span className="flex items-center gap-1 text-cyber-600 dark:text-cyber-400">
                        <Trophy className="w-3.5 h-3.5" />
                        {ach.leagueWins}
                      </span>
                    )}
                    {ach.tournamentWins > 0 && (
                      <span className="flex items-center gap-1 text-electric-600 dark:text-electric-400">
                        <Target className="w-3.5 h-3.5" />
                        {ach.tournamentWins}
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <span className="text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
                    {ach.totalTitles} title{ach.totalTitles !== 1 ? 's' : ''}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'leagues': return renderLeagues();
      case 'tournaments': return renderTournaments();
      case 'rankings': return renderRankings();
      case 'hof': return renderHallOfFame();
      default: return null;
    }
  };

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/seasons')}
          className="flex items-center gap-2 text-sm text-light-600 dark:text-gray-400
                     hover:text-light-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Seasons</span>
        </motion.button>

        {/* Hero strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Title + meta */}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-light-900 dark:text-white">
                  {season.name}
                </h1>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-light-600 dark:text-gray-400 flex-wrap">
                <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                <span>{season.gameVersion}</span>
                <span className="text-gray-500">·</span>
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatDate(season.startDate)}
                  {season.endDate && ` – ${formatDate(season.endDate)}`}
                </span>
              </div>
              {season.description && (
                <p className="mt-2 text-sm text-light-600 dark:text-gray-400 max-w-xl">
                  {season.description}
                </p>
              )}
            </div>

            {/* Admin actions */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {season.status === 'setup' && (
                  <button
                    onClick={handleActivate}
                    disabled={actionLoading === 'activate'}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold
                               bg-gradient-to-r from-cyber-500 to-cyber-600 text-white
                               hover:from-cyber-600 hover:to-cyber-700 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'activate'
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Play className="w-4 h-4" />}
                    Activate
                  </button>
                )}
                {season.status === 'active' && (
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading === 'complete'}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold
                               bg-light-200 dark:bg-dark-100/60 border border-black/10 dark:border-white/10
                               text-light-900 dark:text-white hover:border-cyber-500/30 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'complete'
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle className="w-4 h-4" />}
                    Complete
                  </button>
                )}
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="p-2 rounded-xl text-light-600 dark:text-gray-400
                             hover:text-light-900 dark:hover:text-white
                             bg-light-200/60 dark:bg-dark-100/40
                             hover:bg-light-200 dark:hover:bg-dark-100/70 transition-all"
                  title="Edit season"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="p-2 rounded-xl text-red-500 hover:text-red-400
                             bg-red-500/10 hover:bg-red-500/20 transition-all"
                  title="Delete season"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-7"
        >
          {[
            { icon: Trophy, value: stats.totalLeagues, label: 'Leagues', colorClass: 'text-cyber-600 dark:text-cyber-400' },
            { icon: Target, value: stats.totalTournaments, label: 'Tournaments', colorClass: 'text-electric-600 dark:text-electric-400' },
            { icon: Gamepad2, value: stats.totalMatches, label: 'Matches', colorClass: 'text-pink-600 dark:text-pink-400' },
            { icon: Users, value: stats.activePlayers, label: 'Players', colorClass: 'text-amber-600 dark:text-amber-400' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                           bg-light-100/80 dark:bg-dark-100/60
                           border border-black/8 dark:border-white/8 text-sm"
              >
                <Icon className={`w-3.5 h-3.5 ${s.colorClass}`} />
                <span className="font-bold text-light-900 dark:text-white">{s.value}</span>
                <span className="text-xs text-light-500 dark:text-gray-500">{s.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Tab strip + content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <SeasonSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          {renderSection()}
        </motion.div>
      </Container>

      <AssignToSeasonModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        seasonId={season.id!}
        seasonName={season.name}
      />

      <EditSeasonModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        season={season}
      />

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
                    Are you sure you want to delete{' '}
                    <strong className="text-light-900 dark:text-white">{season.name}</strong>?
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
                      {actionLoading === 'delete' ? 'Deleting…' : 'Delete Season'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Complete Season Confirmation */}
      <ConfirmModal
        isOpen={completeSeasonConfirmOpen}
        title="Complete Season?"
        message={`This will mark "${season.name}" as completed. All active leagues and tournaments should be finished first.`}
        confirmLabel="Complete Season"
        isDestructive
        isLoading={actionLoading === 'complete'}
        onConfirm={doComplete}
        onCancel={() => setCompleteSeasonConfirmOpen(false)}
      />
    </MainLayout>
  );
}
