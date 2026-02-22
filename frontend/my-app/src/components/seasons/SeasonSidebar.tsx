"use client";

import React from 'react';
import { LayoutDashboard, Trophy, Target, Medal, Crown } from 'lucide-react';

interface SeasonSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leagues', label: 'Leagues', icon: Trophy },
  { id: 'tournaments', label: 'Tournaments', icon: Target },
  { id: 'rankings', label: 'Rankings', icon: Medal },
  { id: 'hof', label: 'Hall of Fame', icon: Crown },
];

export default function SeasonSidebar({ activeSection, onSectionChange }: SeasonSidebarProps) {
  return (
    <div className="flex border-b border-black/8 dark:border-white/8 mb-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSectionChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-semibold
                        whitespace-nowrap -mb-px border-b-2 transition-colors shrink-0
                        ${
                          isActive
                            ? 'border-cyber-500 text-cyber-700 dark:text-cyber-400'
                            : 'border-transparent text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white'
                        }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
