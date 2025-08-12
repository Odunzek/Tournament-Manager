"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createLeague, deleteLeague, subscribeToLeagues, League, updateLeague } from "../../lib/firebaseutils";
import { useAuth } from "../../lib/AuthContext";

interface LeagueSelectorProps {
  onLeagueSelect: (league: string, leagueId: string) => void;
}

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 backdrop-blur-sm ${
    type === 'success' ? 'bg-green-500/90 text-white' : 
    type === 'error' ? 'bg-red-500/90 text-white' : 
    'bg-blue-500/90 text-white'
  }`}>
    <div className="flex items-center space-x-3">
      <span className="text-xl">
        {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 font-bold">×</button>
    </div>
  </div>
);

export default function LeagueSelector({ onLeagueSelect }: LeagueSelectorProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<League | null>(null);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

const { isAuthenticated, setShowAuthModal } = useAuth();

  // requireAuth function
  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load data and setup real-time listener
  useEffect(() => {
    setIsLoaded(true);
    
    // Setup real-time listener for leagues
    const unsubscribe = subscribeToLeagues((updatedLeagues) => {
      setLeagues(updatedLeagues);
      
      // Get current league from localStorage for initial load
      const savedCurrentId = localStorage.getItem("currentLeagueId") || "";
      const savedLeague = updatedLeagues.find(league => league.id === savedCurrentId);
      
      if (savedLeague) {
        setCurrentLeague(savedLeague);
        onLeagueSelect(savedLeague.name, savedLeague.id!);
      } else if (updatedLeagues.length > 0 && !currentLeague) {
        // Auto-select first league if none selected
        const firstLeague = updatedLeagues[0];
        setCurrentLeague(firstLeague);
        onLeagueSelect(firstLeague.name, firstLeague.id!);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Save current league to localStorage
  useEffect(() => {
    if (currentLeague?.id) {
      localStorage.setItem("currentLeagueId", currentLeague.id);
      localStorage.setItem("currentLeagueName", currentLeague.name);
    }
  }, [currentLeague]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateLeagueName = (name: string, excludeId?: string): string | null => {
    if (!name.trim()) return "League name cannot be empty";
    if (name.trim().length < 2) return "League name must be at least 2 characters";
    if (name.trim().length > 50) return "League name must be less than 50 characters";
    
    const existingLeague = leagues.find(league => 
      league.name.toLowerCase() === name.trim().toLowerCase() && league.id !== excludeId
    );
    if (existingLeague) return "League name already exists";
    
    return null;
  };

  const handleSelectExisting = (league: League) => {
    setCurrentLeague(league);
    setInputValue("");
    setIsCreatingNew(false);
    setEditingLeague(null);
    setError("");
    
    onLeagueSelect(league.name, league.id!);
  };

  const handleCreateNew = async () => {
    if (!requireAuth()) return;
    const trimmedName = inputValue.trim();
    const validationError = validateLeagueName(trimmedName);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const newLeagueId = await createLeague(trimmedName);
      const newLeague: League = {
        id: newLeagueId,
        name: trimmedName,
        createdAt: new Date(),
        teams: []
      };
      
      setCurrentLeague(newLeague);
      setInputValue("");
      setIsCreatingNew(false);
      setError("");
      
      showToast(`${trimmedName} league created successfully!`, 'success');
      onLeagueSelect(trimmedName, newLeagueId);
    } catch (error) {
      console.error('Error creating league:', error);
      setError("Failed to create league. Please try again.");
      showToast("Failed to create league", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLeague = (league: League) => {
    setEditingLeague(league);
    setEditValue(league.name);
    setIsCreatingNew(false);
    setError("");
  };

  const handleSaveEdit = async () => {
    if (!requireAuth()) return;
    if (!editingLeague?.id) return;
    
    const trimmedName = editValue.trim();
    const validationError = validateLeagueName(trimmedName, editingLeague.id);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await updateLeague(editingLeague.id, { name: trimmedName });
      
      // Update current league if it's the one being edited
      if (currentLeague?.id === editingLeague.id) {
        const updatedLeague = { ...currentLeague, name: trimmedName };
        setCurrentLeague(updatedLeague);
        onLeagueSelect(trimmedName, editingLeague.id);
      }
      
      setEditingLeague(null);
      setEditValue("");
      setError("");
      
      showToast(`League renamed to "${trimmedName}"`, 'success');
    } catch (error) {
      console.error('Error updating league:', error);
      setError("Failed to update league. Please try again.");
      showToast("Failed to update league", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLeague = async (league: League) => {
    if (!requireAuth()) return;
    if (!league.id) return;
    
    setIsLoading(true);
    try {
      await deleteLeague(league.id);
      
      if (currentLeague?.id === league.id) {
        const remainingLeagues = leagues.filter(l => l.id !== league.id);
        if (remainingLeagues.length > 0) {
          const newCurrent = remainingLeagues[0];
          setCurrentLeague(newCurrent);
          onLeagueSelect(newCurrent.name, newCurrent.id!);
        } else {
          setCurrentLeague(null);
          onLeagueSelect("", "");
        }
      }
      
      showToast(`${league.name} league deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting league:', error);
      showToast("Failed to delete league", 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (editingLeague) {
        handleSaveEdit();
      } else {
        handleCreateNew();
      }
    }
    if (e.key === 'Escape') {
      setIsCreatingNew(false);
      setEditingLeague(null);
      setInputValue("");
      setEditValue("");
      setError("");
    }
  };

  // Show loading state while data loads
  if (!isLoaded) {
    return (
      <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl  overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12  rounded-xl flex items-center justify-center">
                <div className="  flex items-center justify-center">
                  <Image
                    src="/icons/league.svg"
                    alt="League Icon"
                    width={48} 
                    height={48}
                  />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">League Manager</h2>
                <p className="text-white/80 text-sm">Select or create your football league</p>
              </div>
            </div>
            {currentLeague && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-white/80 text-sm font-medium">Current:</span>
                <span className="text-white font-bold ml-2">{currentLeague.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="text-red-500 text-xl">❌</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Existing Leagues */}
          {leagues.length > 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-100">Your Leagues</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>📊</span>
                  <span className="font-semibold text-gray-100">{leagues.length} league{leagues.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagues.map((league, index) => (
                  <div
                    key={league.id}
                    className={`group relative p-6 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                      currentLeague?.id === league.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-blue hover:shadow-lg'
                    }`}
                    onClick={() => !editingLeague && currentLeague?.id !== league.id && handleSelectExisting(league)}
                  >
                    {/* League Card Content */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${
                          currentLeague?.id === league.id ? 'bg-blue-400' : 'bg-blue-400'
                        }`}></div>
                        
                        {/* Editable League Name */}
                        {editingLeague?.id === league.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="w-full max-w-full font-bold text-lg text-black bg-white  rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                            autoFocus
                            maxLength={50}
                            disabled={isLoading}
                          />
                        ) : (
                          <span className={`font-bold text-lg ${
                            currentLeague?.id === league.id ? 'text-white' : 'text-black'
                          }`}>
                            {league.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      {(currentLeague?.id === league.id || editingLeague?.id === league.id) && (
                      <div className="flex items-center space-x-1 ">
                        {editingLeague?.id === league.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                              disabled={isLoading}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-blue-400 rounded-lg transition-all duration-300"
                              title="Save changes"
                            >
                                <Image
                                src="/icons/checkbox.svg"
                                alt="checkbox Icon"
                                width={24}
                                height={24}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLeague(null);
                                setEditValue("");
                                setError("");
                              }}
                              disabled={isLoading}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-blue-400 rounded-lg transition-all duration-300"
                              title="Cancel editing"
                            >
                                <Image
                                src="/icons/cancel.svg"
                                alt="cancel Icon"
                                width={24}
                                height={24}
                              />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLeague(league);
                              }}
                              className=" p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-400 rounded-lg "
                              title="Edit league name"
                              disabled={isLoading}
                            >
                                <Image
                                src="/icons/editB.svg"
                                alt="edit Icon"
                                width={24}
                                height={24}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(league);
                              }}
                              className=" p-2 text-red-500 hover:text-red-700 hover:bg-blue-400 rounded-lg "
                              title="Delete league"
                              disabled={isLoading}
                            >
                                <Image
                                src="/icons/delete.svg"
                                alt="delete Icon"
                                width={24}
                                height={24}
                              />
                            </button>
                          </>
                        )}
                      </div>
                      )}
                    </div>

                    {/* League Status */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {currentLeague?.id === league.id ? (
                          <div className="flex items-center space-x-2">
                          </div>
                        ) : editingLeague?.id === league.id ? (
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                            <span className="font-medium text-white">Editing...</span>
                          </div>
                        ) : (
                          <span className="text-gray-600">Click to switch</span>
                        )}
                      </div>
                      
                      {/* League Number Badge */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentLeague?.id === league.id 
                          ? 'bg-blue-400 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Active indicator */}
                    {currentLeague?.id === league.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center mb-8 py-12">
              <div className=" mb-2">
                  <Image
                  src="/icons/trophy.svg"
                  alt="trophy Icon"
                  width={48}
                  height={48}
                 /> 
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2"> No Leagues Yet</h3>
              <p className="text-gray-600 mb-6">Create your first league to get started!</p>
            </div>
          )}

          {/* Create New League Section */}
          <div className="  backdrop-blur-sm rounded-xl p-4 ">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">
                    <Image
                      src="/icons/plus.svg"
                      alt="plus Icon"
                      width={24}
                      height={24}
                    />
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create New League</h3>
                  <p className="text-white text-sm">Start managing a new football league</p>
                </div>
              </div>
              
              {!isCreatingNew && !editingLeague && (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  New League
                </button>
              )}
            </div>

            {isCreatingNew && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter league name (e.g., Premier League 2024)"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-white placeholder-gray-400 focus:outline-none  focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      autoFocus
                      maxLength={50}
                      disabled={isLoading}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-white">
                        {inputValue.length >= 2 && !error ? '✅ Ready to create!' : 'Min 2 characters'}
                      </span>
                      <span className="text-gray-400">{inputValue.length}/50</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateNew}
                      disabled={!inputValue.trim() || !!error || isLoading}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating...</span>
                        </div>
                      ) : (
                        'Create'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingNew(false);
                        setInputValue("");
                        setError("");
                      }}
                      disabled={isLoading}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* League Preview */}
                {inputValue.trim() && !error && (
                  <div className="bg-white border border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">League Preview</h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{leagues.length + 1}</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{inputValue.trim()}</div>
                        <div className="text-xs text-gray-500">Ready to add teams and matches</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                <span className="text-3xl">
                  <Image
                  src="/icons/delete.svg"
                  alt="delete Icon"
                  width={32}
                  height={32}
                 /> 
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Delete League?
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                This will permanently delete <strong>"{showDeleteConfirm.name}"</strong> and all its teams, matches, and history. This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  Keep League
                </button>
                <button
                  onClick={() => handleDeleteLeague(showDeleteConfirm)}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete Forever'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}