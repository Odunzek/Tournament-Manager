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

function LandingPage() {
  const { startTutorial } = useTutorial();

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
      title: 'Players',
      description: 'Manage player profiles, track statistics, and organize your team roster.',
      icon: '/icons/Players.svg',
      route: '/players',
      gradient: 'electric' as const,
    },
    {
      title: 'Tournaments',
      description: 'Champions League-style tournaments with group stages and knockout rounds.',
      icon: '/icons/tournaments.svg',
      route: '/tournaments',
      gradient: 'neon' as const,
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
      description: 'Legendary players with 3+ titles. View achievements, records, and champion tiers.',
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

        {/* Navigation Cards */}
        <div className="mb-12 mt-12">
          {/* First 4 cards in 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {navigationCards.slice(0, 4).map((card, index) => (
              <NavigationCard
                key={card.route}
                {...card}
                delay={0.1 * index + 0.5}
              />
            ))}
          </div>

          {/* Hall of Fame card centered */}
          <div className="max-w-2xl mx-auto">
            <NavigationCard
              key={navigationCards[4].route}
              {...navigationCards[4]}
              delay={0.9}
            />
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center py-8 border-t border-white/10"
        >
          <p className="text-gray-400 font-medium">
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
