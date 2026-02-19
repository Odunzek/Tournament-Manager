"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTutorial } from './TutorialContext';
import Button from '../ui/Button';

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

  // Scroll target into view
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
        {/* Backdrop — only blur when no spotlight target (blur would obscure the highlighted element) */}
        <div className={`absolute inset-0 bg-black/1 ${!targetRect ? 'backdrop-blur-sm' : ''}`}>
          {/* Spotlight cutout for target element */}
          {targetRect && (
            <motion.div
              key={`spotlight-${currentStep}`}
              initial={{ opacity: 1, scale: 0.8 }}
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

        {/* Card wrapper: full-width bottom sheet on mobile, centered modal on md+ */}
        <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6 z-[10000]">
          <motion.div
            ref={sheetRef}
            key={`sheet-${currentStep}`}
            initial={{ y: 50, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="
              relative w-full md:max-w-md
              max-h-[52vh] md:max-h-[85vh] overflow-y-auto
              rounded-t-2xl md:rounded-2xl
              bg-gradient-to-br from-cyber-50 to-electric-50
              dark:from-dark-100/80 dark:to-dark-200/80
              backdrop-blur-xl
              border-t-2 border-x-2 md:border-2
              border-cyber-500/25 dark:border-white/10
              shadow-light-cyber-lg dark:shadow-glow
            "
          >
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
            <div
              className="px-4 sm:px-5 pt-3 sm:pt-4 pb-4 sm:pb-5"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {/* Header: icon + title + close */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="flex-1 min-w-0 text-xs sm:text-sm font-bold text-light-900 dark:text-white truncate">
                  {step.title}
                </h3>
                <button
                  onClick={skipTutorial}
                  className="p-1 rounded-lg text-light-500 dark:text-gray-500 hover:text-light-900 dark:hover:text-white hover:bg-light-200 dark:hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400 leading-relaxed mb-2 sm:mb-3">
                {step.description}
              </p>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 mb-3 sm:mb-4">
                {currentFlow.steps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-5 h-2 bg-cyber-500'
                        : i < currentStep
                        ? 'w-2 h-2 bg-cyber-400/50'
                        : 'w-2 h-2 bg-light-300 dark:bg-dark-300'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={skipTutorial}
                  className="text-xs text-light-500 dark:text-gray-500 hover:text-light-800 dark:hover:text-gray-300 transition-colors font-medium"
                >
                  Skip tour
                </button>

                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={nextStep}
                    rightIcon={!isLastStep ? <ChevronRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isLastStep ? "Let's go!" : 'Next'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
