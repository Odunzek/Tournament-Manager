"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/layouts/MainLayout';
import PageHeader from '../components/layouts/PageHeader';
import Container from '../components/layouts/Container';
import GlobalNavigation from '../components/layouts/GlobalNavigation';
import NavigationCard from '../components/landing/NavigationCard';
import { AuthProvider, AuthModal } from '../lib/AuthContext';
import { TutorialProvider, useTutorial } from '../components/tutorial/TutorialContext';
import TutorialOverlay from '../components/tutorial/TutorialOverlay';
import { useActiveSeason } from '../hooks/useActiveSeason';

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
      <Container maxWidth="2xl" className="py-4 sm:py-8">
        {/* Hero Section */}
        <PageHeader
          title="EA TOURNAMENT MANAGER"
          subtitle="Manage your football leagues with precision"
          gradient="tech"
        />

        {/* Active Season Pill */}
        {activeSeason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center gap-2.5 px-3.5 py-2 rounded-xl
                       bg-green-500/10 border border-green-500/20 w-fit"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-sm font-semibold text-light-900 dark:text-white">
              {activeSeason.name}
            </span>
            {activeSeason.gameVersion && (
              <>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-xs text-light-500 dark:text-gray-400">
                  {activeSeason.gameVersion}
                </span>
              </>
            )}
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-green-500/20
                             text-green-700 dark:text-green-400 border border-green-500/30 rounded-full">
              Active
            </span>
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
