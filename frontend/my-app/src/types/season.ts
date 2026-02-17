/**
 * Season TypeScript Interfaces
 *
 * Defines types for the Season system that groups leagues, tournaments,
 * and rankings under a specific EA FC game cycle (e.g., FC 26).
 */

export type SeasonStatus = 'setup' | 'active' | 'completed';

export interface SeasonStats {
  totalLeagues: number;
  totalTournaments: number;
  totalMatches: number;
  activePlayers: number;
}

export interface Season {
  id?: string;
  slug: string;
  name: string;
  gameVersion: string;
  status: SeasonStatus;
  startDate: any; // Firestore Timestamp
  endDate?: any; // Firestore Timestamp
  stats: SeasonStats;
  description?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface SeasonFormData {
  name: string;
  slug: string;
  gameVersion: string;
  status: SeasonStatus;
  startDate: string;
  description: string;
}
