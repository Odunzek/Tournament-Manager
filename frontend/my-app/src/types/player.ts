/**
 * Player Types and Interfaces
 *
 * Defines the data structures for player management,
 * achievements tracking, and Hall of Fame system.
 */

/**
 * Hall of Fame Tier based on total titles
 * - Legend: 10+ titles
 * - Champion: 5-9 titles
 * - Veteran: 1-4 titles
 */
export type HallOfFameTier = 'legend' | 'champion' | 'veteran' | null;

/**
 * Player achievement statistics
 */
export interface PlayerAchievements {
  leagueWins: number;
  tournamentWins: number;
  totalTitles: number;
  tier?: HallOfFameTier;
  inductionDate?: string; // ISO date string when player reached 1+ titles
}

/**
 * Per-season achievement statistics
 * Stored as a map on the Player document: seasonAchievements[seasonId]
 */
export interface SeasonAchievements {
  leagueWins: number;
  tournamentWins: number;
  totalTitles: number;
  tier?: HallOfFameTier;
  inductionDate?: string;
}

/**
 * Individual title won by a player
 */
export interface TitleRecord {
  name: string;
  type: 'league' | 'tournament';
  date: string;
  seasonId?: string;
}

/**
 * Main Player interface
 */
export interface Player {
  id: string;
  name: string;
  psnId: string;
  avatar?: string;
  achievements: PlayerAchievements;
  seasonAchievements?: Record<string, SeasonAchievements>;
  titleHistory?: TitleRecord[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Record types for all-time achievements
 */
export type RecordType = 'most_leagues' | 'most_tournaments' | 'most_titles' | 'current_champion';

/**
 * All-time record holder
 */
export interface AllTimeRecord {
  recordType: RecordType;
  player: Player;
  count: number;
  lastUpdated?: string;
}

/**
 * Player form data (for add/edit)
 */
export interface PlayerFormData {
  name: string;
  psnId: string;
  avatar?: string;
}

/**
 * Player filter options
 */
export interface PlayerFilters {
  search: string;
  hallOfFameOnly: boolean;
  sortBy: 'name' | 'titles' | 'recent';
}

/**
 * Hall of Fame section data
 */
export interface HallOfFameSection {
  tier: HallOfFameTier;
  title: string;
  description: string;
  minTitles: number;
  maxTitles?: number;
  players: Player[];
  accentColor: string;
  iconEmoji: string;
}

/**
 * Calculate Hall of Fame tier based on total titles
 */
export function calculateTier(totalTitles: number): HallOfFameTier {
  if (totalTitles >= 10) return 'legend';
  if (totalTitles >= 5) return 'champion';
  if (totalTitles >= 1) return 'veteran';
  return null;
}

/**
 * Get tier display information
 */
export function getTierInfo(tier: HallOfFameTier): {
  label: string;
  color: string;
  gradient: string;
  icon: string;
  minTitles: number;
} {
  switch (tier) {
    case 'legend':
      return {
        label: 'Legend',
        color: 'text-yellow-400',
        gradient: 'from-yellow-500 to-amber-500',
        icon: '👑',
        minTitles: 10,
      };
    case 'champion':
      return {
        label: 'Champion',
        color: 'text-gray-300',
        gradient: 'from-gray-400 to-gray-500',
        icon: '⭐',
        minTitles: 5,
      };
    case 'veteran':
      return {
        label: 'Veteran',
        color: 'text-orange-400',
        gradient: 'from-orange-600 to-amber-700',
        icon: '🎖️',
        minTitles: 1,
      };
    default:
      return {
        label: 'Player',
        color: 'text-gray-400',
        gradient: 'from-gray-600 to-gray-700',
        icon: '🎮',
        minTitles: 0,
      };
  }
}

/**
 * Get progress to next tier
 */
export function getProgressToNextTier(totalTitles: number): {
  nextTier: HallOfFameTier;
  titlesNeeded: number;
  percentage: number;
} | null {
  if (totalTitles >= 10) {
    return null; // Already at max tier
  }

  if (totalTitles >= 5) {
    return {
      nextTier: 'legend',
      titlesNeeded: 10 - totalTitles,
      percentage: (totalTitles / 10) * 100,
    };
  }

  if (totalTitles >= 1) {
    return {
      nextTier: 'champion',
      titlesNeeded: 5 - totalTitles,
      percentage: (totalTitles / 5) * 100,
    };
  }

  return {
    nextTier: 'veteran',
    titlesNeeded: 1 - totalTitles,
    percentage: (totalTitles / 1) * 100,
  };
}
