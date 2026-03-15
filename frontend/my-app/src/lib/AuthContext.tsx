/**
 * Authentication Context & Provider
 *
 * Manages admin authentication for the FIFA League Manager app.
 * Uses a whitelist-based approach — only specific Google email addresses
 * (set in NEXT_PUBLIC_ADMIN_EMAILS env var) are granted admin access.
 *
 * Auth flow:
 * 1. All users start as anonymous (auto-signed-in by firebase.ts)
 * 2. Admins click "Login" → Google OAuth popup → email checked against whitelist
 * 3. If authorized → isAuthenticated=true → admin UI elements (edit/delete buttons) appear
 * 4. If NOT authorized → immediately signed out → ACCESS_DENIED error shown
 *
 * Components using `isAuthenticated` to conditionally show admin features:
 * - Tournament pages (edit matches, manage teams, adjust points)
 * - League pages (record matches, add players, edit settings)
 * - Player management (add/edit/delete players)
 * - Season management (create/edit seasons)
 *
 * @see firebase.ts — Firebase initialization and anonymous auth
 * @see GlobalNavigation.tsx — Login button that triggers setShowAuthModal(true)
 */
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';

/** Shape of the authenticated admin user's profile info */
interface AdminUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** All values exposed by the AuthContext to consuming components */
interface AuthContextType {
  isAuthenticated: boolean;           // true if current user is an authorized admin
  isLoading: boolean;                 // true while checking initial auth state
  adminUser: AdminUser | null;        // Profile info of the logged-in admin (null if not admin)
  login: () => Promise<void>;         // Triggers Google OAuth popup
  logout: () => Promise<void>;        // Signs out (falls back to anonymous)
  showAuthModal: boolean;             // Controls visibility of the AuthModal
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Parse the comma-separated admin email whitelist from environment variable.
 * Example: NEXT_PUBLIC_ADMIN_EMAILS="admin@gmail.com, manager@gmail.com"
 */
const getAuthorizedEmails = (): string[] => {
  const emails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return emails.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
};

/**
 * Check if an email address is in the authorized admin whitelist.
 * Used both during login (to reject unauthorized users) and on auth state change.
 */
const isAuthorizedAdmin = (email: string | null): boolean => {
  if (!email) return false;
  const authorizedEmails = getAuthorizedEmails();
  return authorizedEmails.includes(email.toLowerCase());
};

/**
 * AuthProvider — wraps the entire app (in layout.tsx) to provide auth state.
 * Listens for Firebase auth state changes and determines if the current
 * user is an authorized admin based on the email whitelist.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user && !user.isAnonymous && isAuthorizedAdmin(user.email)) {
        // User is signed in with Google and is an authorized admin
        setIsAuthenticated(true);
        setAdminUser({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        // User is not signed in or not authorized
        setIsAuthenticated(false);
        setAdminUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (): Promise<void> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!isAuthorizedAdmin(user.email)) {
        // User is not an authorized admin, sign them out
        await signOut(auth);
        throw new Error('ACCESS_DENIED');
      }

      // Trigger admin tutorial on first login
      const wasFirstLogin = !localStorage.getItem('admin_logged_in_before');
      if (wasFirstLogin) {
        localStorage.setItem('admin_logged_in_before', 'true');
        window.dispatchEvent(new CustomEvent('admin-logged-in'));
      }

      setShowAuthModal(false);
    } catch (error) {
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // After sign out, the onAuthStateChanged listener will update the state
      // and trigger anonymous sign-in via firebase.ts
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      adminUser,
      login,
      logout,
      showAuthModal,
      setShowAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * Must be used within an AuthProvider (which wraps the entire app).
 *
 * @example
 * const { isAuthenticated, login, logout } = useAuth();
 * if (isAuthenticated) { // show admin controls }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * AuthModal — the Google sign-in popup UI.
 * Rendered in MainLayout, shown when `showAuthModal` is true.
 * Uses the shared Modal component for consistent styling.
 * Handles the Google OAuth flow and displays error messages
 * (e.g., "Access denied" for unauthorized emails, popup closed, etc.)
 */
export function AuthModal() {
  const { login, showAuthModal, setShowAuthModal } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      await login();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'ACCESS_DENIED') {
          setError('Access denied. Your account is not authorized for admin access.');
        } else if (err.message.includes('popup-closed-by-user')) {
          setError('');
        } else {
          setError('Sign-in failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setError('');
  };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-light-50 to-light-100 dark:from-dark-100 dark:to-dark-200 rounded-tech shadow-card-light dark:shadow-glow border border-cyber-500/20 dark:border-cyber-500/30 max-w-sm w-full transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-black/10 dark:border-white/10">
          <h2 className="text-base sm:text-lg font-bold text-light-900 dark:text-white">Admin Login</h2>
          <button
            onClick={handleClose}
            className="text-light-500 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-xs sm:text-sm text-light-600 dark:text-gray-400 mb-4">
            Sign in with your authorized Google account to access admin features.
          </p>

          {error && (
            <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-tech px-3 py-2 mb-4">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium">{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 sm:py-3 rounded-tech font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-5 border-t border-black/10 dark:border-white/10 bg-light-200/50 dark:bg-dark-200/50">
          <p className="text-[11px] sm:text-xs text-light-500 dark:text-gray-500 text-center">
            Only authorized accounts can access admin features.
          </p>
        </div>
      </div>
    </div>
  );
}
