"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTutorial } from './TutorialContext';

export default function TutorialOverlay() {
  const { isActive, currentFlow, currentStep, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const step = currentFlow?.steps[currentStep];

  // Find and track the target element
  useEffect(() => {
    if (!step?.target || !isActive) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(step.target!) as HTMLElement;
      if (element) {
        setTargetElement(element);
        setTargetRect(element.getBoundingClientRect());
      }
    };

    findElement();

    const updateRect = () => {
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
      }
    };

    window.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [step, isActive, targetElement]);

  // Scroll target into view (account for bottom sheet height)
  useEffect(() => {
    if (targetElement && step?.target) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [targetElement, step]);

  if (!isActive || !currentFlow || !step) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === currentFlow.steps.length - 1;
  const progress = ((currentStep + 1) / currentFlow.steps.length) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: isActive ? 'auto' : 'none' }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm">
          {/* Spotlight cutout for target element */}
          {targetRect && (
            <motion.div
              key={`spotlight-${currentStep}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute rounded-xl border-2 border-cyber-400 tutorial-spotlight"
              style={{
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 217, 255, 0.4)',
                background: 'transparent',
              }}
            />
          )}
        </div>

        {/* Bottom Sheet */}
        <motion.div
          ref={sheetRef}
          key={`sheet-${currentStep}`}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:w-[calc(100%-2rem)] z-[10000]"
        >
          <div className="bg-gradient-to-br from-light-100 to-light-200 dark:from-dark-100 dark:to-dark-200 border-t-2 sm:border-2 border-cyber-500/40 rounded-t-2xl sm:rounded-2xl shadow-glow">
            {/* Progress Bar */}
            <div className="h-1 bg-light-300 dark:bg-dark-300 rounded-t-2xl overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyber-400 to-electric-500"
              />
            </div>

            {/* Content */}
            <div className="px-4 pt-3 pb-4 sm:px-5 sm:pt-4 sm:pb-5" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              {/* Header Row: Icon + Title + Step Counter + Close */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-cyber flex items-center justify-center shadow-glow shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-light-900 dark:text-white truncate">
                    {step.title}
                  </h3>
                </div>
                <span className="text-[10px] sm:text-xs text-light-500 dark:text-gray-500 font-medium shrink-0">
                  {currentStep + 1}/{currentFlow.steps.length}
                </span>
                <button
                  onClick={skipTutorial}
                  className="text-light-500 dark:text-gray-500 hover:text-light-900 dark:hover:text-white transition-colors shrink-0 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">
                {step.description}
              </p>

              {/* Navigation Row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={skipTutorial}
                  className="text-[11px] sm:text-xs text-light-500 dark:text-gray-500 hover:text-light-800 dark:hover:text-gray-300 transition-colors font-medium"
                >
                  Skip tour
                </button>

                <div className="flex items-center gap-1.5">
                  {!isFirstStep && (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-light-700 dark:text-gray-300 bg-light-200 dark:bg-white/5 hover:bg-light-300 dark:hover:bg-white/10 rounded-lg transition-colors border border-light-300 dark:border-white/10"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-gradient-to-r from-cyber-500 to-electric-600 hover:from-cyber-600 hover:to-electric-700 rounded-lg transition-all shadow-sm shadow-cyber-500/20"
                  >
                    {isLastStep ? "Let's go!" : 'Next'}
                    {!isLastStep && <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
