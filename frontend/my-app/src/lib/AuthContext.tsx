// lib/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';

interface AdminUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get authorized admin emails from environment variable
const getAuthorizedEmails = (): string[] => {
  const emails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return emails.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
};

const isAuthorizedAdmin = (email: string | null): boolean => {
  if (!email) return false;
  const authorizedEmails = getAuthorizedEmails();
  return authorizedEmails.includes(email.toLowerCase());
};

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Authentication Modal Component
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
          setError('Access denied. Your Google account is not authorized for admin access.');
        } else if (err.message.includes('popup-closed-by-user')) {
          // User closed the popup, don't show an error
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
      <div className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-tech shadow-glow border border-cyber-500/30 max-w-md w-full mx-4 transform transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-cyber rounded-tech shadow-glow">
            <span className="text-3xl">🔐</span>
          </div>
          <h3 className="text-2xl font-bold text-white text-center mb-3">
            Admin Authentication
          </h3>
          <p className="text-gray-400 text-center mb-8">
            Sign in with your authorized Google account to access admin features
          </p>

          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-tech px-4 py-3">
                <span className="text-sm">⚠️</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 px-6 py-4 rounded-tech font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full bg-dark-50 hover:bg-dark-100 text-gray-300 px-6 py-4 rounded-tech font-bold transition-all duration-300 border border-white/10 hover:border-white/20 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 p-4 bg-cyber-500/10 rounded-tech border border-cyber-500/20">
            <div className="flex items-start space-x-3">
              <span className="text-cyber-400 text-lg mt-0.5">ℹ️</span>
              <div className="text-sm text-gray-400">
                <p>Only authorized Google accounts can access admin features. Contact the administrator if you need access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
