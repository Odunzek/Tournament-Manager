"use client";

import Image from "next/image";
import LeagueSelector from "./components/LeagueSelector";
import LeagueTable from "./components/LeagueTable";
import MemberManager from "./components/MemberManager";
import TournamentManager from "./components/TournamentManager";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { AuthProvider, AuthModal } from "../lib/AuthContext";
import { useAuth } from "../lib/AuthContext";
import RankingManager from "./components/RankingsManager";

function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "leagues" | "users" | "tournaments" | "rankings"
  >("leagues");

  // 🔐 Auth hook
  const { isAuthenticated, setShowAuthModal, logout } = useAuth();

  // Mount + restore persisted league
  useEffect(() => {
    setMounted(true);
    const savedLeague = localStorage.getItem("currentLeagueName") || "";
    const savedLeagueId = localStorage.getItem("currentLeagueId") || "";
    setSelectedLeague(savedLeague);
    setSelectedLeagueId(savedLeagueId);
  }, []);

  // Persist selection
  useEffect(() => {
    if (!mounted) return;
    if (selectedLeague)
      localStorage.setItem("currentLeagueName", selectedLeague);
    if (selectedLeagueId)
      localStorage.setItem("currentLeagueId", selectedLeagueId);
  }, [mounted, selectedLeague, selectedLeagueId]);

  const handleLeagueSelect = useCallback((league: string, leagueId: string) => {
    setSelectedLeague(league);
    setSelectedLeagueId(leagueId);
  }, []);

  // Avoid SSR mismatch
  if (!mounted) return null;

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Background image + overlay */}
      <div className="absolute inset-0 bg-[url('/images/Fc1.jpg')] bg-cover bg-center md:bg-fixed" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-blue-50/5 to-indigo-100/1" />

      <div className="relative">
        {/* Header */}
        <div className="text-center relative pt-[env(safe-area-inset-top)] py-10 px-4">
          {/* 🔐 Admin Login / Logout Button */}
          <div className="flex justify-center sm:justify-end mb-4 sm:mb-6 px-4">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-md transition-all duration-300"
              >
                Logout Admin
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-md transition-all duration-300"
              >
                Login as Admin
              </button>
            )}
          </div>

          <div className="relative inline-block">
            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold
                         bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800
                         bg-clip-text text-transparent mb-3"
            >
              EA TOURNAMENT MANAGER
            </h1>
            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-700 font-medium">
            Create and manage your football leagues with style
          </p>
          <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full mt-3" />

          {/* Tabs */}
          <div className="flex justify-center mt-6">
            <div className="max-w-full px-4">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {[
                  {
                    id: "leagues",
                    label: "Leagues",
                    icon: "/icons/league.svg",
                  },
                  { id: "users", label: "Players", icon: "/icons/Players.svg" },
                  {
                    id: "tournaments",
                    label: "Tournaments",
                    icon: "/icons/tournaments.svg",
                  },
                  {
                    id: "rankings",
                    label: "P4P Rankings",
                    icon: "/icons/p4pranking.svg"
                  },
                ].map((tab) => {
                  const isActive = activeSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSection(tab.id as any)}
                      aria-pressed={isActive}
                      className={[
                        "relative inline-flex items-center gap-2 rounded-2xl",
                        "px-4 py-2 sm:px-6 sm:py-3 font-semibold",
                        "shadow-md ring-1 ring-white/10",
                        "overflow-hidden whitespace-nowrap shrink-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        "transition-[background,box-shadow,transform] duration-200",
                        "sm:hover:scale-[1.03] will-change-transform",
                        isActive
                          ? "bg-blue-600 text-white ring-blue-400/20"
                          : "bg-white/10 text-white hover:bg-white/15",
                      ].join(" ")}
                    >
                      <Image
                        src={tab.icon}
                        alt={`${tab.label} icon`}
                        width={28}
                        height={28}
                        className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none"
                      />
                      <span className="text-base sm:text-lg">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 pb-12">
          {/* Leagues */}
          {activeSection === "leagues" && (
            <>
              <LeagueSelector onLeagueSelect={handleLeagueSelect} />

              {!selectedLeague ? (
                <div className="text-center mt-10">
                  <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-10 max-w-2xl mx-auto border border-white/40">
                    <div className="text-7xl sm:text-8xl mb-6 animate-bounce">
                      ⚽
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                      Welcome to League Manager!
                    </h2>
                    <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                      Create your first league or select an existing one to
                      start managing players and matches.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
                      {[
                        {
                          icon: "🏆",
                          title: "Multiple Leagues",
                          desc: "Create and manage unlimited leagues",
                        },
                        {
                          icon: "👥",
                          title: "Player Management",
                          desc: "Add players and manage participants",
                        },
                        {
                          icon: "⚽",
                          title: "Match Results",
                          desc: "Record matches with live table updates",
                        },
                        {
                          icon: "📊",
                          title: "Tournament System",
                          desc: "Champions League–style competitions",
                        },
                      ].map((feature, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-5 rounded-xl border border-blue-100"
                        >
                          <div className="flex items-center space-x-3 mb-1.5">
                            <span className="text-2xl">{feature.icon}</span>
                            <h3 className="font-bold text-gray-800">
                              {feature.title}
                            </h3>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {feature.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6">
                    <LeagueTable
                      leagueName={selectedLeague}
                      leagueId={selectedLeagueId}
                    />
                  </div>

                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Link
                      href="/match-history"
                      className="group inline-flex items-center space-x-3 px-6 py-3 sm:px-8 sm:py-4
                                 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl
                                 hover:from-blue-700 hover:to-purple-700 active:scale-95
                                 transition-all duration-200 shadow-xl font-bold text-base sm:text-lg"
                    >
                      <span>View Match History</span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Players */}
          {activeSection === "users" && (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className=" backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-6">
                <MemberManager />
              </div>
            </div>
          )}

          {/* Tournaments */}
          {activeSection === "tournaments" && (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className=" backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-6">
                <TournamentManager />
              </div>
            </div>
          )}

          {/* Rankings */}
          {activeSection === "rankings" && (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-6">
                <RankingManager />
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 sm:mt-16 text-center">
            <p className="text-gray-200 font-medium">Created by Kempyre Group</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

// ✅ wrapped with AuthProvider & AuthModal
export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
      <AuthModal />
    </AuthProvider>
  );
}
