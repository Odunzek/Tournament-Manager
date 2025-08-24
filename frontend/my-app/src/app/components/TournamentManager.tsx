"use client";

import Image from "next/image";
import { deleteDoc, doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { 
  createTournament, 
  getTournaments, 
  deleteTournament,
  addMemberToTournament,
  getTournamentMembers,
  generateGroups,
  recordGroupMatch,
  recordKnockoutMatch,
  subscribeToTournaments,
  updateTournament,
  Tournament,
  TournamentParticipant,
  TournamentGroup,
  GroupStanding,
  getQualifiedTeamsForKnockout,  
  progressToKnockoutStage,        
  calculateOptimalBracketSize, 
  DEFAULT_CHAMPIONS_LEAGUE_SETTINGS,
  DEFAULT_CUSTOM_SETTINGS,
  DEFAULT_KNOCKOUT_SETTINGS
} from "../../lib/tournamentUtils";
import { getGroupMembers, GroupMember } from "../../lib/membershipUtils";
import { useAuth } from "../../lib/AuthContext";
import { db } from '../../lib/firebase';
import TournamentTeams from './tournaments/TournamentTeams';
import TournamentOverview from './tournaments/TournamentOverview';
import TournamentGroups from './tournaments/TournamentGroups';
import TournamentKnockout from './tournaments/TournamentKnockout';
import TournamentResults from './tournaments/TournamentResults';

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

// Put this ABOVE your component, after imports
export const formatDate = (dateLike: any) => {
  if (!dateLike) return 'Not set';
  if (dateLike?.toDate) return dateLike.toDate().toLocaleDateString();
  if (dateLike?.seconds) return new Date(dateLike.seconds * 1000).toLocaleDateString();
  return new Date(dateLike).toLocaleDateString();
};


export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentMembers, setTournamentMembers] = useState<TournamentParticipant[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'create' | 'manage'>('tournaments');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [recordingMatch, setRecordingMatch] = useState<{groupId: string; homeTeam: string; awayTeam: string;} | null>(null);
  const [recordingKnockoutMatch, setRecordingKnockoutMatch] = useState<{
    tieId: string;
    leg: 'first' | 'second';
    homeTeam: string; 
    awayTeam: string;
  } | null>(null);
  const [matchScores, setMatchScores] = useState({
    homeScore: '',
    awayScore: ''
  });
  const [manageTab, setManageTab] = useState<'overview' | 'teams' | 'groups' | 'knockout' | 'results'>('overview');

  // Create tournament form data
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as Tournament['type'],
    maxTeams: 16,
    startDate: '',
    endDate: ''
  });

  // Add team form data
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    country: '',
    selectedPlayers: [] as string[]
  });

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // Load data and setup real-time listeners
  useEffect(() => {
    const loadData = async () => {
      setIsLoaded(true);

      // Load members for team creation
      const loadedMembers = await getGroupMembers();
      setMembers(loadedMembers.filter(m => m.isActive));
    };

    loadData();
    
    // Setup real-time listener for tournaments
    const unsubscribe = subscribeToTournaments((updatedTournaments) => {
      setTournaments(updatedTournaments);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Load teams when tournament is selected
  useEffect(() => {
    if (selectedTournament?.id) {
      const loadMembers = async () => {
        const members = await getTournamentMembers(selectedTournament.id!);
        setTournamentMembers(members);
      };
      loadMembers();
    }
  }, [selectedTournament]);


  // Helper function to calculate knockout bracket size
  const calculateKnockoutSize = (totalGroups: number): number => {
    const top2Teams = totalGroups * 2;
    if (top2Teams >= 16) return 16;
    if (top2Teams >= 8) return 8;
    if (top2Teams >= 4) return 4;
    return top2Teams;
  };

  // Handle tournament creation
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requireAuth()) return;
  
    if (!formData.name.trim()) {
      showToast('Tournament name is required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let settings;
      
      switch (formData.type) {
        case 'champions_league':
          settings = DEFAULT_CHAMPIONS_LEAGUE_SETTINGS;
          break;
        case 'knockout':
          settings = DEFAULT_KNOCKOUT_SETTINGS;
          break;
        case 'league':
          settings = {
            ...DEFAULT_CUSTOM_SETTINGS,
            hasKnockoutStage: false
          };
          break;
        case 'custom':
        default:
          settings = DEFAULT_CUSTOM_SETTINGS;
          break;
      }

      // Ensure maxTeams is valid
      const maxTeams = formData.maxTeams === 0 ? 16 : Math.max(2, formData.maxTeams);

      await createTournament({
        name: formData.name.trim(),
        type: formData.type,
        maxTeams,
        ...(formData.startDate ? { startDate: new Date(formData.startDate) } : {}),
        ...(formData.endDate ? { endDate: new Date(formData.endDate) } : {}),
        settings,
        status: 'setup'
      });
      showToast(`${formData.name} tournament created successfully!`, 'success');
      setFormData({
        name: '',
        type: 'custom',
        maxTeams: 16,
        startDate: '',
        endDate: ''
      });
      setShowCreateForm(false);
      setActiveTab('tournaments');
    } catch (error) {
      console.error('Error creating tournament:', error);
      showToast('Failed to create tournament', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tournament deletion
  const handleDeleteTournament = async (tournament: Tournament) => {
    if (!tournament.id) return;
    
    setIsLoading(true);
    try {
      await deleteTournament(tournament.id);
      showToast(`${tournament.name} deleted successfully`, 'success');
      
      if (selectedTournament?.id === tournament.id) {
        setSelectedTournament(null);
        setTournamentMembers([]);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      showToast('Failed to delete tournament', 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  // Handle adding member to tournament
  const handleAddMemberWrapper = async (selectedMemberId: string) => {
    if (!selectedTournament?.id) return;

    // Find the selected member
    const selectedMember = members.find(m => m.id === selectedMemberId);
    if (!selectedMember) {
      showToast('Selected member not found', 'error');
      return;
    }

    // Prevent exceeding max allowed
    if (selectedTournament.currentTeams >= selectedTournament.maxTeams) {
      showToast('Tournament is full', 'error');
      return;
    }

    // Check if member is already in tournament
    if (tournamentMembers.some(tm => tm.name === selectedMember.name)) {
      showToast('Member is already in this tournament', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Add to Firestore
      await addMemberToTournament(selectedTournament.id, {
        name: selectedMember.name,
        psnId: selectedMember.psnId || selectedMember.name
      });

      showToast(`${selectedMember.name} added to tournament!`, 'success');

      // Reload updated members AND tournament data
      const updatedMembers = await getTournamentMembers(selectedTournament.id);
      setTournamentMembers(updatedMembers);

      // Update tournament data to reflect current team count
      const updatedTournaments = await getTournaments();
      const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      }

    } catch (error) {
      console.error('Error adding member:', error);
      showToast('Failed to add member', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  // Handle removing member from tournament
  const handleRemoveMember = async (member: TournamentParticipant) => {
    if (!requireAuth()) return;
    
    if (!selectedTournament?.id || !member.id) {
      showToast('Cannot remove member', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Delete from tournament_members collection
      await deleteDoc(doc(db, 'tournament_members', member.id));
      
      // Update tournament current teams count
      await updateTournament(selectedTournament.id, {
        currentTeams: selectedTournament.currentTeams - 1
      });
      
      showToast(`${member.name} removed from tournament`, 'success');
      
      // Reload updated members and tournament data
      const updatedMembers = await getTournamentMembers(selectedTournament.id);
      setTournamentMembers(updatedMembers);
      
      const updatedTournaments = await getTournaments();
      const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      }
      
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('Failed to remove member', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle generating groups
  const handleGenerateGroups = async () => {
    if (!requireAuth()) return;
    if (!selectedTournament?.id) return;
    
    if (tournamentMembers.length < 8) {
      showToast('Need at least 8 teams to generate groups', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await generateGroups(selectedTournament.id);
      showToast('Groups generated successfully!', 'success');
      
      // Reload tournament data
      const updatedTournaments = await getTournaments();
      const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      }
    } catch (error) {
      console.error('Error generating groups:', error);
      showToast('Failed to generate groups', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recording match result
  const handleRecordMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requireAuth()) return;
    
    if (!selectedTournament?.id || !recordingMatch) return;
    
    const homeScore = parseInt(matchScores.homeScore);
    const awayScore = parseInt(matchScores.awayScore);
    
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showToast('Please enter valid scores (0 or higher)', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await recordGroupMatch(
        selectedTournament.id,
        recordingMatch.groupId,
        recordingMatch.homeTeam,
        recordingMatch.awayTeam,
        homeScore,
        awayScore
      );
      
      showToast(`Match recorded: ${recordingMatch.homeTeam} ${homeScore}-${awayScore} ${recordingMatch.awayTeam}`, 'success');
      
      // Reset form
      setRecordingMatch(null);
      setMatchScores({ homeScore: '', awayScore: '' });
      
      // Reload tournament data
      const updatedTournaments = await getTournaments();
      const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      }
      
    } catch (error) {
      console.error('Error recording match:', error);
      showToast('Failed to record match result', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  // Handle recording knockout match result
  const handleRecordKnockoutMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requireAuth()) return;
    
    if (!selectedTournament?.id || !recordingKnockoutMatch) return;
    
    const homeScore = parseInt(matchScores.homeScore);
    const awayScore = parseInt(matchScores.awayScore);
    
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showToast('Please enter valid scores (0 or higher)', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await recordKnockoutMatch(
        selectedTournament.id,
        recordingKnockoutMatch.tieId,
        recordingKnockoutMatch.leg,
        recordingKnockoutMatch.homeTeam,
        recordingKnockoutMatch.awayTeam,
        homeScore,
        awayScore
      );
      
      showToast(`Match recorded: ${recordingKnockoutMatch.homeTeam} ${homeScore}-${awayScore} ${recordingKnockoutMatch.awayTeam}`, 'success');
      
      // Reset form
      setRecordingKnockoutMatch(null);
      setMatchScores({ homeScore: '', awayScore: '' });
      
      // Reload tournament data
      const updatedTournaments = await getTournaments();
      const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      }
      
    } catch (error) {
      console.error('Error recording knockout match result:', error);
      showToast('Failed to record knockout match result', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if all group matches are completed
  const areGroupMatchesComplete = (tournament: Tournament): boolean => {
    if (!tournament.groups) return false;

    return tournament.groups.every(group =>
        group.matches.every(match => match.played)
      );
    };


  // Generate knockout stage from group winners + best 3rd place teams
const handleGenerateKnockout = async () => {
  if (!requireAuth()) return;
  
  if (!selectedTournament?.id) {
    showToast('No tournament selected', 'error');
    return;
  }

  setIsLoading(true);
  try {
    // Use the new function that handles everything properly
    await progressToKnockoutStage(selectedTournament.id);
    
    showToast('Knockout stage generated successfully!', 'success');
    
    // Reload tournament data
    const updatedTournaments = await getTournaments();
    const updatedTournament = updatedTournaments.find(t => t.id === selectedTournament.id);
    if (updatedTournament) {
      setSelectedTournament(updatedTournament);
    }
    
  } catch (error) {
    console.error('Error generating knockout stage:', error);
    showToast('Failed to generate knockout stage', 'error');
  } finally {
    setIsLoading(false);
  }
};
  // Get tournament type icon and color
  const getTournamentTypeInfo = (type: Tournament['type']) => {
    switch (type) {
      case 'champions_league':
        return { icon: '🏆', color: 'bg-blue-500', name: 'Group + Knockout' };
      case 'knockout':
        return { icon: '🥊', color: 'bg-red-500', name: 'Knockout Tournament' };
      case 'league':
        return { icon: '⚽', color: 'bg-green-500', name: 'Round Robin League' };
      case 'custom':
        return { icon: '🎯', color: 'bg-purple-500', name: 'Custom Tournament' };
      default:
        return { icon: '🏟️', color: 'bg-gray-500', name: 'Tournament' };
    }
  };

  // Get status color and text
  const getStatusInfo = (status: Tournament['status']) => {
    switch (status) {
      case 'setup':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Setup' };
      case 'group_stage':
        return { color: 'bg-blue-100 text-blue-800', text: 'Group Stage' };
      case 'knockout':
        return { color: 'bg-orange-100 text-orange-800', text: 'Knockout' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Completed' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  // Show loading state while data loads
  if (!isLoaded) {
    return (
      <div className="mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-8 bg-white/20 backdrop-blur-2 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <span className="text-2xl">
                  <Image
                    src="/icons/tournaments.svg"
                    alt="Tournament Icon"
                    width={60}
                    height={60}
                  />
                </span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Tournaments</h2>
                <p className="text-white/80 text-xs sm:text-sm">Create and manage football tournaments</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
              <span className="text-white/80 font-medium">Active Tournaments:</span>
              <span className="text-white font-bold ml-2">{tournaments.length}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 ">
          <div className="flex space-x-2 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { id: 'tournaments', label: 'Tournaments', icon: '/icons/league.svg', size:24 },
              { id: 'create', label: 'Create Tournament', icon: '/icons/plus.svg', size:24 },
              { id: 'manage', label: 'Manage', icon: '/icons/manage.svg', size:24 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={isLoading || (tab.id === 'manage' && !selectedTournament)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white bg-purple-600 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
                            active:scale-95 focus:outline-none focus:ring-0 focus:ring-purple-500 focus:ring-offset-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-white hover:bg-indigo-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>
                  <Image 
                    src={tab.icon} 
                    alt={`${tab.label} icon`} 
                    width={tab.size} 
                    height={tab.size}
                  />                  
                </span>
                <span>{tab.label}</span>
                {tab.id === 'manage' && selectedTournament && (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedTournament.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-8">
          {/* Tournaments Tab */}
          {activeTab === 'tournaments' && (
            <div>
              {tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {tournaments.map((tournament) => {
                    const typeInfo = getTournamentTypeInfo(tournament.type);
                    const statusInfo = getStatusInfo(tournament.status);
                    
                    return (
                      <div
                        key={tournament.id}
                        className={`group bg-white/70 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer relative ${
                          selectedTournament?.id === tournament.id
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => setSelectedTournament(tournament)}
                      >
                        {/* Tournament Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 ${typeInfo.color} rounded-full flex items-center justify-center text-white text-xl shadow-lg`}>
                              {typeInfo.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-base sm:text-lg">{tournament.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-600">{typeInfo.name}</p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!requireAuth()) return;
                                setShowDeleteConfirm(tournament);
                              }}
                              disabled={isLoading}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-indigo-100 rounded-lg transition-colors duration-300 disabled:opacity-30"
                              title="Delete tournament"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Tournament Info */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-600">
                              {tournament.currentTeams}/{tournament.maxTeams} teams
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((tournament.currentTeams / tournament.maxTeams) * 100, 100)}%` }}
                            ></div>
                          </div>
                          
                          {tournament.startDate && (
                            <div className="text-xs text-gray-500">
                              Starts: {formatDate(tournament.startDate)}
                            </div>
                          )}
                        </div>

                        {/* Selection Indicator */}
                        {selectedTournament?.id === tournament.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-indigo-400 rounded-full animate-ping"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-400 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-7xl sm:text-8xl mb-6">🏆</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Tournaments Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first tournament to get started!</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                  >
                    Create Tournament
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Tournament Tab */}
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-3">
                  <span className="text-3xl">🏆</span>
                  <span>Create New Tournament</span>
                </h3>
                
                <form onSubmit={handleCreateTournament} className="space-y-6">
                  {/* Tournament Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tournament Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-black w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                      placeholder="Enter tournament name (e.g., Champions League 2024)"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Tournament Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Tournament Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Tournament['type'] })}
                        className="text-black w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                        disabled={isLoading}
                      >
                        <option value="champions_league">🏆 Champions League</option>
                        <option value="knockout">🏅 Knockout Tournament</option>
                        <option value="league">⚽ League</option>
                        <option value="custom">🎯 Custom Tournament</option>
                      </select>
                    </div>

                    {/* Max Teams */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Maximum Teams
                      </label>
                      <select
                        value={formData.maxTeams}
                        onChange={(e) => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
                        className="text-black w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                        disabled={isLoading}
                      >
                        <option value={8}>8 Teams (2 Groups)</option>
                        <option value={16}>16 Teams (4 Groups)</option>
                        <option value={24}>24 Teams (6 Groups)</option>
                        <option value={32}>32 Teams (8 Groups)</option>
                        <option value={48}>48 Teams (12 Groups)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="text-black w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="text-black w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Tournament...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <span className="text-xl">🏆</span>
                        <span>Create Tournament</span>
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* Manage Tab */}
          {activeTab === 'manage' && selectedTournament && (
            <div className="space-y-8">
              {/* Sub-Navigation for Manage */}
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="bg-blue-600 px-4 sm:px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl">
                      {getTournamentTypeInfo(selectedTournament.type).icon}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">{selectedTournament.name}</h3>
                      <p className="text-blue-100 text-xs sm:text-sm">{getTournamentTypeInfo(selectedTournament.type).name}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="bg-blue-500 px-3 py-1 rounded-lg text-white text-xs sm:text-sm font-medium">
                        {getStatusInfo(selectedTournament.status).text}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="bg-gray-50 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto whitespace-nowrap">
                    {[
                      { id: 'overview', label: 'Overview', icon: '📊' },
                      { id: 'teams', label: 'Teams', icon: '👥' },
                      { id: 'groups', label: 'Groups', icon: '🏆', disabled: !selectedTournament.groups?.length },
                      { id: 'knockout', label: 'Knockout', icon: '🥊', disabled: !selectedTournament.knockoutBracket?.length },
                      { id: 'results', label: 'Results', icon: '📋' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setManageTab(tab.id as any)}
                        disabled={tab.disabled}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          manageTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : tab.disabled 
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.id === 'groups' && selectedTournament.groups && (
                          <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs">
                            {selectedTournament.groups.length}
                          </span>
                        )}
                        {tab.id === 'knockout' && selectedTournament.knockoutBracket && (
                          <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs">
                            {selectedTournament.knockoutBracket.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6">
                  {/* Overview Tab */}
                  {manageTab === 'overview' && (
                    <div className="overflow-x-auto">
                      <TournamentOverview
                        tournament={selectedTournament}
                        isLoading={isLoading}
                        onGenerateGroups={handleGenerateGroups}
                        onGenerateKnockout={handleGenerateKnockout}
                        areGroupMatchesComplete={areGroupMatchesComplete}
                      />
                    </div>
                  )}

                  {/* Teams Tab */}
                  {manageTab === 'teams' && (
                    <div className="overflow-x-auto">
                      <TournamentTeams 
                        tournament={selectedTournament}
                        tournamentMembers={tournamentMembers}
                        members={members}
                        isLoading={isLoading}
                        isAuthenticated={isAuthenticated}
                        onAddMember={handleAddMemberWrapper}
                        onRemoveMember={handleRemoveMember}
                      />
                    </div>
                  )}

                  {/* Groups Tab */}
                  {manageTab === 'groups' && (
                    <div className="overflow-x-auto">
                      <TournamentGroups
                        tournament={selectedTournament}
                        isLoading={isLoading}
                        isAuthenticated={isAuthenticated}
                        onRecordMatch={(groupId, homeTeam, awayTeam) => 
                          setRecordingMatch({ groupId, homeTeam, awayTeam })
                        }
                      />
                    </div>
                  )}

                  {/* Knockout Tab */}
                  {manageTab === 'knockout' && (
                    <div className="overflow-x-auto">
                      <TournamentKnockout
                        tournament={selectedTournament}
                        isLoading={isLoading}
                        isAuthenticated={isAuthenticated}
                        onRecordKnockoutMatch={(tieId, leg, homeTeam, awayTeam) =>
                          setRecordingKnockoutMatch({ tieId, leg, homeTeam, awayTeam })
                        }
                      />
                    </div>
                  )}

                  {/* Results Tab */}
                  {manageTab === 'results' && (
                    <div className="overflow-x-auto">
                      <TournamentResults tournament={selectedTournament} />
                    </div>
                  )}
                </div> {/* Close Tab Content div */}
              </div>
            </div> 
          )}

          {/* No Tournament Selected for Manage Tab */}
          {activeTab === 'manage' && !selectedTournament && (
            <div className="text-center py-12">
              <div className="text-8xl mb-6">⚙️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Tournament Selected</h3>
              <p className="text-black mb-6">Select a tournament from the tournaments tab to manage it.</p>
              <button
                onClick={() => setActiveTab('tournaments')}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                View Tournaments
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-h-[90vh] overflow-auto rounded-2xl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                  Delete Tournament?
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
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTournament(showDeleteConfirm)}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      'Delete Tournament'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Recording Modal - Handles both Group and Knockout matches */}
      {(recordingMatch || recordingKnockoutMatch) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-h-[90vh] overflow-auto rounded-2xl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full">
                  <span className="text-3xl">⚽</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                  Record Match Result
                </h3>
                
                {/* Match Details */}
                <div className="text-gray-600 text-center mb-8">
                  {recordingMatch ? (
                    <p><strong>{recordingMatch.homeTeam}</strong> vs <strong>{recordingMatch.awayTeam}</strong></p>
                  ) : recordingKnockoutMatch ? (
                    <div>
                      <p><strong>{recordingKnockoutMatch.homeTeam}</strong> vs <strong>{recordingKnockoutMatch.awayTeam}</strong></p>
                      <p className="text-sm mt-1 text-blue-600">
                        {recordingKnockoutMatch.leg === 'first' ? '1st Leg' : '2nd Leg'}
                      </p>
                    </div>
                  ) : null}
                </div>
                
                <form onSubmit={recordingMatch ? handleRecordMatch : handleRecordKnockoutMatch} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {recordingMatch ? recordingMatch.homeTeam : recordingKnockoutMatch?.homeTeam}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={matchScores.homeScore}
                        onChange={(e) => setMatchScores({ ...matchScores, homeScore: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-center text-2xl font-bold text-black"
                        placeholder="0"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {recordingMatch ? recordingMatch.awayTeam : recordingKnockoutMatch?.awayTeam}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={matchScores.awayScore}
                        onChange={(e) => setMatchScores({ ...matchScores, awayScore: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-center text-2xl font-bold text-black"
                        placeholder="0"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRecordingMatch(null);
                        setRecordingKnockoutMatch(null);
                        setMatchScores({ homeScore: '', awayScore: '' });
                      }}
                      disabled={isLoading}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !matchScores.homeScore || !matchScores.awayScore}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Recording...</span>
                        </div>
                      ) : (
                        'Record Result'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
