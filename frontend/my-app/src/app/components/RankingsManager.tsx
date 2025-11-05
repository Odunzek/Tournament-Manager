"use client";

import React, { useEffect, useState } from "react";
import {
  RankingEntry,
  ensureRankingsForAllMembers,
  moveUp,
  moveDown,
  updateRankingFields,
  subscribeToRankings,
  getRules,
  saveRules,
  saveRankingOrder,
} from "../../lib/rankingUtils";
import { useAuth } from "../../lib/AuthContext";
import RankingCard from "./RankingCard";
import RuleSectionCard from "./RuleSectionCard";



export default function RankingManager() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [rulesText, setRulesText] = useState("");
  const [activeTab, setActiveTab] = useState<"rankings" | "rules">("rankings");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    getRules().then(setRulesText);
  }, []);

  useEffect(() => {
    setLoading(true);
    ensureRankingsForAllMembers().then(() => {
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

  function reorderRankings(
    list: RankingEntry[],
    memberId: string,
    newRank: number
  ) {
    const targetIndex = list.findIndex((r) => r.memberId === memberId);
    if (targetIndex === -1) return list;

    const reordered = [...list];
    const [moved] = reordered.splice(targetIndex, 1);
    reordered.splice(newRank - 1, 0, moved);

    // Reassign rank numbers sequentially
    return reordered.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }

  return (
    <div className="mb-8 bg-white/20 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center  text-3xl">
              <img src="/icons/p4pranking.svg" alt="P4P Rankings Icon" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                P4P Rankings
              </h2>
              <p className="text-white/80 text-xs sm:text-sm">Pound for Pound Rankings</p>
            </div>
          </div>
          {isAuthenticated ? (
            <span className="text-xs sm:text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold">
              Admin Mode
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-white/70">View Only</span>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto whitespace-nowrap">
          {[
            { id: "rankings", label: "Player Rankings", icon: "🏆" },
            { id: "rules", label: "League Rules", icon: "⚖️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 space-y-8 text-gray-900">
        {activeTab === "rankings" && (
          <div>
            {loading ? (
              <div className="text-center py-8 text-gray-600 font-medium">
                Loading rankings...
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-8 text-gray-600 italic">
                No players ranked yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="space-y-4">
                  {rankings.map((player) => (
                    <RankingCard
                      key={player.memberId}
                      player={player}
                      rankings={rankings}
                      isAuthenticated={isAuthenticated}
                      showToast={showToast}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

{activeTab === "rules" && (
  <div className="space-y-10 p-6 sm:p-10 bg-gradient-to-b from-white to-gray-50 rounded-3xl border border-gray-200 shadow-2xl">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-6">
      ⚖️ League Charter
    </h2>

    {[
      {
        id: "setup",
        title: "Initial Setup",
        icon: "⚙️",
        content: `1. Players should notify Admin if they decide to opt out.\n2. New joiners or inactive members start from the bottom.\n3. Ranking is based on Admin’s view of abilities, tournament victories, and current form.`,
      },
      {
        id: "challenges",
        title: "Challenge Rules",
        icon: "⚔️",
        content: `1. A player can challenge another up to 5 ranks above them.\n2. Players can use one Wildcard per tournament to challenge up to 10 ranks higher.\n3. Losing a wildcard challenge moves you down 6 ranks.\n4. Top 10 players can only challenge within 3 spots.`,
      },
      {
        id: "matches",
        title: "Match Format",
        icon: "⚽",
        content: `1. Best of 3 games per challenge.\n2. Challenged player picks first team; challenger must match star rating.\n3. Alternate home/away after each match.\n4. If tied, play until a winner emerges.`,
      },
      {
        id: "top10",
        title: "Top 10 Rules",
        icon: "🥇",
        content: `1. Challenges can only occur within 3 spots.\n2. Losing a top 10 challenge means dropping 3 spots.`,
      },
      {
        id: "admin",
        title: "Admin Rights",
        icon: "🛠️",
        content: `The Admin reserves the right to amend or interpret these rules as necessary.`,
      },
    ].map((section) => (
      <RuleSectionCard
        key={section.id}
        {...section}
        onUpdate={(id, newContent) => console.log("Update", id, newContent)}
      />
    ))}
  </div>
)}


      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-2 rounded-lg text-white shadow-xl transition-transform duration-300 ${
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
    </div>
  );
}
