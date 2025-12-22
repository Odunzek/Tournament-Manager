"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTutorial } from './TutorialContext';
import Button from '../ui/Button';

export default function TutorialOverlay() {
  const { isActive, currentFlow, currentStep, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

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

    // Initial find
    findElement();

    // Update on scroll/resize
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

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const position: React.CSSProperties = {};

    switch (step.position) {
      case 'bottom':
        position.top = `${targetRect.bottom + padding}px`;
        position.left = `${targetRect.left + targetRect.width / 2}px`;
        position.transform = 'translateX(-50%)';
        break;
      case 'top':
        position.bottom = `${window.innerHeight - targetRect.top + padding}px`;
        position.left = `${targetRect.left + targetRect.width / 2}px`;
        position.transform = 'translateX(-50%)';
        break;
      case 'left':
        position.top = `${targetRect.top + targetRect.height / 2}px`;
        position.right = `${window.innerWidth - targetRect.left + padding}px`;
        position.transform = 'translateY(-50%)';
        break;
      case 'right':
        position.top = `${targetRect.top + targetRect.height / 2}px`;
        position.left = `${targetRect.right + padding}px`;
        position.transform = 'translateY(-50%)';
        break;
    }

    return position;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: isActive ? 'auto' : 'none' }}
      >
        {/* Backdrop with spotlight effect */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm">
          {/* Spotlight cutout for target element */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                borderRadius: '12px',
                border: '3px solid #00d9ff',
                background: 'transparent',
                animation: 'pulse-border 2s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* Tutorial Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute max-w-md w-full mx-4"
          style={getTooltipPosition()}
        >
          <div className="bg-gradient-to-br from-dark-100 to-dark-200 border-2 border-cyber-500/50 rounded-2xl shadow-glow overflow-hidden">
            {/* Close Button */}
            <button
              onClick={skipTutorial}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress Bar */}
            <div className="h-1.5 bg-dark-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-cyber-400 to-electric-500"
              />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">
                    Step {currentStep + 1} of {currentFlow.steps.length}
                  </div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">{step.description}</p>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTutorial}
                  className="text-gray-400 hover:text-white"
                >
                  Skip Tour
                </Button>

                <div className="flex gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={!isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined}
                    onClick={nextStep}
                    glow
                  >
                    {isLastStep ? 'Get Started' : 'Next'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pulse animation for border */}
        <style jsx>{`
          @keyframes pulse-border {
            0%, 100% {
              border-color: #00d9ff;
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 217, 255, 0.5);
            }
            50% {
              border-color: #00ff88;
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 255, 136, 0.6);
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
