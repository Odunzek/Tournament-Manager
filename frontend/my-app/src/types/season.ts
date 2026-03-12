/**
 * Season TypeScript Interfaces
 *
 * Defines types for the Season system that groups leagues, tournaments,
 * and rankings under a specific EA FC game cycle (e.g., "FC 25", "FC 26").
 *
 * A Season is the top-level organizational unit:
 *   Season → contains multiple Leagues + Tournaments
 *   Season → tracks per-season player rankings and achievements
 *
 * Stored in the Firestore `seasons` collection.
 * Leagues and tournaments reference a season via their `seasonId` field.
 */

/** Lifecycle state of a season */
export type SeasonStatus = 'setup' | 'active' | 'completed';

/**
 * Aggregate statistics for a season.
 * Displayed on the season detail page and season cards.
 * Updated as leagues/tournaments are added or matches are played.
 */
export interface SeasonStats {
  totalLeagues: number;       // Number of leagues in this season
  totalTournaments: number;   // Number of tournaments in this season
  totalMatches: number;       // Combined match count across all competitions
  activePlayers: number;      // Unique players participating in this season
}

/**
 * Core Season document stored in Firestore `seasons` collection.
 */
export interface Season {
  id?: string;                // Firestore document ID (added after creation)
  slug: string;               // URL-friendly identifier (e.g., "fc-26-season-1")
  name: string;               // Display name (e.g., "FC 26 — Season 1")
  gameVersion: string;        // EA FC game version (e.g., "FC 26")
  status: SeasonStatus;       // Current lifecycle state
  startDate: any;             // Firestore Timestamp — season start date
  endDate?: any;              // Firestore Timestamp — season end date (set on completion)
  stats: SeasonStats;         // Aggregate statistics (denormalized for quick display)
  description?: string;       // Optional admin notes/description
  createdAt: any;             // Firestore Timestamp — document creation time
  updatedAt: any;             // Firestore Timestamp — last modification time
}

/**
 * Form data shape for creating/editing a season.
 * Used by CreateSeasonModal and EditSeasonModal.
 */
export interface SeasonFormData {
  name: string;
  slug: string;
  gameVersion: string;
  status: SeasonStatus;
  startDate: string;          // ISO date string from the date picker
  description: string;
}
