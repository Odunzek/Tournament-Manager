/**
 * League TypeScript Interfaces
 *
 * Defines types for the 1v1 FIFA League system where individual players ARE teams.
 */

export interface LeaguePointAdjustment {
  id: string;
  amount: number;
  reason: string;
  timestamp: any; // Firestore Timestamp or Date
  adjustedBy: string; // Admin identifier
}

export interface LeaguePlayer {
  id: string;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  form: ('W' | 'D' | 'L')[]; // Last 5 matches (most recent first)
  pointAdjustments?: LeaguePointAdjustment[];
  totalAdjustment?: number;
}

export interface LeagueMatch {
  id: string;
  leagueId: string;
  playerA: string; // Player ID
  playerAName: string;
  playerB: string; // Player ID
  playerBName: string;
  scoreA: number;
  scoreB: number;
  date: any; // Firestore Timestamp
  winner?: string | null; // Player ID or null for draw
  played: boolean;
}

export interface WinStreak {
  playerId: string;
  playerName: string;
  currentStreak: number;
  longestStreak: number;
  longestStreakDate?: any; // Firestore Timestamp
  currentUnbeaten: number;  // current W+D run (resets only on loss)
  longestUnbeaten: number;  // all-time longest W+D run
}

export interface League {
  id?: string;
  name: string;
  season: string;
  seasonId?: string; // references seasons collection doc ID
  status: 'active' | 'upcoming' | 'completed';
  startDate: any; // Firestore Timestamp
  endDate?: any; // Firestore Timestamp
  playerIds: string[]; // Array of player IDs participating
  totalMatches: number;
  matchesPlayed: number;
  rules?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  pointAdjustments?: Record<string, LeaguePointAdjustment[]>;
}

export interface PlayerLeagueStats {
  player: LeaguePlayer;
  matchesPlayed: LeagueMatch[]; // Matches this player participated in
  notPlayedYet: string[]; // Player IDs not faced yet
  notPlayedYetNames: string[]; // Player names not faced yet
  winRate: number;
}

export interface LeagueFilters {
  search: string;
  status: 'all' | 'active' | 'upcoming' | 'completed';
  season?: string;
}

export type MatchFormData = {
  playerA: string;
  scoreA: number;
  scoreB: number;
  playerB: string;
  date: string;
};
