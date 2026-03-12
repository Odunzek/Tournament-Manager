/**
 * League TypeScript Interfaces
 *
 * Defines all data types for the 1v1 FIFA League system.
 * In this system, individual players ARE teams — there are no multi-player squads.
 * Each league is a round-robin format where every player faces every other player.
 *
 * Data flow: Firestore → useLeague hook → calculateStandings() → LeaguePlayer[]
 */

/**
 * A single point adjustment record applied to a player by an admin.
 * Used for rule violations (negative) or fair play bonuses (positive).
 * Stored in the League document under `pointAdjustments[playerId][]`.
 */
export interface LeaguePointAdjustment {
  id: string;                // Unique ID (UUID v4) for this adjustment
  amount: number;            // Positive = bonus, negative = deduction
  reason: string;            // Admin-provided explanation (e.g., "Late to match")
  timestamp: any;            // Firestore Timestamp — when the adjustment was made
  adjustedBy: string;        // Admin identifier who applied it
}

/**
 * Computed standings row for a single player in a league.
 * Built by `calculateStandings()` in leagueUtils.ts from raw match data.
 * This is NOT stored in Firestore — it's derived on the client.
 */
export interface LeaguePlayer {
  id: string;                // Player document ID from the `players` collection
  name: string;              // Display name
  played: number;            // Total matches played
  won: number;               // Matches won
  draw: number;              // Matches drawn
  lost: number;              // Matches lost
  goalsFor: number;          // Total goals scored
  goalsAgainst: number;      // Total goals conceded
  goalDifference: number;    // goalsFor - goalsAgainst
  points: number;            // 3 per win, 1 per draw (+ any adjustments)
  position: number;          // Standings rank (1 = first place)
  form: ('W' | 'D' | 'L')[]; // Last 5 match results, most recent first
  pointAdjustments?: LeaguePointAdjustment[]; // Admin adjustments applied to this player
  totalAdjustment?: number;  // Sum of all adjustment amounts (cached for display)
}

/**
 * A single match record between two players in a league.
 * Stored in the Firestore `league_matches` collection.
 */
export interface LeagueMatch {
  id: string;                // Firestore document ID
  leagueId: string;          // Parent league ID
  playerA: string;           // First player's ID
  playerAName: string;       // First player's display name (denormalized for quick access)
  playerB: string;           // Second player's ID
  playerBName: string;       // Second player's display name (denormalized for quick access)
  scoreA: number;            // Goals scored by player A
  scoreB: number;            // Goals scored by player B
  date: any;                 // Firestore Timestamp — when the match was played
  winner?: string | null;    // Winning player's ID, or null/undefined for a draw
  played: boolean;           // Whether this match has been completed
}

/**
 * Win streak tracking for a player within a league.
 * Calculated client-side from match history, used in the Streaks & Stats section.
 */
export interface WinStreak {
  playerId: string;
  playerName: string;
  currentStreak: number;     // Current consecutive wins (resets on draw or loss)
  longestStreak: number;     // All-time best consecutive wins
  longestStreakDate?: any;   // Firestore Timestamp — when the longest streak was achieved
  currentUnbeaten: number;   // Current W+D run (only resets on a loss)
  longestUnbeaten: number;   // All-time longest W+D run
}

/**
 * Core League document stored in Firestore `leagues` collection.
 * Contains metadata and configuration — match data lives in a separate subcollection.
 */
export interface League {
  id?: string;               // Firestore document ID (optional because it's added after creation)
  name: string;              // League display name (e.g., "Premier League Season 3")
  season: string;            // Season name for display purposes
  seasonId?: string;         // References the `seasons` collection doc ID for grouping
  status: 'active' | 'upcoming' | 'completed'; // Current lifecycle state
  startDate: any;            // Firestore Timestamp — league start date
  endDate?: any;             // Firestore Timestamp — league end date (set on completion)
  playerIds: string[];       // Array of player IDs participating in this league
  totalMatches: number;      // Expected total matches (n*(n-1)/2 for round-robin)
  matchesPlayed: number;     // How many matches have been recorded so far
  rules?: string;            // Optional rules/notes text set by admin
  createdAt: any;            // Firestore Timestamp — document creation time
  updatedAt: any;            // Firestore Timestamp — last modification time
  pointAdjustments?: Record<string, LeaguePointAdjustment[]>; // Map of playerId → adjustments
}

/**
 * Aggregated stats for a single player within a specific league.
 * Used on the player detail page (leagues/[id]/players/[playerId]).
 */
export interface PlayerLeagueStats {
  player: LeaguePlayer;             // The player's standings row
  matchesPlayed: LeagueMatch[];     // All matches this player has participated in
  notPlayedYet: string[];           // IDs of players they haven't faced yet
  notPlayedYetNames: string[];      // Names of players they haven't faced yet
  winRate: number;                  // Win percentage (0-100)
}

/**
 * Filter state for the leagues list page.
 * Controlled by the search bar and filter dropdowns.
 */
export interface LeagueFilters {
  search: string;                                    // Text search on league name
  status: 'all' | 'active' | 'upcoming' | 'completed'; // Status filter
  season?: string;                                   // Optional season filter
}

/**
 * Form data shape for recording a new match.
 * Used by the RecordMatch section's form inputs before submission.
 */
export type MatchFormData = {
  playerA: string;   // Selected player A's ID
  scoreA: number;    // Player A's score input
  scoreB: number;    // Player B's score input
  playerB: string;   // Selected player B's ID
  date: string;      // ISO date string from date picker
};
