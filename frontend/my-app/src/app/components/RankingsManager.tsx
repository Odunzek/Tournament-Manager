"use client";

import React, { useEffect, useState } from "react";
import {
  RankingEntry,
  ensureRankingsForAllPlayers,
  moveUp,
  moveDown,
  updateRankingFields,
  subscribeToRankings,
  getRules,
  saveRules,
  saveRankingOrder,
} from "../../lib/rankingUtils";
import { useAuth } from "../../lib/AuthContext";
import { Lock, Shield, Trophy, Settings, Info } from "lucide-react";
import DraggableRankingCard from "./DraggableRankingCard";
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
  const { isAuthenticated, setShowAuthModal } = useAuth();

  useEffect(() => {
    getRules().then(setRulesText);
  }, []);

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

  // Handle drag-and-drop reordering
  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const reordered = [...rankings];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Update local state immediately for responsive UI
    setRankings(reordered);

    // Save to Firebase
    try {
      await saveRankingOrder(reordered.map((r) => r.memberId));
    } catch (error) {
      console.error("Error saving rank order:", error);
      showToast("Failed to save ranking order", "error");
    }
  };

  // Non-Admin View - Simple read-only display
  if (!isAuthenticated) {
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
                <h3 className="text-lg font-bold text-white mb-1">Pound-for-Pound Rankings</h3>
                <p className="text-gray-400 text-sm">Current player standings based on challenge performance</p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 bg-dark-50 hover:bg-dark-100 text-gray-300 border border-white/10 hover:border-cyber-500/50 px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>

        {/* Rankings Display */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-12 h-12 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 font-medium">Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-16 bg-dark-100/30 rounded-2xl border border-white/10">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No rankings available</p>
              <p className="text-gray-500 text-sm">Rankings will appear once players are added</p>
            </div>
          ) : (
            rankings.map((player, index) => (
              <div
                key={player.memberId}
                className="bg-dark-100/30 border border-white/10 rounded-2xl p-4 hover:border-cyber-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-cyber flex items-center justify-center font-bold text-white text-lg">
                      {index === 0 ? "👑" : index < 3 ? "🥇" : index < 10 ? "⭐" : player.rank}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{player.name}</p>
                      <p className="text-gray-400 text-sm">Rank #{player.rank}</p>
                    </div>
                  </div>
                  {(player.coolOff || player.wildCard) && (
                    <div className="text-right text-sm">
                      {player.coolOff && (
                        <p className="text-gray-400">
                          <span className="text-gray-500">Cool-off:</span> {player.coolOff}
                        </p>
                      )}
                      {player.wildCard && (
                        <p className="text-gray-400">
                          <span className="text-gray-500">Wildcard:</span> {player.wildCard}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Admin View - Full control panel
  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-6 shadow-glow">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center animate-pulse">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Admin Control Panel</h3>
              <p className="text-gray-300 text-sm">Manage player rankings and challenge rules</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold text-sm">Admin Mode Active</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3">
        {[
          { id: "rankings", label: "Manage Rankings", icon: Settings },
          { id: "rules", label: "League Rules", icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-cyber text-white shadow-glow"
                  : "bg-dark-100/50 text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {activeTab === "rankings" && (
          <div>
            {/* Instructions */}
            <div className="bg-cyber-500/10 border border-cyber-500/30 rounded-2xl p-4 mb-6">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin Controls
              </h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• <strong>Drag & Drop:</strong> Grab the ⋮⋮ handle and drag cards to reorder</li>
                <li>• <strong>Quick Jump:</strong> Use the dropdown to jump a player to any rank</li>
                <li>• <strong>Edit Status:</strong> Click Cool-off or Wildcard fields to update</li>
                <li>• All changes are saved automatically</li>
              </ul>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-cyber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Loading rankings...</p>
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-16 bg-dark-100/30 rounded-2xl border border-white/10">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No players ranked yet</p>
                <p className="text-gray-500 text-sm">Rankings will appear here once players are added</p>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-4">
            {[
              {
                id: "setup",
                title: "Initial Setup",
                icon: "⚙️",
                content: `1. Players should notify Admin if they decide to opt out.\n2. New joiners or inactive members start from the bottom.\n3. Ranking is based on Admin's view of abilities, tournament victories, and current form.`,
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
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-2xl text-white shadow-glow transition-all duration-300 backdrop-blur-xl border ${
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
