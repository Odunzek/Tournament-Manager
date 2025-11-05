"use client";

import React from "react";
import {
  moveUp,
  moveDown,
  saveRankingOrder,
  updateRankingFields,
} from "../../lib/rankingUtils";
import type { RankingEntry } from "../../lib/rankingUtils";

// helper for color tiers
function getRankGradient(rank: number) {
  if (rank <= 10) return "from-yellow-300 via-amber-400 to-orange-400";
  if (rank <= 20) return "from-indigo-400 via-blue-500 to-purple-500";
  if (rank <= 30) return "from-green-300 via-emerald-400 to-teal-500";
  return "from-gray-200 via-gray-300 to-gray-400";
}

type RankingCardProps = {
  player: RankingEntry;
  rankings: RankingEntry[];
  isAuthenticated: boolean;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
};

export default function RankingCard({
  player,
  rankings,
  isAuthenticated,
  showToast,
}: RankingCardProps) {
  // helper: reorder logic for manual jump
  const reorderRankings = (
    list: RankingEntry[],
    memberId: string,
    newRank: number
  ): RankingEntry[] => {
    const updated = [...list];
    const currentIdx = updated.findIndex((r) => r.memberId === memberId);
    if (currentIdx === -1) return list;

    const [moved] = updated.splice(currentIdx, 1);
    updated.splice(newRank - 1, 0, moved);

    return updated.map((r, i) => ({ ...r, rank: i + 1 }));
  };

  // helper: handle jump-to-rank action
  const handleJumpToRank = async (memberId: string, newRank: number) => {
    const reordered = reorderRankings(rankings, memberId, newRank);
    await saveRankingOrder(reordered.map((x) => x.memberId));
    showToast(`${player.name} moved to rank ${newRank}`, "success");
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-5 rounded-xl shadow-md bg-gradient-to-r ${getRankGradient(
        player.rank
      )} text-gray-900 transition-transform hover:scale-[1.01]`}
    >
      {/* Left side - rank + name */}
      <div className="flex items-center gap-3 mb-3 sm:mb-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/40 text-gray-900 font-bold">
          {player.rank}
        </div>
        <p className="font-semibold text-base sm:text-lg">{player.name}</p>
      </div>

      {/* Right side - cool off & wild card */}
      <div className="flex items-center gap-4 text-sm sm:text-base">
        {isAuthenticated ? (
          <>
            <input
              type="text"
              defaultValue={player.coolOff}
              onBlur={(e) =>
                updateRankingFields(player.memberId, {
                  coolOff: e.target.value,
                })
              }
              placeholder="Cool Off"
              className="px-2 py-1 rounded-lg border border-gray-300 bg-white/70 w-[3in] sm:w-28"
            />
            <input
              type="text"
              defaultValue={player.wildCard}
              onBlur={(e) =>
                updateRankingFields(player.memberId, {
                  wildCard: e.target.value,
                })
              }
              placeholder="Wild Card"
              className="px-2 py-1 rounded-lg border border-gray-300 bg-white/70 w-[10in] sm:w-28"
            />
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700"
                onClick={() =>
                  moveUp(rankings, player.memberId).then(() =>
                    showToast(`${player.name} moved up`)
                  )
                }
              >
                ↑
              </button>
              <button
                className="bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700"
                onClick={() =>
                  moveDown(rankings, player.memberId).then(() =>
                    showToast(`${player.name} moved down`)
                  )
                }
              >
                ↓
              </button>

              {/* Jump to rank dropdown */}
              <select
                value={player.rank}
                onChange={(e) =>
                  handleJumpToRank(player.memberId, parseInt(e.target.value))
                }
                className="border border-gray-300 bg-white/70 rounded px-2 py-1 text-xs"
              >
                {rankings.map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <span className="text-gray-800 font-medium">
              {player.coolOff || "—"}
            </span>
            <span className="text-gray-800 font-medium">
              {player.wildCard || "—"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
