"use client";

import React, { useEffect, useState } from "react";
import {
  RankingEntry,
  ensureRankingsForAllPlayers,
  subscribeToRankings,
  saveRankingOrder,
} from "../../lib/rankingUtils";
import { useAuth } from "../../lib/AuthContext";
import { Trophy, Info, Settings, Swords, Gamepad2, Crown, ShieldCheck, Medal, Star } from "lucide-react";
import DraggableRankingCard from "./DraggableRankingCard";
import RuleSectionCard from "./RuleSectionCard";

const RULE_SECTIONS = [
  {
    id: "setup",
    title: "Initial Setup",
    icon: <Settings className="w-4 h-4" />,
    content: `1. Players should notify Admin if they decide to opt out.\n2. New joiners or inactive members start from the bottom.\n3. Ranking is based on Admin's view of abilities, tournament victories, and current form.`,
  },
  {
    id: "challenges",
    title: "Challenge Rules",
    icon: <Swords className="w-4 h-4" />,
    content: `1. A player can challenge another up to 5 ranks above them.\n2. Players can use one Wildcard per tournament to challenge up to 10 ranks higher.\n3. Losing a wildcard challenge moves you down 6 ranks.\n4. Top 10 players can only challenge within 3 spots.`,
  },
  {
    id: "matches",
    title: "Match Format",
    icon: <Gamepad2 className="w-4 h-4" />,
    content: `1. Best of 3 games per challenge.\n2. Challenged player picks first team; challenger must match star rating.\n3. Alternate home/away after each match.\n4. If tied, play until a winner emerges.`,
  },
  {
    id: "top10",
    title: "Top 10 Rules",
    icon: <Crown className="w-4 h-4" />,
    content: `1. Challenges can only occur within 3 spots.\n2. Losing a top 10 challenge means dropping 3 spots.`,
  },
  {
    id: "admin",
    title: "Admin Rights",
    icon: <ShieldCheck className="w-4 h-4" />,
    content: `The Admin reserves the right to amend or interpret these rules as necessary.`,
  },
];

function RulesSidebar() {
  return (
    <div className="lg:sticky lg:top-6">
      <div className="bg-light-200/30 dark:bg-dark-100/30 border border-black/10 dark:border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyber-500/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-cyber-400" />
          </div>
          <h3 className="text-lg font-bold text-light-900 dark:text-white">Challenge Rules</h3>
        </div>
        <div className="space-y-2">
          {RULE_SECTIONS.map((section) => (
            <RuleSectionCard
              key={section.id}
              {...section}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RankingManager() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    ensureRankingsForAllPlayers().then(() => {
      const unsubscribe = subscribeToRankings(setRankings);
      setLoading(false);
      return unsubscribe;
    });
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const reordered = [...rankings];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setRankings(reordered);

    try {
      await saveRankingOrder(reordered.map((r) => r.memberId));
    } catch (error) {
      console.error("Error saving rank order:", error);
      showToast("Failed to save ranking order", "error");
    }
  };

  const renderRankings = () => {
    if (loading) {
      return (
        <div className="text-center py-16">
          <div className="inline-block w-12 h-12 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-light-600 dark:text-gray-400 font-medium">Loading rankings...</p>
        </div>
      );
    }

    if (rankings.length === 0) {
      return (
        <div className="text-center py-16 bg-light-200/30 dark:bg-dark-100/30 rounded-2xl border border-black/10 dark:border-white/10">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-light-600 dark:text-gray-400 text-lg mb-2">No rankings available</p>
          <p className="text-light-500 dark:text-gray-500 text-sm">Rankings will appear once players are added</p>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="space-y-3">
          {rankings.map((player, index) => (
            <DraggableRankingCard
              key={player.memberId}
              player={player}
              index={index}
              rankings={rankings}
              isAuthenticated={isAuthenticated}
              showToast={showToast}
              onReorder={handleReorder}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {rankings.map((player, index) => (
          <div
            key={player.memberId}
            className="bg-light-200/30 dark:bg-dark-100/30 border border-black/10 dark:border-white/10 rounded-2xl p-4 hover:border-cyber-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-cyber flex items-center justify-center font-bold text-white text-lg">
                  {index === 0 ? <Crown className="w-6 h-6 text-amber-300" /> : index < 3 ? <Medal className="w-6 h-6 text-cyan-300" /> : index < 10 ? <Star className="w-6 h-6 text-yellow-300" /> : player.rank}
                </div>
                <div>
                  <p className="text-light-900 dark:text-white font-bold text-lg">{player.name}</p>
                  <p className="text-light-600 dark:text-gray-400 text-sm">Rank #{player.rank}</p>
                </div>
              </div>
              {(player.coolOff || player.wildCard) && (
                <div className="text-right text-sm">
                  {player.coolOff && (
                    <p className="text-light-600 dark:text-gray-400">
                      <span className="text-light-500 dark:text-gray-500">Cool-off:</span> {player.coolOff}
                    </p>
                  )}
                  {player.wildCard && (
                    <p className="text-light-600 dark:text-gray-400">
                      <span className="text-light-500 dark:text-gray-500">Wildcard:</span> {player.wildCard}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-cyber-500/20 to-electric-500/20 border border-cyber-500/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyber-500/30 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-cyber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-light-900 dark:text-white mb-1">Pound-for-Pound Rankings</h3>
              <p className="text-light-600 dark:text-gray-400 text-sm">Current player standings based on challenge performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Rankings + Rules Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {renderRankings()}
        </div>
        <div className="lg:col-span-1">
          <RulesSidebar />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-2xl text-white shadow-light-cyber dark:shadow-glow transition-all duration-300 backdrop-blur-xl border ${
            toast.type === "success"
              ? "bg-green-500/90 border-green-400/50"
              : toast.type === "error"
              ? "bg-red-500/90 border-red-400/50"
              : "bg-cyber-500/90 border-cyber-400/50"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
