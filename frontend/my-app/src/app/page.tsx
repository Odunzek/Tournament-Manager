"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/layouts/MainLayout';
import PageHeader from '../components/layouts/PageHeader';
import Container from '../components/layouts/Container';
import GlobalNavigation from '../components/layouts/GlobalNavigation';
import NavigationCard from '../components/landing/NavigationCard';
import Card from '../components/ui/Card';
import { AuthProvider, AuthModal } from '../lib/AuthContext';
import { TutorialProvider, useTutorial } from '../components/tutorial/TutorialContext';
import TutorialOverlay from '../components/tutorial/TutorialOverlay';
import { useActiveSeason } from '../hooks/useActiveSeason';
import { Calendar, ChevronRight, Trophy, Target } from 'lucide-react';

function LandingPage() {
  const { startTutorial } = useTutorial();
  const { activeSeason } = useActiveSeason();

  // Start viewer tutorial on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      startTutorial('viewer');
    }, 1000); // Delay 1 second after page load

    return () => clearTimeout(timer);
  }, []);

  // Listen for admin login to trigger admin tutorial
  useEffect(() => {
    const handleAdminLogin = () => {
      setTimeout(() => {
        startTutorial('admin');
      }, 800);
    };

    window.addEventListener('admin-logged-in', handleAdminLogin);
    return () => window.removeEventListener('admin-logged-in', handleAdminLogin);
  }, [startTutorial]);

  const navigationCards = [
    {
      title: 'Leagues',
      description: 'Create and manage your football leagues with real-time standings and match tracking.',
      icon: '/icons/league.svg',
      route: '/leagues',
      gradient: 'cyber' as const,
    },
    {
      title: 'Tournaments',
      description: 'Champions League-style tournaments with group stages and knockout rounds.',
      icon: '/icons/tournaments.svg',
      route: '/tournaments',
      gradient: 'neon' as const,
    },
    {
      title: 'Players',
      description: 'Manage player profiles, track statistics, and organize your team roster.',
      icon: '/icons/Players.svg',
      route: '/players',
      gradient: 'electric' as const,
    },
    {
      title: 'P4P Rankings',
      description: 'Player-for-Player rankings with drag-and-drop management and cool-off tracking.',
      icon: '/icons/p4pranking.svg',
      route: '/rankings',
      gradient: 'tech' as const,
    },
    {
      title: 'Hall of Fame',
      description: 'Legendary players honoured for their achievements. View records and champion tiers.',
      icon: '/icons/halloffame.svg',
      route: '/hall-of-fame',
      gradient: 'gold' as const,
    },
  ];

  return (
    <MainLayout>
      <GlobalNavigation />
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Hero Section */}
        <PageHeader
          title="EA TOURNAMENT MANAGER"
          subtitle="Manage your football leagues with precision"
          gradient="tech"
        />

        {/* Active Season Banner */}
        {activeSeason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card variant="gradient" glow>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-light-900 dark:text-white">
                        {activeSeason.name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-bold bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-light-600 dark:text-gray-400">
                      {activeSeason.gameVersion}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-cyber-500 dark:text-cyber-400" />
                      <span className="text-light-700 dark:text-gray-300 font-medium">
                        {activeSeason.stats?.totalLeagues ?? 0} Leagues
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-electric-500 dark:text-electric-400" />
                      <span className="text-light-700 dark:text-gray-300 font-medium">
                        {activeSeason.stats?.totalTournaments ?? 0} Tournaments
                      </span>
                    </div>
                  </div>

                  <motion.a
                    href={`/seasons/${activeSeason.slug}`}
                    whileHover={{ x: 3 }}
                    className="flex items-center gap-1 text-sm font-semibold text-cyber-600 dark:text-cyber-400 hover:text-cyber-500 dark:hover:text-cyber-300 transition-colors"
                  >
                    View Season
                    <ChevronRight className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Navigation Cards */}
        <div className="mb-8 mt-8 sm:mt-12 space-y-3 md:space-y-5">
          {/* Top 3: 2-col mobile → 3-col desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <NavigationCard {...navigationCards[0]} delay={0.5} />
            <NavigationCard {...navigationCards[1]} delay={0.6} />
            {/* Players: full-width on mobile, 1-col on desktop */}
            <div className="col-span-2 md:col-span-1">
              <NavigationCard {...navigationCards[2]} delay={0.7} />
            </div>
          </div>

          {/* Bottom 2: 2-col, centered at 2/3 width on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 md:w-2/3 md:mx-auto">
            <NavigationCard {...navigationCards[3]} delay={0.8} />
            <NavigationCard {...navigationCards[4]} delay={0.9} />
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center py-8 border-t border-black/10 dark:border-white/10"
        >
          <p className="text-light-600 dark:text-gray-400 font-medium">
            Created by Kempyre Group
          </p>
        </motion.footer>
      </Container>
    </MainLayout>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <TutorialProvider>
        <LandingPage />
        <AuthModal />
        <TutorialOverlay />
      </TutorialProvider>
    </AuthProvider>
  );
}
