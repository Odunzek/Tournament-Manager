"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../../components/layouts/MainLayout';
import Container from '../../../components/layouts/Container';
import TournamentSidebar from '../../../components/tournaments/TournamentSidebar';
import Button from '../../../components/ui/Button';
import { TournamentSection } from '@/types/tournament';

// Section components
import Overview from '../../../components/tournaments/sections/Overview';
import Groups from '../../../components/tournaments/sections/Groups';
import Fixtures from '../../../components/tournaments/sections/Fixtures';
import Teams from '../../../components/tournaments/sections/Teams';
import Knockout from '../../../components/tournaments/sections/Knockout';
import Results from '../../../components/tournaments/sections/Results';

const sectionComponents: Record<TournamentSection, React.ComponentType<{ tournamentId: string }>> = {
  overview: Overview,
  groups: Groups,
  fixtures: Fixtures,
  teams: Teams,
  knockout: Knockout,
  results: Results,
};

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const [activeSection, setActiveSection] = useState<TournamentSection>('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    router.push('/tournaments');
  };

  if (!mounted) return null;

  const ActiveSectionComponent = sectionComponents[activeSection];

  return (
    <MainLayout showBackground={false}>
      <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200">
        {/* Mobile Header */}
        <div className="md:hidden bg-dark-100/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 px-4 py-3">
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
                <ActiveSectionComponent tournamentId={tournamentId} />
              </motion.div>
            </Container>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
