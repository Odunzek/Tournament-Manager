"use client";

import React from "react";
import {
  moveUp,
  moveDown,
  saveRankingOrder,
  updateRankingFields,
} from "../../lib/rankingUtils";
import type { RankingEntry } from "../../lib/rankingUtils";
import CustomDropdown from "../../components/ui/CustomDropdown";

// helper for color tiers - cyber theme
function getRankGradient(rank: number) {
  if (rank <= 10) return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
  if (rank <= 20) return "from-cyber-500/20 to-electric-500/20 border-cyber-500/30";
  if (rank <= 30) return "from-green-500/20 to-emerald-500/20 border-green-500/30";
  return "from-gray-500/20 to-gray-600/20 border-gray-500/30";
}

function getRankIcon(rank: number) {
  if (rank === 1) return "👑";
  if (rank <= 3) return "🥇";
  if (rank <= 10) return "⭐";
  return "";
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

  const gradient = getRankGradient(player.rank);
  const icon = getRankIcon(player.rank);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-5 rounded-tech bg-gradient-to-r ${gradient} border backdrop-blur-sm transition-all duration-200 hover:shadow-light-cyber dark:hover:shadow-glow`}
    >
      {/* Left side - rank + name */}
      <div className="flex items-center gap-3 mb-3 sm:mb-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-tech bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 font-bold text-light-900 dark:text-white">
          {icon ? <span className="text-xl">{icon}</span> : player.rank}
        </div>
        <p className="font-semibold text-base sm:text-lg text-light-900 dark:text-white">{player.name}</p>
      </div>

      {/* Right side - cool off & wild card */}
      <div className="flex items-center gap-3 text-sm sm:text-base">
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
              className="px-3 py-1.5 rounded-tech border border-black/10 dark:border-white/10 bg-light-200/50 dark:bg-dark-100/50 text-light-900 dark:text-white placeholder-light-500 dark:placeholder-gray-500 w-24 sm:w-32 focus:outline-none focus:border-cyber-500/50"
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
              className="px-3 py-1.5 rounded-tech border border-black/10 dark:border-white/10 bg-light-200/50 dark:bg-dark-100/50 text-light-900 dark:text-white placeholder-light-500 dark:placeholder-gray-500 w-24 sm:w-32 focus:outline-none focus:border-cyber-500/50"
            />
            <div className="flex items-center gap-2">
              <button
                className="bg-cyber-500 hover:bg-cyber-600 text-white rounded-tech px-3 py-1.5 text-xs font-semibold transition-colors"
                onClick={() =>
                  moveUp(rankings, player.memberId).then(() =>
                    showToast(`${player.name} moved up`)
                  )
                }
              >
                ↑
              </button>
              <button
                className="bg-cyber-500 hover:bg-cyber-600 text-white rounded-tech px-3 py-1.5 text-xs font-semibold transition-colors"
                onClick={() =>
                  moveDown(rankings, player.memberId).then(() =>
                    showToast(`${player.name} moved down`)
                  )
                }
              >
                ↓
              </button>

              {/* Jump to rank dropdown */}
              <CustomDropdown
                value={player.rank}
                onChange={(newRank) => handleJumpToRank(player.memberId, Number(newRank))}
                options={rankings.map((_, i) => ({
                  value: i + 1,
                  label: `Rank #${i + 1}`,
                }))}
                className="w-28"
              />
            </div>
          </>
        ) : (
          <>
            <span className="text-light-700 dark:text-gray-300 font-medium px-3">
              {player.coolOff || "—"}
            </span>
            <span className="text-light-700 dark:text-gray-300 font-medium px-3">
              {player.wildCard || "—"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
