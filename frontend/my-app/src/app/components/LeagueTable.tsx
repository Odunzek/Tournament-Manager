"use client";

import React, { useEffect, useState } from "react";
import MatchResultForm from "./MatchResultForm";
import Link from "next/link";
import { 
  createTeam, 
  updateTeamStats, 
  saveMatch, 
  subscribeToTeams,
  deleteLeague,
  updateLeague
} from "../../lib/firebaseutils";
import { 
  getGroupMembers,
  subscribeToGroupMembers,
  GroupMember 
} from "../../lib/membershipUtils";
import { useAuth } from "../../lib/AuthContext";

// Updated Team type to track member info
type Team = {
  id?: string;
  memberId: string;  // Track which member this is
  name: string;
  psnId?: string;    // Keep PSN ID from member
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  color?: string;
  leagueId?: string;
};

// League status type
type LeagueStatus = 'active' | 'ended';

interface LeagueTableProps {
  leagueName: string;
  leagueId: string;
}

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-500 ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`}>
    <div className="flex items-center space-x-3">
      <span className="text-xl">
        {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">×</button>
    </div>
  </div>
);

// Loading skeleton
const TableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 px-6 py-4">
      <div className="h-6 bg-white bg-opacity-30 rounded w-48"></div>
    </div>
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function LeagueTable({ leagueName, leagueId }: LeagueTableProps) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<'table' | 'add-member' | 'add-match'>('table');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [leagueStatus, setLeagueStatus] = useState<LeagueStatus>('active');
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [previousPositions, setPreviousPositions] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [otherLeagues, setOtherLeagues] = useState<any[]>([]);

  // Team colors palette
  const teamColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check authentication
  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // Load league status from localStorage
  useEffect(() => {
    const status = localStorage.getItem(`league_${leagueId}_status`) || 'active';
    setLeagueStatus(status as LeagueStatus);
  }, [leagueId]);

  // Load all leagues to check member availability
  useEffect(() => {
    const allLeagues = JSON.parse(localStorage.getItem('leagueList') || '[]');
    const leaguesData = allLeagues.map((leagueName: string) => {
      const teamsKey = `league_${leagueName}_teams`;
      const statusKey = `league_${leagueName}_status`;
      const teams = JSON.parse(localStorage.getItem(teamsKey) || '[]');
      const status = localStorage.getItem(statusKey) || 'active';
      return { name: leagueName, teams, status };
    });
    setOtherLeagues(leaguesData);
  }, []);

  // Subscribe to members
  useEffect(() => {
    const loadMembers = async () => {
      const loadedMembers = await getGroupMembers();
      setMembers(loadedMembers.filter(m => m.isActive));
    };
    
    loadMembers();
    
    const unsubscribe = subscribeToGroupMembers((updatedMembers) => {
      const activeMembers = updatedMembers.filter(m => m.isActive);
      setMembers(activeMembers);
    });

    return () => unsubscribe();
  }, []);

  // Load teams from Firebase when leagueId changes
  useEffect(() => {
    if (!leagueId) {
      setIsLoaded(true);
      return;
    }

    const unsubscribe = subscribeToTeams(leagueId, (firebaseTeams) => {
      const formattedTeams = firebaseTeams.map((team, index) => ({
        id: team.id,
        memberId: team.memberId || team.id,
        name: team.name,
        psnId: team.psnId,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        gf: team.goalsFor,
        ga: team.goalsAgainst,
        points: team.points,
        color: teamColors[index % teamColors.length],
        leagueId: team.leagueId
      }));

      const positions: {[key: string]: number} = {};
      formattedTeams.forEach((team, index) => {
        positions[team.name] = index + 1;
      });
      setPreviousPositions(positions);
      
      setTeams(formattedTeams);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [leagueId]);

  // Get available members (not in any active league)
  const getAvailableMembers = () => {
    return members.filter(member => {
      // Check if member is in current league
      const inCurrentLeague = teams.some(team => 
        team.memberId === member.id || team.name === member.name
      );
      
      // Check if member is in other active leagues
      const inOtherActiveLeague = otherLeagues.some(league => {
        if (league.name === leagueName) return false; // Skip current league
        if (league.status === 'ended') return false; // Skip ended leagues
        
        return league.teams.some((team: any) => 
          team.id === member.id || team.name === member.name
        );
      });
      
      return !inCurrentLeague && !inOtherActiveLeague;
    });
  };

  // Get which league a member is in
  const getMemberLeague = (memberId: string) => {
    const league = otherLeagues.find(league => {
      if (league.status === 'ended') return false;
      return league.teams.some((team: any) => team.id === memberId);
    });
    return league?.name;
  };

  // Handle adding a member to league
  const handleAddMember = async () => {
    if (!requireAuth()) return;
    
    if (!selectedMemberId) {
      showToast('Please select a member', 'error');
      return;
    }

    if (!leagueId) {
      showToast('No league selected', 'error');
      return;
    }

    const selectedMember = members.find(m => m.id === selectedMemberId);
    if (!selectedMember) {
      showToast('Member not found', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Create team with member info
      await createTeam(leagueId, selectedMember.name, {
        memberId: selectedMember.id,
        psnId: selectedMember.psnId
      });
      
      // Also update localStorage for cross-league checking
      const teamsKey = `league_${leagueName}_teams`;
      const currentTeams = JSON.parse(localStorage.getItem(teamsKey) || '[]');
      currentTeams.push({
        id: selectedMember.id,
        memberId: selectedMember.id,
        name: selectedMember.name,
        psnId: selectedMember.psnId
      });
      localStorage.setItem(teamsKey, JSON.stringify(currentTeams));
      
      setSelectedMemberId('');
      showToast(`${selectedMember.name} added to league!`, 'success');
    } catch (error) {
      console.error('Error adding member:', error);
      showToast('Failed to add member', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle match results
  const handleMatchSubmit = async (data: {
    team1: string;
    team2: string;
    score1: number;
    score2: number;
  }) => {
    if (!requireAuth()) return;
    
    if (!leagueId) {
      showToast('No league selected', 'error');
      return;
    }

    const { team1, team2, score1, score2 } = data;
    setIsLoading(true);

    try {
      await saveMatch({
        leagueName,
        homeTeam: team1,
        awayTeam: team2,
        homeScore: score1,
        awayScore: score2,
        date: new Date()
      });

      const team1Data = teams.find(t => t.name === team1);
      const team2Data = teams.find(t => t.name === team2);

      if (!team1Data || !team2Data || !team1Data.id || !team2Data.id) {
        throw new Error('Teams not found');
      }

      // Calculate and update stats (same as before)
      const team1GoalsFor = team1Data.gf + score1;
      const team1GoalsAgainst = team1Data.ga + score2;
      const team1Won = team1Data.won + (score1 > score2 ? 1 : 0);
      const team1Drawn = team1Data.drawn + (score1 === score2 ? 1 : 0);
      const team1Lost = team1Data.lost + (score1 < score2 ? 1 : 0);
      const team1Points = team1Data.points + (score1 > score2 ? 3 : score1 === score2 ? 1 : 0);

      const team2GoalsFor = team2Data.gf + score2;
      const team2GoalsAgainst = team2Data.ga + score1;
      const team2Won = team2Data.won + (score2 > score1 ? 1 : 0);
      const team2Drawn = team2Data.drawn + (score1 === score2 ? 1 : 0);
      const team2Lost = team2Data.lost + (score2 < score1 ? 1 : 0);
      const team2Points = team2Data.points + (score2 > score1 ? 3 : score1 === score2 ? 1 : 0);

      await Promise.all([
        updateTeamStats(team1Data.id, {
          played: team1Data.played + 1,
          won: team1Won,
          drawn: team1Drawn,
          lost: team1Lost,
          goalsFor: team1GoalsFor,
          goalsAgainst: team1GoalsAgainst,
          goalDifference: team1GoalsFor - team1GoalsAgainst,
          points: team1Points
        }),
        updateTeamStats(team2Data.id, {
          played: team2Data.played + 1,
          won: team2Won,
          drawn: team2Drawn,
          lost: team2Lost,
          goalsFor: team2GoalsFor,
          goalsAgainst: team2GoalsAgainst,
          goalDifference: team2GoalsFor - team2GoalsAgainst,
          points: team2Points
        })
      ]);

      setActiveTab('table');
      const result = score1 === score2 ? 'Draw' : 
                    score1 > score2 ? `${team1} wins` : `${team2} wins`;
      showToast(`Match result recorded: ${result}`, 'success');
    } catch (error) {
      console.error('Error saving match:', error);
      showToast('Failed to save match result', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ending the league (releases members)
  const handleEndLeague = async () => {
    if (!requireAuth()) return;
    
    setIsLoading(true);
    try {
      // Update league status
      localStorage.setItem(`league_${leagueId}_status`, 'ended');
      setLeagueStatus('ended');
      
      // Update in Firebase if needed
      if (leagueId) {
        await updateLeague(leagueId, { status: 'ended', endedAt: new Date() });
      }
      
      setShowEndConfirm(false);
      showToast('League ended successfully. Members are now available for other leagues.', 'success');
    } catch (error) {
      console.error('Error ending league:', error);
      showToast('Failed to end league', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clearing/deleting the entire league
  const handleClearLeague = async () => {
    if (!requireAuth()) return;
    
    if (!leagueId) {
      showToast('No league selected', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await deleteLeague(leagueId);
      
      // Clear localStorage data
      localStorage.removeItem(`league_${leagueName}_teams`);
      localStorage.removeItem(`league_${leagueId}_status`);
      
      setTeams([]);
      setShowDeleteConfirm(false);
      setActiveTab('table');
      showToast('League deleted successfully', 'success');
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting league:', error);
      showToast('Failed to delete league', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedTeams = teams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const goalDiffA = a.gf - a.ga;
    const goalDiffB = b.gf - b.ga;
    if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
    return b.gf - a.gf;
  });

  const getPositionChange = (teamName: string, currentPos: number) => {
    const prevPos = previousPositions[teamName];
    if (!prevPos || prevPos === currentPos) return null;
    
    if (prevPos > currentPos) {
      return <span className="text-green-500 text-xs ml-1">↗</span>;
    } else {
      return <span className="text-red-500 text-xs ml-1">↘</span>;
    }
  };

  const getWinPercentage = (team: Team) => {
    if (team.played === 0) return 0;
    return (team.won / team.played) * 100;
  };

  const availableMembers = getAvailableMembers();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <div className="h-12 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="w-24 h-1 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center relative">
          <div className="relative">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              {leagueName || "League"} Table
            </h1>
            {leagueStatus === 'ended' && (
              <span className="absolute top-0 -right-20 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                ENDED
              </span>
            )}
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full mb-4"></div>
          
          {/* Action Buttons */}
          {teams.length > 0 && (
            <div className="absolute top-0 right-0 flex gap-2">
              {leagueStatus === 'active' && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={isLoading}
                  className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                  title="End league and release members"
                >
                  <span className="flex items-center space-x-2">
                    <span>🏁</span>
                    <span>End League</span>
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                title="Delete league permanently"
              >
                <span className="flex items-center space-x-2">
                  <span className="group-hover:rotate-12 transition-transform duration-300">🗑️</span>
                  <span>Clear League</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-2 flex space-x-2 border border-white/20">
            {[
              { id: 'table', label: 'League Table', icon: '🏆', color: 'blue' },
              { id: 'add-member', label: 'Add Member', icon: '➕', color: 'green', disabled: leagueStatus === 'ended' },
              { id: 'add-match', label: 'Add Match', icon: '⚽', color: 'purple', disabled: leagueStatus === 'ended' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={isLoading || tab.disabled}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg scale-105`
                    : tab.disabled
                    ? 'text-gray-400 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {activeTab === 'table' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span className="text-3xl">🏆</span>
                  <span>Current Standings</span>
                </h2>
                {teams.length > 0 && (
                  <div className="text-white/80 text-sm">
                    {teams.length} Members • {teams.reduce((sum, team) => sum + team.played, 0)} Matches Played
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    {['Pos', 'Member', 'PSN ID', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Form', 'Pts'].map((header) => (
                      <th key={header} className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedTeams.map((team, index) => {
                    const goalDiff = team.gf - team.ga;
                    const position = index + 1;
                    const winPercentage = getWinPercentage(team);
                    
                    return (
                      <tr
                        key={team.id || team.name}
                        className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 transform hover:scale-[1.02] ${
                          position === 1 ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-l-4 border-yellow-400' :
                          position <= 4 ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-l-4 border-green-400' :
                          position >= sortedTeams.length - 2 && sortedTeams.length > 4 ? 'bg-gradient-to-r from-red-50 via-rose-50 to-red-100 border-l-4 border-red-400' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Position */}
                        <td className="px-4 py-6 whitespace-nowrap">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-lg ${
                            position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                            position <= 4 ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' :
                            position >= sortedTeams.length - 2 && sortedTeams.length > 4 ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' :
                            'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                          }`}>
                            {position}
                          </div>
                        </td>

                        {/* Member Name */}
                        <td className="px-4 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-md"
                              style={{ backgroundColor: team.color || '#3B82F6' }}
                            ></div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 flex items-center">
                                {team.name}
                                {getPositionChange(team.name, position)}
                              </div>
                              {team.played > 0 && (
                                <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                                  <div 
                                    className="h-1 bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${winPercentage}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* PSN ID */}
                        <td className="px-4 py-6 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                          {team.psnId || '-'}
                        </td>

                        {/* Stats */}
                        <td className="px-3 py-6 whitespace-nowrap text-center text-sm text-gray-700 font-medium">
                          {team.played}
                        </td>
                        <td className="px-3 py-6 whitespace-nowrap text-center text-sm font-bold text-green-600">
                          {team.won}
                        </td>
                        <td className="px-3 py-6 whitespace-nowrap text-center text-sm font-bold text-yellow-600">
                          {team.drawn}
                        </td>
                        <td className="px-3 py-6 whitespace-nowrap text-center text-sm font-bold text-red-600">
                          {team.lost}
                        </td>
                        <td className="px-3 py-6 whitespace-nowrap text-center text-sm text-gray-700 font-medium">
                          {team.gf}
                        </td>
                        <td className="px-3 py-6 whitespace-nowrap text-center text-sm text-gray-700 font-medium">
                          {team.ga}
                        </td>
                        <td className={`px-3 py-6 whitespace-nowrap text-center text-sm font-bold ${
                          goalDiff > 0 ? 'text-green-600' : goalDiff < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {goalDiff > 0 ? '+' : ''}{goalDiff}
                        </td>

                        {/* Form */}
                        <td className="px-3 py-6 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  winPercentage >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                  winPercentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                  'bg-gradient-to-r from-red-400 to-red-500'
                                }`}
                                style={{ width: `${winPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="px-4 py-6 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-md">
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-8xl mb-6 animate-bounce">⚽</div>
                          <p className="text-2xl font-bold text-gray-800 mb-2">No members added yet</p>
                          <p className="text-gray-600 mb-6">Add members to get started with your league!</p>
                          {leagueStatus === 'active' && (
                            <button
                              onClick={() => setActiveTab('add-member')}
                              disabled={isLoading}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                            >
                              Add First Member
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {teams.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex items-center space-x-6 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-md"></div>
                      <span className="font-medium">Champion</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-md"></div>
                      <span className="font-medium">Top 4</span>
                    </div>
                    {teams.length > 4 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-md"></div>
                        <span className="font-medium">Bottom 2</span>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/match-history"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-bold transition-all duration-300 transform hover:scale-105"
                  >
                    <span>📊</span>
                    <span>View Match History</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Member Tab */}
        {activeTab === 'add-member' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span className="text-3xl">➕</span>
                  <span>Add Member to League</span>
                </h2>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {/* Member Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Select Member ({availableMembers.length} available)
                    </label>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300"
                      disabled={isLoading || availableMembers.length === 0}
                    >
                      <option value="">
                        {availableMembers.length === 0 
                          ? "No available members" 
                          : "Select a member..."}
                      </option>
                      {availableMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} {member.psnId && member.psnId !== member.name ? `(${member.psnId})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unavailable Members Info */}
                  {members.length > availableMembers.length && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-yellow-800 mb-2">
                        ℹ️ Members in Other Leagues:
                      </p>
                      <div className="space-y-1">
                        {members.filter(m => !availableMembers.includes(m)).map(member => {
                          const leagueName = getMemberLeague(member.id!);
                          const inCurrentLeague = teams.some(t => t.memberId === member.id);
                          return (
                            <p key={member.id} className="text-xs text-yellow-700">
                              • {member.name} - {inCurrentLeague ? 'Already in this league' : `In ${leagueName}`}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Members Message */}
                  {members.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                      <p className="text-blue-800 font-medium">
                        No members found. Please add members in the Players tab first.
                      </p>
                    </div>
                  )}

                  {/* Add Button */}
                  <button
                    onClick={handleAddMember}
                    disabled={isLoading || !selectedMemberId}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding Member...</span>
                      </div>
                    ) : (
                      'Add Member to League'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Match Tab */}
        {activeTab === 'add-match' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <span className="text-3xl">⚽</span>
                  <span>Add Match Result</span>
                </h2>
              </div>
              <div className="p-8">
                {teams.length >= 2 ? (
                  <MatchResultForm teams={teams.map((t) => t.name)} onSubmit={handleMatchSubmit} />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6">⚽</div>
                    <p className="text-xl text-gray-700 font-semibold mb-2">Need More Members</p>
                    <p className="text-gray-600 mb-8">You need at least 2 members to record a match result.</p>
                    {leagueStatus === 'active' && (
                      <button
                        onClick={() => setActiveTab('add-member')}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50"
                      >
                        Add Members First
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End League Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full">
                <span className="text-3xl">🏁</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                End League?
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                This will end <strong>"{leagueName}"</strong> and release all members to join other leagues. 
                The league history and standings will be preserved.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndLeague}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Ending...</span>
                    </div>
                  ) : (
                    'End League'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
                <span className="text-3xl animate-pulse">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Delete League?
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                This will permanently delete <strong>"{leagueName}"</strong> and all its teams, matches, and history. 
                This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLeague}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete League'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}