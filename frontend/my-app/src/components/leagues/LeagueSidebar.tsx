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
                  w-full flex items-center gap-3 px-4 py-3 rounded-tech-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border-2 border-cyber-500/50 text-cyber-300 shadow-glow'
                      : 'bg-dark-100/50 border-2 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-100/95 backdrop-blur-xl border-t border-white/10 z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-tech
                  transition-all duration-200 min-w-0 flex-1
                  ${
                    isActive
                      ? 'bg-cyber-500/20 text-cyber-400'
                      : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-semibold truncate w-full text-center">
                  {section.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="w-full h-0.5 bg-cyber-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile spacer to prevent content from being hidden behind bottom nav */}
      <div className="md:hidden h-20" />
    </>
  );
}
