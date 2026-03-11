"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import MatchResultForm from "./MatchResultForm";
import {
  collection,
  onSnapshot,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  createTeam,
  updateTeamStats,
  saveMatch,
  subscribeToTeams,
  deleteLeague,
  updateLeague,
  editLeagueMatch,
} from "../../lib/firebaseutils";
import {
  getGroupMembers,
  subscribeToGroupMembers,
  GroupMember,
} from "../../lib/membershipUtils";
import { useAuth } from "../../lib/AuthContext";
import { deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";

// Types

type Team = {
  id?: string;
  memberId: string;
  name: string;
  psnId?: string;
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

type LeagueStatus = "active" | "ended";

interface LeagueTableProps {
  leagueName: string;
  leagueId: string;
}

// Toast notification
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 left-4 sm:left-auto z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl transform transition-all duration-500 max-w-sm sm:max-w-md ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : "bg-blue-500 text-white"
    }`}
  >
    <div className="flex items-center space-x-3">
      <span className="text-lg sm:text-xl">
        {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
      </span>
      <span className="font-medium text-sm sm:text-base flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 text-xl"
      >
        ×
      </button>
    </div>
  </div>
);

// Loading skeleton
const TableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xl overflow-hidden">
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 px-4 sm:px-6 py-3 sm:py-4">
      <div className="h-5 sm:h-6 bg-white bg-opacity-30 rounded w-32 sm:w-48"></div>
    </div>
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 sm:space-x-4 animate-pulse"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 h-3 sm:h-4 bg-gray-200 rounded"></div>
          <div className="w-6 h-3 sm:w-8 sm:h-4 bg-gray-200 rounded"></div>
          <div className="w-10 h-5 sm:w-12 sm:h-6 bg-gray-200 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);

// Mobile team card (original nicer UI)
const TeamCard = ({
  team,
  position,
  totalTeams,
}: {
  team: Team;
  position: number;
  totalTeams: number;
}) => {
  const goalDiff = team.gf - team.ga;
  const winPercentage = team.played === 0 ? 0 : (team.won / team.played) * 100;

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden mb-4 border-l-4 ${
        position === 1
          ? "border-yellow-400"
          : position <= 4
          ? "border-green-400"
          : position >= totalTeams - 1 && totalTeams > 4
          ? "border-red-400"
          : "border-gray-300"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                position === 1
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                  : position <= 4
                  ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                  : position >= totalTeams - 1 && totalTeams > 4
                  ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                  : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700"
              }`}
            >
              {position}
            </div>
            <div>
              <div className="font-bold text-gray-900 truncate max-w-[160px] sm:max-w-none">
                {team.name}
              </div>
              {team.psnId && (
                <div className="text-xs text-blue-600 truncate max-w-[160px] sm:max-w-none">
                  {team.psnId}
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-blue-600">
              {team.points}
            </div>
            <div className="text-xs text-gray-500">POINTS</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">P</div>
            <div className="font-bold text-sm">{team.played}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">W</div>
            <div className="font-bold text-sm text-green-600">{team.won}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">D</div>
            <div className="font-bold text-sm text-yellow-600">
              {team.drawn}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="text-xs text-gray-500">L</div>
            <div className="font-bold text-sm text-red-600">{team.lost}</div>
          </div>
        </div>

        {/* Goals & form */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4 text-sm">
              <span className="text-gray-600">
                GF: <span className="font-bold">{team.gf}</span>
              </span>
              <span className="text-gray-600">
                GA: <span className="font-bold">{team.ga}</span>
              </span>
              <span
                className={`font-bold ${
                  goalDiff > 0
                    ? "text-green-600"
                    : goalDiff < 0
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
              >
                GD: {goalDiff > 0 ? "+" : ""}
                {goalDiff}
              </span>
            </div>
            {team.played > 0 && (
              <div className="flex items-center space-x-1 shrink-0">
                <span className="text-xs text-gray-500">Form</span>
                <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      winPercentage >= 70
                        ? "bg-green-500"
                        : winPercentage >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${winPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// MAIN COMPONENT
export default function LeagueTable({
  leagueName,
  leagueId,
}: LeagueTableProps) {
  const { isAuthenticated, setShowAuthModal } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<
    "table" | "add-member" | "add-match"
  >("table");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [leagueStatus, setLeagueStatus] = useState<LeagueStatus>("active");
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [previousPositions, setPreviousPositions] = useState<{
    [key: string]: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [otherLeagues, setOtherLeagues] = useState<any[]>([]);

  // NEW: matches + edit state
  const [matches, setMatches] = useState<DocumentData[]>([]);
  const [editingMatch, setEditingMatch] = useState<DocumentData | null>(null);
  const [newHomeScore, setNewHomeScore] = useState("");
  const [newAwayScore, setNewAwayScore] = useState("");

  // Colors for team dots
  const teamColors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#84CC16",
  ];

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
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

  // Load league status
  useEffect(() => {
    const status =
      localStorage.getItem(`league_${leagueId}_status`) || "active";
    setLeagueStatus(status as LeagueStatus);
  }, [leagueId]);

  // Load all leagues to enforce member uniqueness
  useEffect(() => {
    const allLeagues = JSON.parse(localStorage.getItem("leagueList") || "[]");
    const leaguesData = allLeagues.map((name: string) => {
      const teamsKey = `league_${name}_teams`;
      const statusKey = `league_${name}_status`;
      const teams = JSON.parse(localStorage.getItem(teamsKey) || "[]");
      const status = localStorage.getItem(statusKey) || "active";
      return { name, teams, status };
    });
    setOtherLeagues(leaguesData);
  }, []);

  // Members subscription
  useEffect(() => {
    const loadMembers = async () => {
      const loadedMembers = await getGroupMembers();
      setMembers(loadedMembers.filter((m) => m.isActive));
    };

    loadMembers();

    const unsubscribe = subscribeToGroupMembers((updatedMembers) => {
      const active = updatedMembers.filter((m) => m.isActive);
      setMembers(active);
    });

    return () => unsubscribe();
  }, []);

  // Teams subscription
  useEffect(() => {
    if (!leagueId) {
      setIsLoaded(true);
      return;
    }

    const unsubscribe = subscribeToTeams(leagueId, (firebaseTeams: any[]) => {
      const formatted: Team[] = firebaseTeams.map((team, index) => ({
        id: team.id,
        memberId: team.memberId || team.id,
        name: team.name,
        psnId: team.psnId,
        played: team.played || 0,
        won: team.won || 0,
        drawn: team.drawn || 0,
        lost: team.lost || 0,
        gf: team.goalsFor || 0,
        ga: team.goalsAgainst || 0,
        points: team.points || 0,
        color: teamColors[index % teamColors.length],
        leagueId: team.leagueId,
      }));

      const positions: { [key: string]: number } = {};
      formatted.forEach((t, i) => {
        positions[t.name] = i + 1;
      });

      setPreviousPositions(positions);
      setTeams(formatted);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [leagueId]);

  // NEW: subscribe to matches
  useEffect(() => {
    if (!leagueId) return;

    const q = query(
      collection(db, "matches"),
      where("leagueId", "==", leagueId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: DocumentData[] = snap.docs
        .map((d) => {
          const data = d.data();
          const rawDate = data.date;
          const date =
            rawDate?.toDate?.() ?? (rawDate ? new Date(rawDate) : new Date());
          return { id: d.id, ...data, date };
        })
        .sort(
          (a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()
        );
      setMatches(rows);
    });

    return () => unsubscribe();
  }, [leagueId]);

  // Helpers
  const getWinPercentage = (team: Team) =>
    team.played === 0 ? 0 : (team.won / team.played) * 100;

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });

  const getPositionChange = (name: string, currentPos: number) => {
    const prev = previousPositions[name];
    if (!prev || prev === currentPos) return null;
    return prev > currentPos ? (
      <span className="text-green-500 text-xs ml-1">↗</span>
    ) : (
      <span className="text-red-500 text-xs ml-1">↘</span>
    );
  };

  const availableMembers = members.filter((member) => {
    const inCurrent = teams.some(
      (t) => t.memberId === member.id || t.name === member.name
    );
    if (inCurrent) return false;

    const inOtherActive = otherLeagues.some((league) => {
      if (league.name === leagueName) return false;
      if (league.status === "ended") return false;
      return league.teams.some(
        (t: any) => t.id === member.id || t.name === member.name
      );
    });

    return !inOtherActive;
  });

  // Actions
  const handleAddMember = async () => {
    if (!requireAuth()) return;

    if (!selectedMemberId) {
      showToast("Please select a member", "error");
      return;
    }

    if (!leagueId) {
      showToast("No league selected", "error");
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) {
      showToast("Member not found", "error");
      return;
    }

    setIsLoading(true);
    try {
      await createTeam(leagueId, member.name, {
        memberId: member.id,
        psnId: member.psnId,
      });

      const teamsKey = `league_${leagueName}_teams`;
      const currentTeams = JSON.parse(localStorage.getItem(teamsKey) || "[]");
      currentTeams.push({
        id: member.id,
        memberId: member.id,
        name: member.name,
        psnId: member.psnId,
      });
      localStorage.setItem(teamsKey, JSON.stringify(currentTeams));

      setSelectedMemberId("");
      showToast(`${member.name} added to league!`, "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to add member", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchSubmit = async (data: {
    team1: string;
    team2: string;
    score1: number;
    score2: number;
  }) => {
    if (!requireAuth()) return;

    if (!leagueId) {
      showToast("No league selected", "error");
      return;
    }

    const { team1, team2, score1, score2 } = data;

    const t1 = teams.find((t) => t.name === team1);
    const t2 = teams.find((t) => t.name === team2);

    if (!t1 || !t2 || !t1.id || !t2.id) {
      showToast("Teams not found", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Save match document
      await saveMatch({
        leagueId,
        leagueName,
        homeTeam: team1,
        awayTeam: team2,
        homeScore: score1,
        awayScore: score2,
        date: new Date(),
      });

      // Update stats
      const t1GF = t1.gf + score1;
      const t1GA = t1.ga + score2;
      const t1Won = t1.won + (score1 > score2 ? 1 : 0);
      const t1Drawn = t1.drawn + (score1 === score2 ? 1 : 0);
      const t1Lost = t1.lost + (score1 < score2 ? 1 : 0);
      const t1Pts =
        t1.points + (score1 > score2 ? 3 : score1 === score2 ? 1 : 0);

      const t2GF = t2.gf + score2;
      const t2GA = t2.ga + score1;
      const t2Won = t2.won + (score2 > score1 ? 1 : 0);
      const t2Drawn = t2.drawn + (score1 === score2 ? 1 : 0);
      const t2Lost = t2.lost + (score2 < score1 ? 1 : 0);
      const t2Pts =
        t2.points + (score2 > score1 ? 3 : score1 === score2 ? 1 : 0);

      await Promise.all([
        updateTeamStats(t1.id, {
          played: t1.played + 1,
          won: t1Won,
          drawn: t1Drawn,
          lost: t1Lost,
          goalsFor: t1GF,
          goalsAgainst: t1GA,
          goalDifference: t1GF - t1GA,
          points: t1Pts,
        }),
        updateTeamStats(t2.id, {
          played: t2.played + 1,
          won: t2Won,
          drawn: t2Drawn,
          lost: t2Lost,
          goalsFor: t2GF,
          goalsAgainst: t2GA,
          goalDifference: t2GF - t2GA,
          points: t2Pts,
        }),
      ]);

      const result =
        score1 === score2
          ? "Draw"
          : score1 > score2
          ? `${team1} wins`
          : `${team2} wins`;
      showToast(`Match result recorded: ${result}`, "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to save match result", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndLeague = async () => {
    if (!requireAuth()) return;

    setIsLoading(true);
    try {
      localStorage.setItem(`league_${leagueId}_status`, "ended");
      setLeagueStatus("ended");

      if (leagueId) {
        await updateLeague(leagueId, {
          status: "ended",
          endedAt: new Date(),
        });
      }

      setShowEndConfirm(false);
      showToast(
        "League ended. Members are now available for other leagues.",
        "success"
      );
    } catch (e) {
      console.error(e);
      showToast("Failed to end league", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLeague = async () => {
    if (!requireAuth()) return;

    if (!leagueId) {
      showToast("No league selected", "error");
      return;
    }

    setIsLoading(true);
    try {
      await deleteLeague(leagueId);

      localStorage.removeItem(`league_${leagueName}_teams`);
      localStorage.removeItem(`league_${leagueId}_status`);

      setTeams([]);
      setShowDeleteConfirm(false);
      setActiveTab("table");
      showToast("League deleted successfully", "success");

      window.location.href = "/";
    } catch (e) {
      console.error(e);
      showToast("Failed to delete league", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Render
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="h-8 sm:h-12 bg-gray-200 rounded w-48 sm:w-64 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="w-20 sm:w-24 h-1 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* HEADER */}
        <div className="mb-6 sm:mb-8 text-center relative">
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-white bg-clip-text text-transparent mb-3 sm:mb-4 leading-snug px-4">
              {leagueName || "League"} Table
            </h1>
            {leagueStatus === "ended" && (
              <span className="absolute -top-2 -right-2 sm:top-0 sm:-right-20 bg-gray-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-bold">
                ENDED
              </span>
            )}
          </div>

          {/* HEADER ACTIONS */}
          {teams.length > 0 && (
            <div className="mt-4 sm:mt-0 sm:absolute sm:top-0 sm:right-0 flex flex-col sm:flex-row gap-2">
              {leagueStatus === "active" && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={isLoading}
                  className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🏁</span>
                    <span>End League</span>
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span className="group-hover:rotate-12 transition-transform duration-300">
                    🗑️
                  </span>
                  <span>Clear League</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="px-3 sm:px-6 max-w-full">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {[
                {
                  id: "table",
                  label: "Table",
                  icon: "/icons/leaguesTable.svg",
                  size: 30,
                  disabled: false,
                },
                {
                  id: "add-member",
                  label: "Add",
                  icon: "/icons/addplayers.svg",
                  size: 38,
                  disabled: leagueStatus === "ended",
                },
                {
                  id: "add-match",
                  label: "Match",
                  icon: "/icons/addmatches.svg",
                  size: 38,
                  disabled: leagueStatus === "ended",
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                    disabled={isLoading || tab.disabled}
                    className={[
                      "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 sm:px-6 sm:py-3 font-semibold",
                      "shadow-sm ring-1 ring-white/10 shrink-0 overflow-hidden whitespace-nowrap",
                      "transition-[background,box-shadow,transform] duration-200",
                      "hover:scale-100 sm:hover:scale-[1.03]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                      tab.disabled
                        ? "text-gray-400 bg-gray-100"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-white hover:bg-white/15",
                    ].join(" ")}
                  >
                    <Image
                      src={tab.icon}
                      alt={`${tab.label} icon`}
                      width={tab.size}
                      height={tab.size}
                      className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none"
                    />
                    <span className="hidden sm:inline text-base">
                      {tab.label}
                    </span>
                    <span className="sm:hidden text-xs">
                      {tab.id === "table"
                        ? "Table"
                        : tab.id === "add-member"
                        ? "Add"
                        : "Match"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TABLE TAB */}
        {activeTab === "table" && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            {/* table header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                  <span className="text-2xl sm:text-3xl">🏆</span>
                  <span>Current Standings</span>
                </h2>
                {teams.length > 0 && (
                  <div className="text-white/80 text-xs sm:text-sm">
                    {teams.length} Members •{" "}
                    {teams.reduce((sum, t) => sum + t.played, 0)} Matches
                  </div>
                )}
              </div>
            </div>

            {/* mobile cards */}
            <div className="block md:hidden p-4">
              {sortedTeams.map((team, index) => (
                <TeamCard
                  key={team.id || team.name}
                  team={team}
                  position={index + 1}
                  totalTeams={sortedTeams.length}
                />
              ))}
              {teams.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-6xl mb-4 animate-bounce">⚽</div>
                  <p className="text-xl font-bold text-gray-800 mb-2">
                    No members added yet
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Add members to get started!
                  </p>
                  {leagueStatus === "active" && (
                    <button
                      onClick={() => setActiveTab("add-member")}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      Add First Member
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* desktop table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    {[
                      "Pos",
                      "Member",
                      "PSN ID",
                      "P",
                      "W",
                      "D",
                      "L",
                      "GF",
                      "GA",
                      "GD",
                      "Form",
                      "Pts",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedTeams.map((team, index) => {
                    const goalDiff = team.gf - team.ga;
                    const position = index + 1;
                    const winPct = getWinPercentage(team);

                    return (
                      <tr
                        key={team.id || team.name}
                        className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 transform hover:scale-[1.02] ${
                          position === 1
                            ? "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-l-4 border-yellow-400"
                            : position <= 4
                            ? "bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-l-4 border-green-400"
                            : position >= sortedTeams.length - 2 &&
                              sortedTeams.length > 4
                            ? "bg-gradient-to-r from-red-50 via-rose-50 to-red-100 border-l-4 border-red-400"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-6 whitespace-nowrap">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-lg ${
                              position === 1
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                                : position <= 4
                                ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                : position >= sortedTeams.length - 2 &&
                                  sortedTeams.length > 4
                                ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                                : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700"
                            }`}
                          >
                            {position}
                          </div>
                        </td>
                        <td className="px-4 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-md"
                              style={{
                                backgroundColor: team.color || "#3B82F6",
                              }}
                            ></div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 flex items-center">
                                {team.name}
                                {getPositionChange(team.name, position)}
                                {isAuthenticated && (
                                  <button
                                    onClick={async () => {
                                      const confirmDelete = confirm(
                                        `Remove ${team.name} and their matches from league?`
                                      );
                                      if (!confirmDelete) return;

                                      try {
                                        // Step 1: Delete the team
                                        await deleteDoc(
                                          doc(db, "teams", team.id)
                                        );

                                        // Step 2: Delete matches involving this player
                                        const matchesRef = collection(
                                          db,
                                          "matches"
                                        );
                                        const q = query(
                                          matchesRef,
                                          where("leagueId", "==", leagueId)
                                        );
                                        const snap = await getDocs(q);

                                        const batch = writeBatch(db);
                                        snap.forEach((matchDoc) => {
                                          const match = matchDoc.data();
                                          if (
                                            match.homeTeam === team.name ||
                                            match.awayTeam === team.name
                                          ) {
                                            batch.delete(matchDoc.ref);
                                          }
                                        });
                                        await batch.commit();

                                        showToast(
                                          `${team.name} and related matches removed`,
                                          "success"
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Error deleting player:",
                                          error
                                        );
                                        showToast(
                                          "Failed to delete player and matches",
                                          "error"
                                        );
                                      }
                                    }}
                                    className="ml-3 text-red-500 hover:text-red-700 text-xs font-semibold"
                                  >
                                    🗑️ Remove
                                  </button>
                                )}
                              </div>
                              {team.played > 0 && (
                                <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                                  <div
                                    className="h-1 bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${winPct}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                          {team.psnId || "-"}
                        </td>
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
                        <td
                          className={`px-3 py-6 whitespace-nowrap text-center text-sm font-bold ${
                            goalDiff > 0
                              ? "text-green-600"
                              : goalDiff < 0
                              ? "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          {goalDiff > 0 ? "+" : ""}
                          {goalDiff}
                        </td>
                        <td className="px-3 py-6 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  winPct >= 70
                                    ? "bg-gradient-to-r from-green-400 to-green-500"
                                    : winPct >= 40
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                    : "bg-gradient-to-r from-red-400 to-red-500"
                                }`}
                                style={{ width: `${winPct}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
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
                      <td
                        colSpan={12}
                        className="px-6 py-16 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-8xl mb-6 animate-bounce">⚽</div>
                          <p className="text-2xl font-bold text-gray-800 mb-2">
                            No members added yet
                          </p>
                          <p className="text-gray-600 mb-6">
                            Add members to get started with your league!
                          </p>
                          {leagueStatus === "active" && (
                            <button
                              onClick={() => setActiveTab("add-member")}
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

            {/* legend footer */}
            {teams.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-6 text-xs text-gray-600">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-md"></div>
                      <span className="font-medium">Champion</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-md"></div>
                      <span className="font-medium">Top 4</span>
                    </div>
                    {teams.length > 4 && (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-md"></div>
                        <span className="font-medium">Bottom 2</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD MEMBER TAB */}
        {activeTab === "add-member" && (
          <div className="max-w-lg mx-auto px-4 sm:px-0">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-blue-600 px-6 sm:px-8 py-4 sm:py-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
                  <span className="text-2xl sm:text-3xl">
                    <Image
                      src="/icons/plus.svg"
                      alt="Add Icon"
                      width={24}
                      height={24}
                      className="sm:w-7 sm:h-7"
                    />
                  </span>
                  <span>Add Member to League</span>
                </h2>
              </div>
              <div className="p-6 sm:p-8">
                <div className="space-y-6">
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
                          {member.name}{" "}
                          {member.psnId && member.psnId !== member.name
                            ? `(${member.psnId})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {members.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 text-center">
                      <p className="text-blue-800 font-medium text-sm">
                        No members found. Please add members in the Players tab
                        first.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAddMember}
                    disabled={isLoading || !selectedMemberId}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding Member...</span>
                      </div>
                    ) : (
                      "Add Member to League"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD MATCH TAB */}
        {activeTab === "add-match" && (
          <div className="max-w-lg mx-auto px-4 sm:px-0">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 px-6 sm:px-8 py-4 sm:py-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
                  <Image
                    src="/icons/football.svg"
                    alt="Ball Icon"
                    width={24}
                    height={24}
                    className="sm:w-7 sm:h-7"
                  />
                  <span>Add Match Result</span>
                </h2>
              </div>
              <div className="p-6 sm:p-8">
                {teams.length >= 2 ? (
                  <MatchResultForm
                    teams={teams.map((t) => t.name)}
                    onSubmit={handleMatchSubmit}
                  />
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="flex justify-center mb-4 sm:mb-6">
                      <Image
                        src="/icons/football.svg"
                        alt="Ball Icon"
                        width={48}
                        height={48}
                        className="animate-bounce drop-shadow-lg sm:w-14 sm:h-14"
                      />
                    </div>
                    <p className="text-lg sm:text-xl text-gray-700 font-semibold mb-2">
                      Need More Members
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                      You need at least 2 members to record a match result.
                    </p>
                    {leagueStatus === "active" && (
                      <button
                        onClick={() => setActiveTab("add-member")}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50 text-sm sm:text-base"
                      >
                        Add Members First
                      </button>
                    )}
                  </div>
                )}

                {/* PAST RESULTS + EDIT */}
                {matches.length > 0 && (
                  <div className="mt-8 border-t border-gray-200 pt-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>🕓</span>
                      <span>Recent Results</span>
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {matches.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">
                              {m.homeTeam} {m.homeScore} - {m.awayScore}{" "}
                              {m.awayTeam}
                            </span>
                            {m.date && (
                              <span className="text-[11px] sm:text-xs text-gray-500">
                                {new Date(m.date as Date).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {isAuthenticated && (
                            <button
                              onClick={() => {
                                setEditingMatch(m);
                                setNewHomeScore(
                                  m.homeScore != null ? String(m.homeScore) : ""
                                );
                                setNewAwayScore(
                                  m.awayScore != null ? String(m.awayScore) : ""
                                );
                              }}
                              className="text-xs sm:text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg font-medium"
                            >
                              ✏️ Edit
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MATCH MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
                Edit Result
              </h3>
              {/* Select teams */}
              <div className="flex justify-between gap-3 mb-4">
                <select
                  value={editingMatch.homeTeam}
                  onChange={(e) =>
                    setEditingMatch({
                      ...editingMatch,
                      homeTeam: e.target.value,
                    })
                  }
                  className="flex-1 border-2 border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-800"
                >
                  {teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <span className="text-lg font-bold text-gray-700 self-center">
                  vs
                </span>

                <select
                  value={editingMatch.awayTeam}
                  onChange={(e) =>
                    setEditingMatch({
                      ...editingMatch,
                      awayTeam: e.target.value,
                    })
                  }
                  className="flex-1 border-2 border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-800"
                >
                  {teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit scores */}
              <div className="flex justify-center gap-3 mb-6">
                <input
                  type="number"
                  min={0}
                  value={newHomeScore}
                  onChange={(e) => setNewHomeScore(e.target.value)}
                  placeholder={editingMatch.homeScore?.toString() || "Home"}
                  className="w-20 sm:w-24 text-center border-2 border-gray-300 rounded-lg py-2 text-lg font-bold text-gray-900"
                />
                <span className="text-xl font-bold">-</span>
                <input
                  type="number"
                  min={0}
                  value={newAwayScore}
                  onChange={(e) => setNewAwayScore(e.target.value)}
                  placeholder={editingMatch.awayScore?.toString() || "Away"}
                  className="w-20 sm:w-24 text-center border-2 border-gray-300 rounded-lg py-2 text-lg font-bold text-gray-900"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setEditingMatch(null);
                    setNewHomeScore("");
                    setNewAwayScore("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!requireAuth()) return;

                    const home =
                      newHomeScore.trim() === ""
                        ? editingMatch.homeScore
                        : parseInt(newHomeScore, 10);
                    const away =
                      newAwayScore.trim() === ""
                        ? editingMatch.awayScore
                        : parseInt(newAwayScore, 10);

                    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
                      showToast("Enter valid scores", "error");
                      return;
                    }

                    try {
                      setIsLoading(true);
                      await editLeagueMatch(
                        leagueId,
                        editingMatch.id,
                        home,
                        away,
                        editingMatch.homeTeam,
                        editingMatch.awayTeam
                      );
                      setEditingMatch(null);
                      setNewHomeScore("");
                      setNewAwayScore("");
                      showToast("Match updated", "success");
                    } catch (e) {
                      console.error(e);
                      showToast("Failed to update match", "error");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* END LEAGUE MODAL */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-orange-100 rounded-full">
                <span className="text-2xl sm:text-3xl">🏁</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
                End League?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 leading-relaxed px-4">
                This will end <strong>"{leagueName}"</strong> and release all
                members to join other leagues. The league history and standings
                will be preserved.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndLeague}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Ending...</span>
                    </div>
                  ) : (
                    "End League"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE LEAGUE MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                <span className="text-2xl sm:text-3xl">
                  <Image
                    src="/icons/danger.svg"
                    alt="Delete Icon"
                    width={28}
                    height={28}
                    className="sm:w-8 sm:h-8"
                  />
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
                Delete League?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 leading-relaxed px-4">
                This will permanently delete <strong>"{leagueName}"</strong> and
                all its teams, matches, and history. This action cannot be
                undone.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLeague}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    "Delete League"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
