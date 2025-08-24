"use client";

import { subscribeToMatchesByLeagueId } from "../../lib/firebaseutils";
import type { Match } from "../../lib/firebase";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentLeague, setCurrentLeague] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "recent" | "team">("all");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [allTeams, setAllTeams] = useState<string[]>([]);

  useEffect(() => {
    const id = localStorage.getItem("currentLeagueId") || "";
    const leagueName = localStorage.getItem("currentLeagueName") || "";
    setCurrentLeague(leagueName);

    if (!id) return;

    const unsub = subscribeToMatchesByLeagueId(id, (firebaseMatches) => {
      const toMillis = (d: any) =>
        typeof d?.toDate === "function"
          ? d.toDate().getTime()
          : typeof d?.toMillis === "function"
          ? d.toMillis()
          : new Date(d).getTime();

      const sorted = [...firebaseMatches].sort(
        (a, b) => toMillis(b.date) - toMillis(a.date)
      );

      setMatches(sorted);

      const teams = new Set<string>();
      sorted.forEach((m) => {
        if (m.homeTeam) teams.add(m.homeTeam);
        if (m.awayTeam) teams.add(m.awayTeam);
      });
      setAllTeams(Array.from(teams).sort());
      setIsLoaded(true);
    });

    return () => unsub();
  }, []);

  const formatDate = (dateLike: any) => {
    const d =
      typeof dateLike?.toDate === "function"
        ? dateLike.toDate()
        : new Date(dateLike);
    return d.toLocaleString();
  };

  const getMatchResult = (match: Match) => {
    if (match.homeScore > match.awayScore) {
      return { winner: match.homeTeam, loser: match.awayTeam, isDraw: false };
    } else if (match.awayScore > match.homeScore) {
      return { winner: match.awayTeam, loser: match.homeTeam, isDraw: false };
    } else {
      return { winner: "", loser: "", isDraw: true };
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(match.date) >= oneWeekAgo;
    }
    if (filter === "team" && selectedTeam) {
      return match.homeTeam === selectedTeam || match.awayTeam === selectedTeam;
    }
    return true;
  });

  const getMatchStats = () => {
    const totalMatches = matches.length;
    const totalGoals = matches.reduce(
      (sum, match) => sum + match.homeScore + match.awayScore,
      0
    );
    const draws = matches.filter(
      (match) => match.homeScore === match.awayScore
    ).length;
    const avgGoalsPerMatch =
      totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : "0";

    return { totalMatches, totalGoals, draws, avgGoalsPerMatch };
  };

  const stats = getMatchStats();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[url('/images/Fc1.jpg')] bg-cover bg-center flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-24 sm:w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/Fc1.jpg')] bg-cover bg-center">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="flex items-center gap-2 justify-center text-2xl sm:text-4xl font-bold text-white mb-2">
            <Image
              src="/icons/matchhist.svg"
              alt="Match History"
              width={40}
              height={40}
              className="sm:w-[60px] sm:h-[60px]"
            />
            Match History
          </h1>
          {currentLeague && (
            <p className="text-lg sm:text-2xl font-bold text-white mb-4">
              {currentLeague} League
            </p>
          )}
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md hover:opacity-90 transition-colors duration-150 text-sm sm:text-base"
          >
            ← Back to League Table
          </Link>
        </div>

        {matches.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 sm:py-16">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12 max-w-md mx-auto">
              <div className="text-5xl sm:text-6xl mb-6">⚽</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                No Matches Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start playing matches to see the history here!
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                Add First Match
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-blue-200 rounded-xl shadow-lg p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                  {stats.totalMatches}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Total Matches
                </div>
              </div>
              <div className="bg-green-200 rounded-xl shadow-lg p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                  {stats.totalGoals}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Total Goals
                </div>
              </div>
              <div className="bg-yellow-200 rounded-xl shadow-lg p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
                  {stats.draws}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Draws
                </div>
              </div>
              <div className="bg-purple-200 rounded-xl shadow-lg p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                  {stats.avgGoalsPerMatch}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Avg Goals/Match
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/70 rounded-xl shadow-lg p-4 sm:p-6 mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                Filter Matches
              </h3>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors duration-150 ${
                    filter === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Matches
                </button>
                <button
                  onClick={() => setFilter("recent")}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors duration-150 ${
                    filter === "recent"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Last 7 Days
                </button>
                <select
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setFilter(e.target.value ? "team" : "all");
                  }}
                  className="bg-gray-100 border border-gray-300 text-gray-700 px-2 sm:px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Filter by team</option>
                  {allTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                Showing {filteredMatches.length} of {matches.length} matches
              </div>
            </div>

            {/* Match List */}
            <div className="space-y-3 sm:space-y-4">
              {filteredMatches.map((match, index) => {
                const result = getMatchResult(match);
                return (
                  <div
                    key={index}
                    className="bg-white/80 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
                            <div
                              className={`text-right flex-1 ${
                                result.winner === match.homeTeam
                                  ? "text-green-600 font-bold"
                                  : result.isDraw
                                  ? "text-yellow-600 font-semibold"
                                  : "text-gray-600"
                              }`}
                            >
                              <div className="text-base sm:text-lg font-medium">
                                {match.homeTeam}
                              </div>
                              {result.winner === match.homeTeam && (
                                <div className="text-xs text-green-500">
                                  WINNER
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 rounded-lg">
                              <span
                                className={`text-xl sm:text-2xl font-bold ${
                                  match.homeScore > match.awayScore
                                    ? "text-green-600"
                                    : match.homeScore === match.awayScore
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {match.homeScore}
                              </span>
                              <span className="text-gray-400 text-lg sm:text-xl">
                                -
                              </span>
                              <span
                                className={`text-xl sm:text-2xl font-bold ${
                                  match.awayScore > match.homeScore
                                    ? "text-green-600"
                                    : match.homeScore === match.awayScore
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {match.awayScore}
                              </span>
                            </div>

                            <div
                              className={`text-left flex-1 ${
                                result.winner === match.awayTeam
                                  ? "text-green-600 font-bold"
                                  : result.isDraw
                                  ? "text-yellow-600 font-semibold"
                                  : "text-gray-600"
                              }`}
                            >
                              <div className="text-base sm:text-lg font-medium">
                                {match.awayTeam}
                              </div>
                              {result.winner === match.awayTeam && (
                                <div className="text-xs text-green-500">
                                  WINNER
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-center mb-3 sm:mb-4">
                            {result.isDraw ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium">
                                🤝 Draw
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                                🏆 {result.winner} wins
                              </span>
                            )}
                          </div>

                          <div className="text-center text-xs sm:text-sm text-gray-500">
                            📅 {formatDate(match.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMatches.length === 0 && filter !== "all" && (
              <div className="text-center py-12">
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md mx-auto">
                  <div className="text-3xl sm:text-4xl mb-4">🔍</div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
