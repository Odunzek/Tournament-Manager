"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Info,
  Users,
  Calendar,
  Trophy,
  Target,
  BarChart3
} from 'lucide-react';
import { TournamentSidebarProps, TournamentSection } from '@/types/tournament';

interface NavItem {
  id: TournamentSection;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <Info className="w-5 h-5" /> },
  { id: 'groups', label: 'Groups', icon: <Users className="w-5 h-5" /> },
  { id: 'fixtures', label: 'Fixtures', icon: <Calendar className="w-5 h-5" /> },
  { id: 'teams', label: 'Teams', icon: <Trophy className="w-5 h-5" /> },
  { id: 'knockout', label: 'Knockout', icon: <Target className="w-5 h-5" /> },
  { id: 'results', label: 'Results', icon: <BarChart3 className="w-5 h-5" /> },
];

export default function TournamentSidebar({
  activeSection,
  onSectionChange,
}: TournamentSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-dark-100/50 backdrop-blur-md border-r border-white/10 min-h-screen sticky top-0">
        <nav className="p-6 space-y-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-tech
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-2 border-cyber-500/50 shadow-glow'
                    : 'hover:bg-white/5 border-2 border-transparent'
                  }
                `}
              >
                <div className={isActive ? 'text-cyber-400' : 'text-gray-400'}>
                  {item.icon}
                </div>
                <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-100/95 backdrop-blur-xl border-t border-white/10 pb-safe">
        <nav className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className="flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] relative"
              >
                <div className={`
                  transition-all duration-200
                  ${isActive ? 'text-cyber-400 scale-110' : 'text-gray-400'}
                `}>
                  {item.icon}
                </div>
                <span className={`
                  text-xs font-medium transition-colors
                  ${isActive ? 'text-white' : 'text-gray-500'}
                `}>
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyber-400 shadow-glow"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
