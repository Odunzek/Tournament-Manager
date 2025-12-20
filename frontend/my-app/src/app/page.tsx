"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Target, BarChart3 } from 'lucide-react';
import MainLayout from '../components/layouts/MainLayout';
import PageHeader from '../components/layouts/PageHeader';
import Container from '../components/layouts/Container';
import NavigationCard from '../components/landing/NavigationCard';
import StatsSection from '../components/landing/StatsSection';
import Button from '../components/ui/Button';
import { AuthProvider, AuthModal, useAuth } from '../lib/AuthContext';

function LandingPage() {
  const { isAuthenticated, setShowAuthModal, logout } = useAuth();

  // Placeholder stats - will be connected to Firebase later
  const stats = [
    {
      label: 'Total Leagues',
      value: '12',
      icon: <Trophy className="w-6 h-6 text-cyber-400" />,
      color: 'cyber' as const,
      trend: '+2 this month',
    },
    {
      label: 'Active Tournaments',
      value: '5',
      icon: <Target className="w-6 h-6 text-electric-400" />,
      color: 'electric' as const,
    },
    {
      label: 'Registered Players',
      value: '48',
      icon: <Users className="w-6 h-6 text-green-400" />,
      color: 'green' as const,
      trend: '+8 this week',
    },
    {
      label: 'Matches Played',
      value: '267',
      icon: <BarChart3 className="w-6 h-6 text-pink-400" />,
      color: 'neon' as const,
    },
  ];

  const navigationCards = [
    {
      title: 'Leagues',
      description: 'Create and manage your football leagues with real-time standings and match tracking.',
      icon: '/icons/league.svg',
      route: '/leagues',
      stats: '12 Active',
      gradient: 'cyber' as const,
    },
    {
      title: 'Players',
      description: 'Manage player profiles, track statistics, and organize your team roster.',
      icon: '/icons/Players.svg',
      route: '/players',
      stats: '48 Registered',
      gradient: 'electric' as const,
    },
    {
      title: 'Tournaments',
      description: 'Champions League-style tournaments with group stages and knockout rounds.',
      icon: '/icons/tournaments.svg',
      route: '/tournaments',
      stats: '5 Running',
      gradient: 'neon' as const,
    },
    {
      title: 'P4P Rankings',
      description: 'Player-for-Player rankings with drag-and-drop management and cool-off tracking.',
      icon: '/icons/p4pranking.svg',
      route: '/rankings',
      gradient: 'tech' as const,
    },
  ];

  return (
    <MainLayout>
      {/* Admin Auth Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        {isAuthenticated ? (
          <Button
            variant="danger"
            size="sm"
            onClick={logout}
          >
            Logout Admin
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuthModal(true)}
          >
            Login as Admin
          </Button>
        )}
      </div>

      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Hero Section */}
        <PageHeader
          title="EA TOURNAMENT MANAGER"
          subtitle="Manage your football leagues with precision"
          gradient="tech"
        />

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatsSection stats={stats} />
        </motion.div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {navigationCards.map((card, index) => (
            <NavigationCard
              key={card.route}
              {...card}
              delay={0.1 * index + 0.5}
            />
          ))}
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
      <LandingPage />
      <AuthModal />
    </AuthProvider>
  );
}
