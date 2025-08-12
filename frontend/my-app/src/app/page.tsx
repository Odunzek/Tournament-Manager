"use client";

import Image from "next/image";
import LeagueSelector from "./components/LeagueSelector";
import LeagueTable from "./components/LeagueTable";
import MemberManager from "./components/MemberManager";
import TournamentManager from "./components/TournamentManager";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { AuthProvider, AuthModal } from '../lib/AuthContext';

function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<'leagues' | 'users' | 'tournaments'>('leagues');

  // Handle mounting and localStorage in a single effect
  useEffect(() => {
    setMounted(true);
    
    // Only access localStorage after component is mounted
    const savedLeague = localStorage.getItem("currentLeagueName") || "";
    const savedLeagueId = localStorage.getItem("currentLeagueId") || "";
    setSelectedLeague(savedLeague);
    setSelectedLeagueId(savedLeagueId);
  }, []);

  // Save the selected league whenever it changes (only after mounting)
  useEffect(() => {
    if (mounted && selectedLeague) {
      localStorage.setItem("currentLeagueName", selectedLeague);
    }
    if (mounted && selectedLeagueId) {
      localStorage.setItem("currentLeagueId", selectedLeagueId);
    }
  }, [selectedLeague, selectedLeagueId, mounted]);

  const handleLeagueSelect = useCallback((league: string, leagueId: string) => {
    setSelectedLeague(league);
    setSelectedLeagueId(leagueId);
  }, []);

  // Show nothing during SSR to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[url('/images/Fc1.jpg')] bg-cover bg-center from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header with Navigation */}
      <div className="text-center py-12 px-4">
        <div className="relative inline-block">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
           EA TOURNAMENT MANAGER
          </h1>
          <div className="absolute -top-3 -right-3">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-xl text-gray-600 font-medium">Create and manage your football leagues with style</p>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full mt-4"></div>
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mt-8">
          <div className=" rounded  p-1 flex space-x-1  ">
            {[
              { id: 'leagues', label: 'Leagues', icon: '/icons/league.svg', size:64 },
              { id: 'users', label: 'Players', icon: '/icons/Players.svg', size:64 },
              { id: 'tournaments', label: 'Tournaments', icon: '/icons/tournaments.svg', size:64 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center justify-center px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-70 text-[21pt] ${
                  activeSection === tab.id
                    ? 'bg-blue-600 text-white shadow-lg scale-90'
                    : 'text-gray-200 '
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Image 
                    src={tab.icon} 
                    alt={`${tab.label} icon`} 
                    width={tab.size} 
                    height={tab.size}
                  />
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Leagues Section */}
        {activeSection === 'leagues' && (
          <>
            {/* League Selection */}
            <LeagueSelector onLeagueSelect={handleLeagueSelect} />

            {/* Main Content */}
            {!selectedLeague ? (
              <div className="text-center mt-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 max-w-2xl mx-auto border border-white/20">
                  <div className="text-8xl mb-8 animate-bounce">⚽</div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                    Welcome to League Manager!
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Create your first league or select an existing one to start managing teams and matches.
                  </p>
                  
                  {/* Feature Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {[
                      { icon: "🏆", title: "Multiple Leagues", desc: "Create and manage unlimited leagues" },
                      { icon: "👥", title: "Player Management", desc: "Add players and manage participants" },
                      { icon: "⚽", title: "Match Results", desc: "Record matches with live table updates" },
                      { icon: "📊", title: "Tournament System", desc: "Champions League style competitions" }
                    ].map((feature, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{feature.icon}</span>
                          <h3 className="font-bold text-gray-800">{feature.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current League Display */}


                {/* League Table */}
                <LeagueTable leagueName={selectedLeague} leagueId={selectedLeagueId} />

                {/* Additional Links */}
                <div className="flex justify-center pt-8">
                  <Link
                    href="/match-history"
                    className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-bold text-lg"
                  >
                    <span className="text-2xl group-hover:animate-bounce"></span>
                    <span>View Match History</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Players Section */}
        {activeSection === 'users' && (
          <MemberManager />
        )}

        {/* Tournaments Section */}
        {activeSection === 'tournaments' && (
          <TournamentManager />
        )}

        {/*Footer */}
        <footer className="mt-16 text-center">
          <div className=" ">
            <p className="text-gray-300 font-medium">
               Created by Kachy Odunze
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
      <AuthModal />
    </AuthProvider>
  );
}