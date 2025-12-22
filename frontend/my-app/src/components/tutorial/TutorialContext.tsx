"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'scroll' | 'none';
}

export interface TutorialFlow {
  id: 'viewer' | 'admin';
  name: string;
  steps: TutorialStep[];
}

interface TutorialContextType {
  isActive: boolean;
  currentFlow: TutorialFlow | null;
  currentStep: number;
  startTutorial: (flowId: 'viewer' | 'admin') => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Tutorial Flows
const TUTORIAL_FLOWS: Record<'viewer' | 'admin', TutorialFlow> = {
  viewer: {
    id: 'viewer',
    name: 'Welcome Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to EA Tournament Manager! 🎮',
        description: 'Let\'s take a quick tour to help you get started. This will only take a minute!',
        position: 'center',
        action: 'none',
      },
      {
        id: 'navigation',
        title: 'Main Navigation',
        description: 'Use these tabs to navigate between Leagues, Players, Tournaments, Rankings, and Hall of Fame.',
        target: 'nav',
        position: 'bottom',
        action: 'none',
      },
      {
        id: 'leagues',
        title: 'Leagues',
        description: 'View and track league competitions. See standings, results, and player statistics.',
        target: '[href="/leagues"]',
        position: 'bottom',
        action: 'none',
      },
      {
        id: 'tournaments',
        title: 'Tournaments',
        description: 'Champions League-style tournaments with group stages and knockout rounds.',
        target: '[href="/tournaments"]',
        position: 'bottom',
        action: 'none',
      },
      {
        id: 'rankings',
        title: 'P4P Rankings',
        description: 'Check out the Pound-for-Pound player rankings based on challenge performance.',
        target: '[href="/rankings"]',
        position: 'bottom',
        action: 'none',
      },
      {
        id: 'hall-of-fame',
        title: 'Hall of Fame',
        description: 'See legendary players who have earned 3 or more titles!',
        target: '[href="/hall-of-fame"]',
        position: 'bottom',
        action: 'none',
      },
      {
        id: 'complete',
        title: 'You\'re All Set! 🎉',
        description: 'Explore the app and enjoy tracking your football tournaments. Click anywhere to get started!',
        position: 'center',
        action: 'none',
      },
    ],
  },
  admin: {
    id: 'admin',
    name: 'Admin Features Tour',
    steps: [
      {
        id: 'welcome-admin',
        title: 'Welcome, Admin! 👑',
        description: 'You now have access to powerful management features. Let\'s explore what you can do!',
        position: 'center',
        action: 'none',
      },
      {
        id: 'admin-badge',
        title: 'Admin Status',
        description: 'This badge shows you\'re logged in as admin. You\'ll see it on pages with admin features.',
        target: '.admin-badge',
        position: 'bottom',
        action: 'none',
      },
      {
        id: 'record-match',
        title: 'Record Matches',
        description: 'As admin, you can record match results in leagues and tournaments.',
        position: 'center',
        action: 'none',
      },
      {
        id: 'manage-rankings',
        title: 'Manage P4P Rankings',
        description: 'In Rankings, you can drag & drop to reorder players, edit cool-off periods, and manage wildcards.',
        position: 'center',
        action: 'none',
      },
      {
        id: 'tournament-control',
        title: 'Tournament Management',
        description: 'Generate groups, progress to knockout stages, and record match results.',
        position: 'center',
        action: 'none',
      },
      {
        id: 'complete-admin',
        title: 'Admin Powers Unlocked! 🚀',
        description: 'You\'re ready to manage tournaments like a pro. Have fun!',
        position: 'center',
        action: 'none',
      },
    ],
  },
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<TutorialFlow | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const startTutorial = (flowId: 'viewer' | 'admin') => {
    // Check if user has already seen this tutorial
    const hasSeenKey = `tutorial_completed_${flowId}`;
    const hasSeen = localStorage.getItem(hasSeenKey);

    if (hasSeen === 'true') {
      return; // Don't show if already completed
    }

    setCurrentFlow(TUTORIAL_FLOWS[flowId]);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (!currentFlow) return;

    if (currentStep < currentFlow.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTutorial = () => {
    if (currentFlow) {
      localStorage.setItem(`tutorial_completed_${currentFlow.id}`, 'true');
    }
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStep(0);
  };

  const completeTutorial = () => {
    if (currentFlow) {
      localStorage.setItem(`tutorial_completed_${currentFlow.id}`, 'true');
    }
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStep(0);
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentFlow,
        currentStep,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        completeTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
