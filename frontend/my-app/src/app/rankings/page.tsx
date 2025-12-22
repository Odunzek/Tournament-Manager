"use client";

import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Container from '@/components/layouts/Container';
import GlobalNavigation from '@/components/layouts/GlobalNavigation';
import PageHeader from '@/components/layouts/PageHeader';
import RankingsManager from '../components/RankingsManager';
import { AuthProvider, AuthModal } from '@/lib/AuthContext';

function RankingsPageContent() {
  return (
    <MainLayout showBackground={false}>
      <GlobalNavigation />
      <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200">
        <Container maxWidth="4xl" className="py-8 sm:py-12">
          <PageHeader
            title="P4P Rankings"
            description="Pound-for-Pound player rankings with challenge tracking"
            icon="🏆"
          />

          <div className="mt-8">
            <RankingsManager />
          </div>
        </Container>
      </div>
    </MainLayout>
  );
}

export default function RankingsPage() {
  return (
    <AuthProvider>
      <RankingsPageContent />
      <AuthModal />
    </AuthProvider>
  );
}
