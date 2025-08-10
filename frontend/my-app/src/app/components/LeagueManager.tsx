"use client";

import { useState, useEffect } from "react";
import { 
  getGroupMembers, 
  GroupMember,
  subscribeToGroupMembers  // Use real-time subscription like Tournament Manager
} from "../../lib/membershipUtils";
import LeagueCreator from './leagues/LeagueCreator';
import LeagueList from './leagues/LeagueList';
import TeamManager from './leagues/TeamManager';
import DeleteConfirmModal from './leagues/DeleteConfirmModal';

interface LeagueTeam {
  id: string;
  name: string;
  psnId: string;
}

export default function LeagueManager() {
  const [leagues, setLeagues] = useState<string[]>([]);
  const [currentLeague, setCurrentLeague] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load leagues from localStorage
  useEffect(() => {
    const storedLeagues = JSON.parse(localStorage.getItem("leagueList") || "[]");
    const activeLeague = localStorage.getItem("currentLeagueName") || "";

    setLeagues(storedLeagues);
    setCurrentLeague(activeLeague);
    setIsLoaded(true);
  }, []);

  // Subscribe to real-time member updates - EXACTLY LIKE TOURNAMENT MANAGER
  useEffect(() => {
    const loadData = async () => {
      // First load members immediately
      const loadedMembers = await getGroupMembers();
      setMembers(loadedMembers.filter(m => m.isActive));
    };

    loadData();
    
    // Then setup real-time listener for updates
    const unsubscribe = subscribeToGroupMembers((updatedMembers) => {
      // Only show active members
      const activeMembers = updatedMembers.filter(m => m.isActive);
      setMembers(activeMembers);
      console.log('League Manager - Members updated:', activeMembers.length);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Load league teams when current league changes
  useEffect(() => {
    if (currentLeague) {
      const teamsKey = `league_${currentLeague}_teams`;
      const storedTeams = JSON.parse(localStorage.getItem(teamsKey) || "[]");
      setLeagueTeams(storedTeams);
    } else {
      setLeagueTeams([]);
    }
  }, [currentLeague]);

  const handleCreateLeague = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || leagues.includes(trimmed)) {
      alert('Invalid league name or league already exists');
      return;
    }

    const updated = [...leagues, trimmed];
    setLeagues(updated);

    localStorage.setItem("leagueList", JSON.stringify(updated));
    localStorage.setItem("currentLeagueName", trimmed);
    setCurrentLeague(trimmed);
    window.location.reload();
  };

  const handleSwitchLeague = (name: string) => {
    localStorage.setItem("currentLeagueName", name);
    setCurrentLeague(name);
    window.location.reload();
  };

  const handleDeleteLeague = (leagueName: string) => {
    const updatedLeagues = leagues.filter(league => league !== leagueName);
    setLeagues(updatedLeagues);
    
    const teamsKey = `league_${leagueName}_teams`;
    const historyKey = `league_${leagueName}_history`;
    localStorage.removeItem(teamsKey);
    localStorage.removeItem(historyKey);
    
    localStorage.setItem("leagueList", JSON.stringify(updatedLeagues));
    
    if (currentLeague === leagueName) {
      if (updatedLeagues.length > 0) {
        const newCurrent = updatedLeagues[0];
        localStorage.setItem("currentLeagueName", newCurrent);
        setCurrentLeague(newCurrent);
      } else {
        localStorage.setItem("currentLeagueName", "");
        setCurrentLeague("");
      }
      window.location.reload();
    }
    
    setShowDeleteConfirm(null);
  };

  const handleAddTeam = (memberId: string) => {
    if (!currentLeague) {
      console.error('No current league selected');
      return;
    }

    // Find the selected member
    const selectedMember = members.find(m => m.id === memberId);
    if (!selectedMember) {
      console.error('Member not found:', memberId);
      alert('Selected member not found');
      return;
    }

    // Check if member is already in league (check by member ID, not team ID)
    if (leagueTeams.some(team => team.id === memberId || team.name === selectedMember.name)) {
      alert('Member is already in this league');
      return;
    }

    setIsLoading(true);

    try {
      const newTeam: LeagueTeam = {
        id: selectedMember.id || memberId,  // Use member ID as team ID
        name: selectedMember.name,
        psnId: selectedMember.psnId || selectedMember.name
      };

      const updatedTeams = [...leagueTeams, newTeam];
      setLeagueTeams(updatedTeams);

      const teamsKey = `league_${currentLeague}_teams`;
      localStorage.setItem(teamsKey, JSON.stringify(updatedTeams));

      console.log('Team added successfully:', newTeam);
      alert(`${selectedMember.name} added to league!`);

    } catch (error) {
      console.error('Error adding team:', error);
      alert('Failed to add team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    if (!currentLeague) return;

    const updatedTeams = leagueTeams.filter(team => team.id !== teamId);
    setLeagueTeams(updatedTeams);

    const teamsKey = `league_${currentLeague}_teams`;
    localStorage.setItem(teamsKey, JSON.stringify(updatedTeams));
  };

  // Filter available members (not already in the league)
  // Check both by ID and by name to be safe
  const availableMembers = members.filter(member => {
    const alreadyInLeague = leagueTeams.some(team => 
      team.id === member.id || team.name === member.name
    );
    return !alreadyInLeague;
  });

  // Debug logging
  useEffect(() => {
    console.log('=== League Manager Debug ===');
    console.log('Total members from DB:', members.length);
    console.log('Members:', members.map(m => ({ id: m.id, name: m.name })));
    console.log('Teams in current league:', leagueTeams.length);
    console.log('League teams:', leagueTeams.map(t => ({ id: t.id, name: t.name })));
    console.log('Available members to add:', availableMembers.length);
    console.log('Available:', availableMembers.map(m => ({ id: m.id, name: m.name })));
  }, [members, leagueTeams, availableMembers]);

  if (!isLoaded) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6 text-black">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow mb-6 text-black">
        <h2 className="text-lg font-bold mb-3">🎮 League Manager</h2>

        <LeagueCreator 
          onCreateLeague={handleCreateLeague}
          isLoading={isLoading}
        />

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Available Leagues:</h3>
          <LeagueList
            leagues={leagues}
            currentLeague={currentLeague}
            onSwitchLeague={handleSwitchLeague}
            onDeleteRequest={setShowDeleteConfirm}
          />
        </div>

        {currentLeague && (
          <>
            {/* Debug info - remove after testing */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-bold text-yellow-800">📊 Debug Info:</p>
              <p>Total Members in System: {members.length}</p>
              <p>Teams in Current League: {leagueTeams.length}</p>
              <p>Available to Add: {availableMembers.length}</p>
              {members.length === 0 && (
                <p className="text-red-600 font-bold mt-2">
                  ⚠️ No members found! Add members in the Players tab first.
                </p>
              )}
            </div>
            
            <TeamManager
              leagueName={currentLeague}
              teams={leagueTeams}
              availableMembers={availableMembers}
              onAddTeam={handleAddTeam}
              onRemoveTeam={handleRemoveTeam}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          leagueName={showDeleteConfirm}
          onConfirm={() => handleDeleteLeague(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}