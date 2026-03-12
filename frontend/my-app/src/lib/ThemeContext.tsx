/**
 * Theme Context — Light/Dark Mode Management
 *
 * Manages the app's color scheme with three options: 'light', 'dark', or 'system'.
 * Persists the user's choice in localStorage and applies it by toggling the
 * `.dark` class on the <html> element.
 *
 * How dark mode works in this app (Tailwind v4):
 * 1. This context adds/removes `.dark` on <html>
 * 2. globals.css defines `@custom-variant dark (&:where(.dark, .dark *));`
 * 3. Components use `dark:` prefix for dark mode styles (e.g., `text-white dark:text-gray-400`)
 * 4. CSS variables in `:root` and `.dark` blocks provide surface/background colors
 *
 * @see globals.css — CSS variable definitions for both themes
 * @see GlobalNavigation.tsx — Theme toggle button in the nav bar
 */
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

/** User's theme preference — 'system' follows the OS setting */
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;                       // The user's selected preference
  setTheme: (theme: Theme) => void;   // Update preference (persists to localStorage)
  resolvedTheme: 'light' | 'dark';   // The actual applied theme (resolves 'system' to light/dark)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Detect the user's OS-level color scheme preference */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'; // SSR fallback
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the resolved theme by toggling the `.dark` class on <html>.
 * This is what makes all `dark:` Tailwind classes activate/deactivate.
 */
function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * ThemeProvider — wraps the app (in layout.tsx) to provide theme state.
 * On mount, reads the stored preference from localStorage.
 * When theme is 'system', listens for OS preference changes in real-time.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const initial = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
    setThemeState(initial);

    const resolved = initial === 'system' ? getSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  // Listen for OS preference changes when theme is 'system'
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme state from any component.
 * @example
 * const { theme, setTheme, resolvedTheme } = useTheme();
 * // resolvedTheme is always 'light' or 'dark' (never 'system')
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
