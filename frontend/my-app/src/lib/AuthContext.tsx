// lib/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin password - in production, this should be in environment variables
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const authTime = localStorage.getItem('authTime');

    if (authStatus === 'true' && authTime) {
      const timeElapsed = Date.now() - parseInt(authTime);
      // Authentication expires after 1 hour
      if (timeElapsed < 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTime');
      }
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      const wasFirstLogin = !localStorage.getItem('admin_logged_in_before');

      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authTime', Date.now().toString());
      setShowAuthModal(false);

      // Trigger admin tutorial on first login
      if (wasFirstLogin) {
        localStorage.setItem('admin_logged_in_before', 'true');
        // Dispatch custom event for admin tutorial
        window.dispatchEvent(new CustomEvent('admin-logged-in'));
      }

      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTime');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (login(password)) {
      setPassword('');
    } else {
      setError('Invalid password. Please try again.');
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setPassword('');
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
            Enter admin password to access management features
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`w-full px-4 py-4 rounded-tech bg-dark-50 text-white focus:outline-none transition-all duration-300 border-2 ${
                  error
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-cyber-500'
                }`}
                placeholder="Enter admin password"
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-tech px-3 py-2">
                  <span className="text-sm">⚠️</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 bg-dark-50 hover:bg-dark-100 text-gray-300 px-6 py-4 rounded-tech font-bold transition-all duration-300 border border-white/10 hover:border-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="flex-1 bg-gradient-cyber hover:shadow-glow text-white px-6 py-4 rounded-tech font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Authenticate'
                )}
              </button>
            </div>
          </form>

          {/* <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-600 text-lg mt-0.5">💡</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Default Password:</p>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">admin123</p>
                <p className="text-xs mt-1 text-yellow-700">Change this in production by setting NEXT_PUBLIC_ADMIN_PASSWORD environment variable</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}