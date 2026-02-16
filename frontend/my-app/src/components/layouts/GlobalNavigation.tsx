/**
 * GlobalNavigation Component
 *
 * Sticky navigation bar that appears on all main pages of the application.
 * Features tab-style navigation with active state highlighting and admin authentication.
 *
 * @component
 * @features
 * - Sticky positioning at top of viewport
 * - Tab-style navigation matching tech-inspired theme
 * - Active page highlighting with smooth animations
 * - Admin login/logout functionality
 * - Responsive design (icons only on mobile, full labels on desktop)
 * - Glass morphism effect with backdrop blur
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, Users, Target, BarChart3, Home, Sun, Moon } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

// Navigation menu items configuration
const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Leagues', href: '/leagues', icon: Trophy },
  { label: 'Players', href: '/players', icon: Users },
  { label: 'Tournaments', href: '/tournaments', icon: Target },
  { label: 'Rankings', href: '/rankings', icon: BarChart3 },
];

export default function GlobalNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, adminUser, setShowAuthModal, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Check if a navigation item is currently active
   * @param href - The route path to check
   * @returns true if the current route matches the href
   */
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-light-50/90 dark:bg-dark-50/80 backdrop-blur-xl border-b border-cyber-500/20 dark:border-white/10 shadow-sm shadow-cyber-500/5 dark:shadow-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title - Left */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-cyber flex items-center justify-center shadow-light-cyber dark:shadow-glow">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-cyber-400 to-electric-400 bg-clip-text text-transparent">
              EA MANAGER
            </span>
          </motion.div>

          {/* Navigation Tabs - Center */}
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
          </div>

          {/* Theme Toggle + Auth Button - Right */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-tech text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white hover:bg-cyber-100 dark:hover:bg-white/5 transition-all"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>
            {isAuthenticated && adminUser && (
              <div className="admin-badge flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                {adminUser.photoURL ? (
                  <img
                    src={adminUser.photoURL}
                    alt={adminUser.displayName || 'Admin'}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-green-400/50"
                  />
                ) : (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
                <span className="hidden sm:inline text-green-400 font-semibold text-xs max-w-[100px] truncate">
                  {adminUser.displayName || adminUser.email?.split('@')[0] || 'Admin'}
                </span>
              </div>
            )}
            {isAuthenticated ? (
              <Button
                variant="danger"
                size="sm"
                onClick={logout}
                className="shrink-0"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="shrink-0"
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
