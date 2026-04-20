"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Info,
  Users,
  Calendar,
  Trophy,
  Target,
  BarChart3,
  Layers,
  BarChart2,
  Swords,
  TrendingUp,
} from 'lucide-react';
import { TournamentSidebarProps, TournamentSection } from '@/types/tournament';

interface NavItem {
  id: TournamentSection;
  label: string;
  icon: React.ReactNode;
}

const defaultNavItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <Info className="w-5 h-5" /> },
  { id: 'groups', label: 'Groups', icon: <Users className="w-5 h-5" /> },
  { id: 'fixtures', label: 'Fixtures', icon: <Calendar className="w-5 h-5" /> },
  { id: 'teams', label: 'Teams', icon: <Trophy className="w-5 h-5" /> },
  { id: 'knockout', label: 'Knockout', icon: <Target className="w-5 h-5" /> },
  { id: 'results', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
];

const uclNavItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <Info className="w-5 h-5" /> },
  { id: 'ucl_pots', label: 'Pots', icon: <Layers className="w-5 h-5" /> },
  { id: 'ucl_league', label: 'League', icon: <BarChart2 className="w-5 h-5" /> },
  { id: 'fixtures', label: 'Fixtures', icon: <Calendar className="w-5 h-5" /> },
  { id: 'ucl_playoff', label: 'Playoff', icon: <Swords className="w-5 h-5" /> },
  { id: 'knockout', label: 'Knockout', icon: <Target className="w-5 h-5" /> },
  { id: 'ucl_stats', label: 'Stats', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function TournamentSidebar({
  activeSection,
  onSectionChange,
  tournamentType,
}: TournamentSidebarProps) {
  const navItems = tournamentType === 'ucl' ? uclNavItems : defaultNavItems;
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-light-100/50 dark:bg-dark-100/50 backdrop-blur-md border-r border-black/10 dark:border-white/10 min-h-screen sticky top-0">
        <nav className="p-6 space-y-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-2 border-cyber-600/50 dark:border-cyber-500/50 shadow-light-cyber dark:shadow-glow'
                    : 'hover:bg-cyber-50 dark:hover:bg-white/5 border-2 border-light-300 dark:border-transparent hover:border-cyber-500/30 dark:hover:border-white/10'
                  }
                `}
              >
                <div className={isActive ? 'text-cyber-700 dark:text-cyber-400' : 'text-light-700 dark:text-gray-400'}>
                  {item.icon}
                </div>
                <span className={`font-semibold ${isActive ? 'text-light-900 dark:text-white' : 'text-light-700 dark:text-gray-300'}`}>
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="ml-auto w-2 h-2 rounded-full bg-cyber-400 shadow-glow"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-light-50/95 dark:bg-dark-100/95 backdrop-blur-xl border-t border-cyber-500/20 dark:border-white/10 safe-area-inset-bottom">
        <nav className="flex items-center justify-around px-1 py-2.5 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl min-w-[58px] flex-shrink-0 relative
                  transition-all duration-200
                  ${isActive ? 'bg-cyber-500/20 border border-cyber-600/30 dark:border-transparent' : 'active:bg-cyber-100 dark:active:bg-white/5'}
                `}
              >
                <div className={`
                  transition-all duration-200
                  ${isActive ? 'text-cyber-700 dark:text-cyber-400 scale-110' : 'text-light-700 dark:text-gray-400'}
                `}>
                  {item.icon}
                </div>
                <span className={`
                  text-[11px] font-semibold transition-colors leading-tight
                  ${isActive ? 'text-light-900 dark:text-white' : 'text-light-600 dark:text-gray-500'}
                `}>
                  {item.label}
                </span>

              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
