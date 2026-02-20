"use client";

import React from "react";
import { motion } from "framer-motion";
import { GripVertical, Crown, Medal, Star } from "lucide-react";
import {
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

function getRankIcon(rank: number): React.ReactNode | null {
  if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />;
  if (rank <= 3) return <Medal className="w-4 h-4 text-cyan-400" />;
  if (rank <= 10) return <Star className="w-4 h-4 text-yellow-400" />;
  return null;
}

type DraggableRankingCardProps = {
  player: RankingEntry;
  index: number;
  rankings: RankingEntry[];
  isAuthenticated: boolean;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

export default function DraggableRankingCard({
  player,
  index,
  rankings,
  isAuthenticated,
  showToast,
  onReorder,
}: DraggableRankingCardProps) {
  const gradient = getRankGradient(player.rank);
  const icon = getRankIcon(player.rank);

  const [isDragging, setIsDragging] = React.useState(false);

  const handleJumpToRank = async (memberId: string, newRank: number) => {
    const currentIndex = rankings.findIndex((r) => r.memberId === memberId);
    if (currentIndex === -1) return;

    onReorder(currentIndex, newRank - 1);
    showToast(`${player.name} moved to rank ${newRank}`, "success");
  };

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile on mount
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      drag={isAuthenticated && !isDropdownOpen && !isMobile ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);

        // Calculate which position the card was dragged to
        const dragDistance = info.offset.y;
        const cardHeight = 80; // Approximate card height
        const positions = Math.round(dragDistance / cardHeight);

        if (positions !== 0) {
          const newIndex = Math.max(0, Math.min(rankings.length - 1, index + positions));
          if (newIndex !== index) {
            onReorder(index, newIndex);
            showToast(`${player.name} moved to rank ${newIndex + 1}`, "success");
          }
        }
      }}
      className={`cursor-${isAuthenticated && !isDropdownOpen && !isMobile ? 'grab' : 'default'} ${isDragging ? 'cursor-grabbing' : ''} ${isDropdownOpen ? 'relative z-[200]' : 'relative z-0'}`}
    >
      <div
        className={`flex flex-row items-center justify-between p-3 rounded-xl bg-gradient-to-r ${gradient} border backdrop-blur-sm transition-all duration-200 ${
          isDragging ? 'shadow-light-cyber dark:shadow-glow scale-105 opacity-80' : 'hover:shadow-light-cyber dark:hover:shadow-glow'
        }`}
      >
        {/* Left side - drag handle, rank + name */}
        <div className="flex items-center gap-3">
          {isAuthenticated && !isMobile && (
            <div className="cursor-grab active:cursor-grabbing text-light-600 dark:text-gray-400 hover:text-light-900 dark:hover:text-white transition-colors">
              <GripVertical className="w-5 h-5" />
            </div>
          )}

          <span className="text-xs font-bold text-light-500 dark:text-gray-400 w-5 text-right shrink-0">{player.rank}</span>
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-light-200/50 dark:bg-dark-100/50 border border-black/10 dark:border-white/10 font-bold text-light-900 dark:text-white text-sm">
            {icon ? icon : player.rank}
          </div>
          <p className="font-semibold text-sm text-light-900 dark:text-white">{player.name}</p>
        </div>

        {/* Right side - cool off & wild card */}
        <div className="flex items-center gap-2">
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
                className="px-2 py-1 rounded-xl border border-black/10 dark:border-white/10 bg-light-200/50 dark:bg-dark-100/50 text-light-900 dark:text-white placeholder-light-500 dark:placeholder-gray-500 w-14 sm:w-24 text-xs sm:text-sm focus:outline-none focus:border-cyber-500/50"
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
                className="px-2 py-1 rounded-xl border border-black/10 dark:border-white/10 bg-light-200/50 dark:bg-dark-100/50 text-light-900 dark:text-white placeholder-light-500 dark:placeholder-gray-500 w-14 sm:w-24 text-xs sm:text-sm focus:outline-none focus:border-cyber-500/50"
              />
              <div className="flex items-center">
                {/* Jump to rank dropdown */}
                <CustomDropdown
                  value={player.rank}
                  onChange={(newRank) => handleJumpToRank(player.memberId, Number(newRank))}
                  options={rankings.map((_, i) => ({
                    value: i + 1,
                    label: `Rank #${i + 1}`,
                  }))}
                  className="w-20 sm:w-24"
                  onOpenChange={setIsDropdownOpen}
                />
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-light-700 dark:text-gray-300 font-medium">
                {player.coolOff || "—"}
              </span>
              <span className="text-xs text-light-700 dark:text-gray-300 font-medium">
                {player.wildCard || "—"}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
