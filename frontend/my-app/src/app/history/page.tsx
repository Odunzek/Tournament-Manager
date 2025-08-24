"use client";

import { useEffect, useState } from "react";

// Match history type
type Match = {
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  date: string;
};

export default function MatchHistoryPage() {
  const [leagueName, setLeagueName] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const current = localStorage.getItem("currentLeagueName");
    if (current) {
      setLeagueName(current);
      const key = `league_${current}_history`;
      const history = localStorage.getItem(key);
      if (history) setMatches(JSON.parse(history));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-6 sm:mb-8">
          📜 Match History {leagueName ? `– ${leagueName}` : "– No League Selected"}
        </h1>

        {matches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8 text-center">
            <div className="text-5xl mb-4">⚽</div>
            <p className="text-gray-700 text-sm sm:text-base">
              No matches recorded for this league.
            </p>
          </div>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {matches.map((match, index) => (
              <li
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Teams + Score (responsive, truncates long names) */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="flex-1 min-w-0 text-right sm:text-left">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[48vw] sm:max-w-xs">
                        {match.team1}
                      </div>
                    </div>

                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border bg-gray-50 border-gray-200 flex items-center gap-2">
                      <span className="text-base sm:text-xl font-bold text-gray-800">
                        {match.score1}
                      </span>
                      <span className="text-gray-400 font-bold">-</span>
                      <span className="text-base sm:text-xl font-bold text-gray-800">
                        {match.score2}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[48vw] sm:max-w-xs">
                        {match.team2}
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs sm:text-sm text-gray-600 sm:text-right">
                    {new Date(match.date).toLocaleDateString()}{" "}
                    {new Date(match.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
