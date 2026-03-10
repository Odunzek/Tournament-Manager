"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, Users, Target, BarChart3, Home, Sun, Moon, Calendar, Settings, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Leagues', href: '/leagues', icon: Trophy },
  { label: 'Players', href: '/players', icon: Users },
  { label: 'Tournaments', href: '/tournaments', icon: Target },
  { label: 'Seasons', href: '/seasons', icon: Calendar },
  { label: 'Rankings', href: '/rankings', icon: BarChart3 },
];

export default function GlobalNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, adminUser, setShowAuthModal, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-light-50/90 dark:bg-dark-50/80 backdrop-blur-xl border-b border-cyber-500/20 dark:border-white/10 shadow-sm shadow-cyber-500/5 dark:shadow-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          {/* Navigation Tabs + Settings */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <motion.button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative px-3 sm:px-4 py-2 rounded-tech font-semibold text-sm
                    transition-all duration-200
                    ${active
                      ? 'bg-gradient-to-r from-cyber-600 to-electric-600 dark:from-cyber-500 dark:to-electric-600 text-white shadow-light-cyber-lg dark:shadow-glow'
                      : 'text-light-700 dark:text-gray-400 hover:text-light-900 dark:hover:text-white hover:bg-cyber-100 dark:hover:bg-white/5'
                    }
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-light-600 dark:text-gray-400'}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </div>
                </motion.button>
              );
            })}
            {/* Settings Dropdown */}
            <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative p-2 rounded-tech text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white hover:bg-cyber-100 dark:hover:bg-white/5 transition-all"
              aria-label="Settings"
            >
              {isAuthenticated && adminUser?.photoURL ? (
                <img
                  src={adminUser.photoURL}
                  alt={adminUser.displayName || 'Admin'}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <Settings className="w-5 h-5" />
              )}
              {isAuthenticated && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full" />
              )}
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-light-50/95 dark:bg-dark-100/95 backdrop-blur-xl border border-cyber-500/20 dark:border-white/15 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {/* Admin Info */}
                  {isAuthenticated && adminUser && (
                    <div className="px-4 py-3 border-b border-black/10 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        {adminUser.photoURL ? (
                          <img
                            src={adminUser.photoURL}
                            alt={adminUser.displayName || 'Admin'}
                            className="w-8 h-8 rounded-full border border-green-400/50"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <span className="text-green-400 text-xs font-bold">A</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-light-900 dark:text-white truncate">
                            {adminUser.displayName || 'Admin'}
                          </p>
                          {adminUser.email && (
                            <p className="text-[10px] text-light-500 dark:text-gray-500 truncate">
                              {adminUser.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-light-700 dark:text-gray-300 hover:bg-cyber-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-electric-400" />
                    )}
                    <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-black/10 dark:border-white/10" />

                  {/* Login / Logout */}
                  {isAuthenticated ? (
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowAuthModal(true); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-light-700 dark:text-gray-300 hover:bg-cyber-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Admin Login</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
