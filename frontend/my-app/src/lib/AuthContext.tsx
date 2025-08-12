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
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authTime', Date.now().toString());
      setShowAuthModal(false);
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
      setShowAuthModal
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full">
            <span className="text-3xl">🔐</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Authentication Required
          </h3>
          <p className="text-gray-600 text-center mb-8">
            Enter the admin password to record match results
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`w-full px-4 py-4 border-2 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
                placeholder="Enter admin password"
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <span className="text-sm">❌</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!password.trim() || isLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
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