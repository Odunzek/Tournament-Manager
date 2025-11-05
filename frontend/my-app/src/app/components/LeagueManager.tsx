"use client";

import { useState, useEffect } from "react";
import {
  getGroupMembers,
  GroupMember,
  subscribeToGroupMembers,
} from "../../lib/membershipUtils";
import LeagueCreator from "./leagues/LeagueCreator";
import LeagueList from "./leagues/LeagueList";
import TeamManager from "./leagues/TeamManager";
import DeleteConfirmModal from "./leagues/DeleteConfirmModal";

interface LeagueTeam {
  id: string;
  name: string;
  psnId: string;
}

export default function LeagueManager() {
  const [leagues, setLeagues] = useState<string[]>([]);
  const [currentLeague, setCurrentLeague] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedLeagues = JSON.parse(
      localStorage.getItem("leagueList") || "[]"
    );
    const activeLeague = localStorage.getItem("currentLeagueName") || "";

    setLeagues(storedLeagues);
    setCurrentLeague(activeLeague);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const loadedMembers = await getGroupMembers();
      setMembers(loadedMembers.filter((m) => m.isActive));
    };

    loadData();

    const unsubscribe = subscribeToGroupMembers((updatedMembers) => {
      const activeMembers = updatedMembers.filter((m) => m.isActive);
      setMembers(activeMembers);
    });

    return () => unsubscribe();
  }, []);

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
      alert("Invalid league name or league already exists");
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
    const updatedLeagues = leagues.filter((league) => league !== leagueName);
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
    if (!currentLeague) return;

    const selectedMember = members.find((m) => m.id === memberId);
    if (!selectedMember) {
      alert("Selected member not found");
      return;
    }

    if (
      leagueTeams.some(
        (team) => team.id === memberId || team.name === selectedMember.name
      )
    ) {
      alert("Member is already in this league");
      return;
    }

    setIsLoading(true);

    try {
      const newTeam: LeagueTeam = {
        id: selectedMember.id || memberId,
        name: selectedMember.name,
        psnId: selectedMember.psnId || selectedMember.name,
      };

      const updatedTeams = [...leagueTeams, newTeam];
      setLeagueTeams(updatedTeams);

      const teamsKey = `league_${currentLeague}_teams`;
      localStorage.setItem(teamsKey, JSON.stringify(updatedTeams));

      alert(`${selectedMember.name} added to league!`);
    } catch (error) {
      console.error("Error adding team:", error);
      alert("Failed to add team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    if (!currentLeague) return;

    const updatedTeams = leagueTeams.filter((team) => team.id !== teamId);
    setLeagueTeams(updatedTeams);

    const teamsKey = `league_${currentLeague}_teams`;
    localStorage.setItem(teamsKey, JSON.stringify(updatedTeams));
  };

  const availableMembers = members.filter((member) => {
    const alreadyInLeague = leagueTeams.some(
      (team) => team.id === member.id || team.name === member.name
    );
    return !alreadyInLeague;
  });

  if (!isLoaded) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6 text-black">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 text-black">
        <h2 className="text-lg sm:text-xl font-bold mb-3">🎮 League Manager</h2>

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
          <TeamManager
            leagueName={currentLeague}
            teams={leagueTeams}
            availableMembers={availableMembers}
            onAddTeam={handleAddTeam}
            onRemoveTeam={handleRemoveTeam}
            isLoading={isLoading}
          />
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
