"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownOption {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
  searchable?: boolean;
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  onOpenChange,
  searchable = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notify parent when dropdown opens/closes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter and sort options
  const filteredOptions = options
    .filter(opt => !searchable || !searchQuery || opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-light-200 dark:bg-dark-100/50 border-2 border-black/10 dark:border-white/10 rounded-tech text-light-900 dark:text-white text-xs sm:text-sm font-medium hover:border-cyber-500/50 focus:outline-none focus:border-cyber-500 transition-all backdrop-blur-sm"
      >
        <span className="text-light-700 dark:text-gray-200">{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-full mt-2 bg-gradient-to-br from-light-50 to-light-100 dark:from-dark-100 dark:to-dark-200 border-2 border-cyber-500/20 dark:border-cyber-500/30 rounded-tech shadow-card-light dark:shadow-glow overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-black/10 dark:border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 bg-light-200 dark:bg-dark-50/50 border border-black/10 dark:border-white/10 rounded-lg text-sm text-light-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyber-500/50"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all ${
                      option.value === value
                        ? 'bg-cyber-500/20 text-light-900 dark:text-white font-bold border-l-4 border-cyber-400'
                        : 'text-light-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-light-900 dark:hover:text-white border-l-4 border-transparent'
                    }`}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-cyber-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
