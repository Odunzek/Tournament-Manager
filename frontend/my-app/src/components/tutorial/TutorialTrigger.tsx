"use client";

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTutorial } from './TutorialContext';

interface TutorialTriggerProps {
  type: 'viewer' | 'admin';
  className?: string;
}

export default function TutorialTrigger({ type, className = '' }: TutorialTriggerProps) {
  const { startTutorial } = useTutorial();

  const handleClick = () => {
    // Clear the completion flag to allow tutorial to run again
    localStorage.removeItem(`tutorial_completed_${type}`);
    startTutorial(type);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-sm text-gray-400 hover:text-cyber-400 transition-colors ${className}`}
      title={`Restart ${type === 'viewer' ? 'Navigation' : 'Admin'} Tutorial`}
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">Tutorial</span>
    </button>
  );
}
