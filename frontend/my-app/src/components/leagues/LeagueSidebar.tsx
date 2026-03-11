"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Trophy,
  ListChecks,
  Flame,
  Edit3,
} from 'lucide-react';

interface LeagueSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isAuthenticated: boolean;
}

export default function LeagueSidebar({
  activeSection,
  onSectionChange,
  isAuthenticated,
}: LeagueSidebarProps) {
  const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'results', label: 'Results', icon: ListChecks },
    { id: 'streaks', label: 'Streaks & Stats', icon: Flame },
  ];

  // Add Record Match section for authenticated users only
  if (isAuthenticated) {
    sections.push({ id: 'record', label: 'Record Match', icon: Edit3 });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-2 border-cyber-600/50 dark:border-cyber-500/50 text-cyber-700 dark:text-cyber-300 shadow-light-cyber dark:shadow-glow'
                      : 'bg-light-100 dark:bg-dark-100/50 border-2 border-light-300 dark:border-white/5 text-light-700 dark:text-gray-400 hover:border-cyber-500/30 dark:hover:border-white/10 hover:text-light-900 dark:hover:text-white hover:bg-cyber-50 dark:hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{section.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-2 h-2 rounded-full bg-cyber-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-light-50/95 dark:bg-dark-100/95 backdrop-blur-xl border-t border-cyber-500/20 dark:border-white/10 z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-1 py-2.5 overflow-x-auto scrollbar-hide">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`
                  flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl
                  transition-all duration-200 min-w-[60px] flex-shrink-0
                  ${
                    isActive
                      ? 'bg-cyber-500/20 text-cyber-700 dark:text-cyber-400 border border-cyber-600/30 dark:border-transparent'
                      : 'text-light-700 dark:text-gray-400 active:bg-cyber-100 dark:active:bg-white/5'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[11px] font-semibold leading-tight text-center max-w-[60px]">
                  {section.label.split(' ').length > 1
                    ? section.label.split(' ').map(word => word.slice(0,4)).join(' ')
                    : section.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile spacer removed — pb-24 on the Container handles bottom nav offset */}
    </>
  );
}
