/**
 * Tournament Detail Page
 *
 * Displays comprehensive tournament information with sidebar navigation.
 * Integrates Firebase components with the new cyber-themed UI.
 *
 * @page
 * @features
 * - Real-time tournament data from Firebase
 * - Sidebar navigation for different sections
 * - Admin-only features (match recording, generation)
 * - Responsive layout with mobile support
 * - Live updates for matches and standings
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MainLayout from '../../../components/layouts/MainLayout';
import Container from '../../../components/layouts/Container';
import GlobalNavigation from '../../../components/layouts/GlobalNavigation';
import TournamentSidebar from '../../../components/tournaments/TournamentSidebar';
import Button from '../../../components/ui/Button';
import { TournamentSection } from '@/types/tournament';
import { AuthProvider, AuthModal, useAuth } from '@/lib/AuthContext';
import {
  Tournament,
  getTournamentById,
  subscribeToTournamentById,
  subscribeToTournamentMembers,
  generateGroups,
  progressToKnockoutStage,
  recordGroupMatch,
  recordKnockoutMatch,
  getTournamentMembers,
  TournamentParticipant,
  deleteTournament,
  updateTournament,
  repairKnockoutProgression,
} from '@/lib/tournamentUtils';
import { incrementTournamentWins } from '@/lib/playerUtils';
import { usePlayers } from '@/hooks/usePlayers';

// Section components
import Overview from '../../../components/tournaments/sections/Overview';
import Groups from '../../../components/tournaments/sections/Groups';
import Fixtures from '../../../components/tournaments/sections/Fixtures';
import Teams from '../../../components/tournaments/sections/Teams';
import Knockout from '../../../components/tournaments/sections/Knockout';
import Results from '../../../components/tournaments/sections/Results';
const sectionComponents: Record<TournamentSection, React.ComponentType<any>> = {
  overview: Overview,
  groups: Groups,
  fixtures: Fixtures,
  teams: Teams,
  knockout: Knockout,
  results: Results,
};

function TournamentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const { players } = usePlayers();
  const tournamentId = params?.id as string;

  // State management
  const [activeSection, setActiveSection] = useState<TournamentSection>('overview');
  const [mounted, setMounted] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentMembers, setTournamentMembers] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tournament data
  useEffect(() => {
    setMounted(true);

    if (!tournamentId) return;

    // Subscribe to real-time tournament updates
    const unsubscribe = subscribeToTournamentById(tournamentId, (updatedTournament) => {
      if (updatedTournament) {
        setTournament(updatedTournament);
        setError(null);
      } else {
        setError('Tournament not found');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Subscribe to real-time tournament members
  useEffect(() => {
    if (!tournamentId) return;

    const unsubscribe = subscribeToTournamentMembers(tournamentId, (members) => {
      setTournamentMembers(members);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  /**
   * Navigate back to tournaments list
   */
  const handleBack = () => {
    router.push('/tournaments');
  };

  /**
   * Check if all group stage matches are complete
   */
  const areGroupMatchesComplete = (tournament: Tournament): boolean => {
    if (!tournament.groups || tournament.groups.length === 0) return false;
    return tournament.groups.every(group =>
      group.matches.every(match => match.played)
    );
  };

  /**
   * Handle generate groups action (Admin only)
   */
  const handleGenerateGroups = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!tournament) return;

    try {
      setLoading(true);
      await generateGroups(tournament.id!);
      // Tournament will update via real-time listener
    } catch (err) {
      console.error('Error generating groups:', err);
      setError('Failed to generate groups');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle generate knockout stage action (Admin only)
   */
  const handleGenerateKnockout = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!tournament) return;

    try {
      setLoading(true);
      await progressToKnockoutStage(tournament.id!);
      // Tournament will update via real-time listener
    } catch (err) {
      console.error('Error generating knockout:', err);
      setError('Failed to generate knockout stage');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle record group match action (Admin only)
   */
  const handleRecordGroupMatch = async (groupId: string, homeTeam: string, awayTeam: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // This will be handled by the Groups section component
  };

  /**
   * Handle record knockout match action (Admin only)
   */
  const handleRecordKnockoutMatch = async (tieId: string, leg: 'first' | 'second', homeTeam: string, awayTeam: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // This will be handled by the Knockout section component
  };

  /**
   * Handle delete tournament action (Admin only)
   */
  const handleDeleteTournament = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!tournament) return;

    try {
      setLoading(true);
      await deleteTournament(tournament.id!);
      // Redirect to tournaments list
      router.push('/tournaments');
    } catch (err) {
      console.error('Error deleting tournament:', err);
      setError('Failed to delete tournament');
      setLoading(false);
    }
  };

  /**
   * Handle complete tournament action (Admin only)
   */
  const handleCompleteTournament = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!tournament) return;

    const confirmed = confirm('Are you sure you want to mark this tournament as completed?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await updateTournament(tournament.id!, { status: 'completed' });

      // Auto-award tournament title to the winner
      const finalTie = tournament.knockoutBracket?.find(
        (tie) => tie.round === 'final' && tie.completed && tie.winner
      );
      if (finalTie?.winner) {
        const winnerPlayer = players.find((p) => p.name === finalTie.winner);
        if (winnerPlayer?.id) {
          await incrementTournamentWins(winnerPlayer.id, tournament.seasonId);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error completing tournament:', err);
      setError('Failed to complete tournament');
      setLoading(false);
    }
  };

  /**
   * Handle repair knockout progression (Admin only)
   */
  const handleRepairKnockout = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!tournament) return;

    try {
      setLoading(true);
      await repairKnockoutProgression(tournament.id!);
      // Tournament will update via real-time listener
    } catch (err) {
      console.error('Error generating next round:', err);
      setError('Failed to generate next round');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (!mounted || loading) {
    return (
      <MainLayout showBackground={false}>
        <GlobalNavigation />
        <div className="min-h-screen bg-gradient-to-br from-light-100 via-light-200 to-light-300 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-cyber-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading tournament...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error || !tournament) {
    return (
      <MainLayout showBackground={false}>
        <GlobalNavigation />
        <div className="min-h-screen bg-gradient-to-br from-light-100 via-light-200 to-light-300 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Tournament not found'}</p>
            <Button onClick={handleBack} variant="outline">
              Back to Tournaments
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const ActiveSectionComponent = sectionComponents[activeSection];

  return (
    <MainLayout showBackground={false}>
      <GlobalNavigation />
      <div className="min-h-screen bg-gradient-to-br from-light-100 via-light-200 to-light-300 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200">
        {/* Mobile Header */}
        <div className="md:hidden bg-light-50/95 dark:bg-dark-100/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10 sticky top-0 z-40 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleBack}
          >
            Back to Tournaments
          </Button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <TournamentSidebar
            activeSection={activeSection}
            onSectionChange={(section) => setActiveSection(section as TournamentSection)}
            tournamentId={tournamentId}
          />

          {/* Main Content */}
          <main className="flex-1 min-h-screen">
            <Container maxWidth="2xl" className="py-6 sm:py-8 pb-24 md:pb-8">
              {/* Desktop Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:block mb-6"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handleBack}
                >
                  Back to Tournaments
                </Button>
              </motion.div>

              {/* Section Content */}
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ActiveSectionComponent
                  tournament={tournament}
                  tournamentMembers={tournamentMembers}
                  isAuthenticated={isAuthenticated && tournament.status !== 'completed'}
                  isLoading={loading}
                  onGenerateGroups={handleGenerateGroups}
                  onGenerateKnockout={handleGenerateKnockout}
                  onRecordGroupMatch={handleRecordGroupMatch}
                  onRecordKnockoutMatch={handleRecordKnockoutMatch}
                  areGroupMatchesComplete={areGroupMatchesComplete}
                  setTournament={setTournament}
                  onDeleteTournament={handleDeleteTournament}
                  onCompleteTournament={handleCompleteTournament}
                  onRepairKnockout={handleRepairKnockout}
                />
              </motion.div>
            </Container>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}

export default function TournamentDetailPage() {
  return (
    <AuthProvider>
      <TournamentDetailContent />
      <AuthModal />
    </AuthProvider>
  );
}
