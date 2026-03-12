"use client";

import React, { useState } from "react";
import {
  Tournament,
  TournamentGroup,
  GroupMatch,
  getTournamentById,
  updateTournament,
} from "../../../lib/tournamentUtils";

// ============================
// 🧮 Helper: Recalculate Standings
// ============================
function recalcGroupStandings(group: TournamentGroup) {
  const standingsMap: Record<
    string,
    {
      teamName: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
    }
  > = {};

  // Initialize zeroed-out records
  group.members.forEach((m) => {
    standingsMap[m.name] = {
      teamName: m.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  // Update based on matches
  group.matches.forEach((match) => {
    if (!match.played) return;

    const home = standingsMap[match.homeTeam];
    const away = standingsMap[match.awayTeam];
    if (!home || !away) return;

    const hs = match.homeScore ?? 0;
    const as = match.awayScore ?? 0;

    home.played++;
    away.played++;

    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (hs < as) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  });

  const standings = Object.values(standingsMap).map((s, i) => ({
    ...s,
    memberId: s.teamName,
    position: i + 1,
  }));

  return standings;
}

// ============================
// 🏆 Tournament Groups Component
// ============================
interface TournamentGroupsProps {
  tournament: Tournament;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordMatch: (
    groupId: string,
    homeTeam: string,
    awayTeam: string
  ) => void;
  setSelectedTournament: (t: Tournament) => void;
}

export default function TournamentGroups({
  tournament,
  isLoading,
  isAuthenticated,
  onRecordMatch,
  setSelectedTournament,
}: TournamentGroupsProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [editingMatch, setEditingMatch] = useState<GroupMatch | null>(null);
  const [newHomeScore, setNewHomeScore] = useState("");
  const [newAwayScore, setNewAwayScore] = useState("");

  if (!tournament.groups || tournament.groups.length === 0) {
    return (
      <div className="text-center py-10 sm:py-12">
        <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🏆</div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
          No Groups Generated
        </h3>
        <p className="text-gray-500 text-sm sm:text-base">
          Groups will appear here once generated from the Overview tab.
        </p>
      </div>
    );
  }

  const totalMatchesPlayed = tournament.groups.reduce(
    (t, g) => t + g.matches.filter((m) => m.played).length,
    0
  );
  const totalMatches = tournament.groups.reduce(
    (t, g) => t + g.matches.length,
    0
  );

  // 🔔 Helper for showing toast
  const triggerToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h4 className="text-lg sm:text-xl font-bold text-gray-800">
            Group Stage ({tournament.groups.length} Groups)
          </h4>
          <div className="text-xs sm:text-sm text-gray-600">
            {totalMatchesPlayed} / {totalMatches} matches played
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {tournament.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              onRecordMatch={onRecordMatch}
              setEditingMatch={setEditingMatch}
            />
          ))}
        </div>
      </div>

      {/* 📝 Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Edit Match
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {editingMatch.homeTeam} vs {editingMatch.awayTeam}
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                try {
                  const freshTournament = await getTournamentById(tournament.id);
                  if (!freshTournament?.groups) return;

                  const updatedGroups = freshTournament.groups.map((group) => {
                    if (group.id !== editingMatch.groupId) return group;

                    const updatedMatches = group.matches.map((m) =>
                      m.id === editingMatch.id
                        ? {
                            ...m,
                            homeScore: parseInt(newHomeScore),
                            awayScore: parseInt(newAwayScore),
                            played: true,
                          }
                        : m
                    );

                    const updatedStandings = recalcGroupStandings({
                      ...group,
                      matches: updatedMatches,
                    });

                    return {
                      ...group,
                      matches: updatedMatches,
                      standings: updatedStandings,
                    };
                  });

                  await updateTournament(tournament.id, { groups: updatedGroups });

                  // ✅ Refresh instantly after update
                  const refreshed = await getTournamentById(tournament.id);
                  if (refreshed) setSelectedTournament(refreshed);

                  triggerToast("✅ Match and standings updated!", "success");
                  setEditingMatch(null);
                  setNewHomeScore("");
                  setNewAwayScore("");
                } catch (error) {
                  console.error("Error updating match:", error);
                  triggerToast("❌ Failed to update match", "error");
                }
              }}
              className="space-y-6"
            >
              <div className="flex gap-3 justify-center">
                <input
                  type="number"
                  min="0"
                  defaultValue={editingMatch.homeScore}
                  onChange={(e) => setNewHomeScore(e.target.value)}
                  className="w-20 text-center border-2 border-gray-200 rounded-lg py-2 text-lg font-bold text-gray-900"
                />
                <span className="text-xl font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={editingMatch.awayScore}
                  onChange={(e) => setNewAwayScore(e.target.value)}
                  className="w-20 text-center border-2 border-gray-200 rounded-lg py-2 text-lg font-bold text-gray-900"
                />
              </div>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔔 Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-500 ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}

// ============================
// Group Card
// ============================
function GroupCard({
  group,
  isLoading,
  isAuthenticated,
  onRecordMatch,
  setEditingMatch,
}: {
  group: TournamentGroup;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordMatch: (
    groupId: string,
    homeTeam: string,
    awayTeam: string
  ) => void;
  setEditingMatch: React.Dispatch<React.SetStateAction<GroupMatch | null>>;
}) {
  const playedMatches = group.matches.filter((m) => m.played).length;
  const totalMatches = group.matches.length;
  const completion = totalMatches ? (playedMatches / totalMatches) * 100 : 0;

  const sorted = [...group.standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4 gap-2">
        <h5 className="text-base sm:text-lg font-bold text-gray-800">
          {group.name}
        </h5>
        <div className="text-right">
          <div className="text-xs sm:text-sm text-blue-600 font-medium">
            {playedMatches}/{totalMatches} matches
          </div>
          <div className="w-20 sm:w-24 bg-blue-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Standings */}
      <div className="space-y-2 mb-5 sm:mb-6">
        <h6 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Standings
        </h6>
        <div className="-mx-2 sm:mx-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-[320px] px-2 sm:px-0 space-y-2">
            {sorted.map((s, i) => (
              <div
                key={s.teamName}
                className="flex items-center justify-between bg-white rounded-lg p-2.5 sm:p-3 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 2 ? "bg-green-500 text-white" : "bg-red-700"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="font-medium text-gray-900">
                    {s.teamName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-sm">
                  <span className="font-bold text-gray-900">
                    {s.points}pts
                  </span>
                  <span className="text-gray-900">{s.played}P</span>
                  <span className="text-green-600">{s.won}W</span>
                  <span className="text-yellow-600">{s.drawn}D</span>
                  <span className="text-red-600">{s.lost}L</span>
                  <span>
                    {s.goalDifference > 0 ? "+" : ""}
                    {s.goalDifference}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matches */}
      <div className="space-y-2">
        <h6 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Matches
        </h6>
        {group.matches.map((match, i) => (
          <MatchRow
            key={`${match.homeTeam}-${match.awayTeam}-${i}`}
            match={match}
            groupId={group.id}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            onRecordMatch={onRecordMatch}
            setEditingMatch={setEditingMatch}
          />
        ))}
      </div>
    </div>
  );
}

// ============================
// Match Row
// ============================
function MatchRow({
  match,
  groupId,
  isLoading,
  isAuthenticated,
  onRecordMatch,
  setEditingMatch,
}: {
  match: GroupMatch;
  groupId: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRecordMatch: (
    groupId: string,
    homeTeam: string,
    awayTeam: string
  ) => void;
  setEditingMatch: React.Dispatch<React.SetStateAction<GroupMatch | null>>;
}) {
  const abbr = (s: string) =>
    (s || "").replace(/\s+/g, "").slice(0, 3).toUpperCase();

  return (
    <div
      className={`rounded-xl border transition-colors p-3 sm:p-4 ${
        match.played ? "border-emerald-200" : "border-amber-200"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Home */}
        <div className="flex-1 text-right">
          <p className="truncate font-semibold text-gray-900">
            {abbr(match.homeTeam)}
          </p>
          {!match.played && (
            <p className="text-[11px] text-gray-400">HOME</p>
          )}
        </div>

        {/* Score */}
        <div
          className={`flex items-center justify-center rounded-lg border px-3 sm:px-4 py-1.5 sm:py-2 ${
            match.played ? "bg-emerald-50" : "bg-amber-50"
          }`}
        >
          {match.played ? (
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-2xl font-extrabold text-emerald-700">
                {match.homeScore}
              </span>
              <span className="text-gray-400 font-bold">-</span>
              <span className="text-lg sm:text-2xl font-extrabold text-emerald-700">
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-[12px] sm:text-sm font-medium text-amber-700">
              Not&nbsp;played
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 text-left">
          <p className="truncate font-semibold text-gray-900">
            {abbr(match.awayTeam)}
          </p>
          {!match.played && (
            <p className="text-[11px] text-gray-400">AWAY</p>
          )}
        </div>

        {/* Actions */}
        <div className="ml-1 sm:ml-2">
          {match.played ? (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] sm:text-xs font-semibold px-2 py-1">
                ✓
              </span>
              {isAuthenticated && (
                <button
                  onClick={() => setEditingMatch(match)}
                  className="text-[11px] sm:text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
              )}
            </div>
          ) : (
            isAuthenticated && (
              <button
                onClick={() =>
                  onRecordMatch(groupId, match.homeTeam, match.awayTeam)
                }
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded disabled:opacity-50"
              >
                Record
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
