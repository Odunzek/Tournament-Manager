/**
 * Tournament Types and Interfaces
 *
 * Defines all data types for the FIFA tournament system.
 * Supports three tournament formats:
 *   - 'league': Round-robin only (everyone plays everyone)
 *   - 'knockout': Direct elimination bracket
 *   - 'groups_knockout': Group stage → knockout rounds (e.g., World Cup format)
 *
 * NOTE: These types are used by the LEGACY tournament system in `tournamentUtils.ts`.
 * The actual Firestore-backed tournament uses a different shape defined in tournamentUtils.ts.
 * These types remain for UI component props and display logic.
 */

/** Lifecycle state of a tournament */
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

/** The three supported tournament formats */
export type TournamentType = 'league' | 'knockout' | 'groups_knockout';

/** State of an individual match within a tournament */
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed';

/** Named knockout rounds — used for bracket positioning and display labels */
export type KnockoutRound = 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';

/**
 * Core tournament document.
 * Maps to the `tournaments` Firestore collection.
 */
export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;          // Format of the tournament
  status: TournamentStatus;
  startDate: Date | string;
  endDate?: Date | string;
  numberOfTeams: number;         // Max participants allowed
  numberOfGroups?: number;       // Only used for 'groups_knockout' format
  currentRound?: string;         // Human-readable current round label
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * A group within a 'groups_knockout' tournament.
 * Contains references to team IDs assigned to this group.
 */
export interface TournamentGroup {
  id: string;
  tournamentId: string;
  name: string;                  // Display name (e.g., "Group A", "Group B")
  teams: string[];               // Array of team/participant IDs in this group
}

/**
 * A single row in a group standings table.
 * Computed from match results — not stored directly in Firestore.
 */
export interface GroupStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;        // goalsFor - goalsAgainst
  points: number;                // 3 per win, 1 per draw
  position: number;              // Rank within the group (1 = top)
  form?: string[];               // Recent results like ['W', 'L', 'D', 'W', 'W']
}

/**
 * A single match within a tournament.
 * Can be a group stage match or a knockout match depending on the fields populated.
 */
export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore?: number;            // Undefined until result is recorded
  awayScore?: number;
  status: MatchStatus;
  scheduledDate: Date | string;
  groupId?: string;              // Set if this is a group stage match
  round?: string;                // Human-readable round label
  knockoutRound?: KnockoutRound; // Set if this is a knockout match
  isFirstLeg?: boolean;          // For two-legged knockout ties
  isSecondLeg?: boolean;
  playedAt?: Date | string;      // Actual date the match was played
}

/**
 * Represents one round in the knockout bracket.
 * Used by the Knockout section to render the bracket visualization.
 */
export interface KnockoutBracket {
  round: KnockoutRound;
  matches: Match[];
}

/**
 * A team/participant in a tournament.
 * Can optionally be assigned to a group.
 */
export interface Team {
  id: string;
  name: string;
  logo?: string;
  groupId?: string;              // Group assignment (undefined = unassigned)
  groupName?: string;            // Denormalized group name for display
}

/**
 * Aggregate statistics for an entire tournament.
 * Displayed on the Overview section.
 */
export interface TournamentStats {
  totalTeams: number;
  totalMatches: number;
  matchesPlayed: number;
  matchesRemaining: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
}

/**
 * Data submitted when recording a match result.
 * Sent from RecordResultModal to the parent handler.
 */
export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  goalScorers?: GoalScorer[];    // Optional detailed goal log
  notes?: string;                // Admin notes about the match
}

/**
 * Individual goal event within a match.
 * Used for detailed match reporting (currently optional).
 */
export interface GoalScorer {
  playerId: string;
  playerName: string;
  teamId: string;
  minute: number;                // Minute the goal was scored
}

// ============================================================
// Component Props Interfaces
// Define the expected props for tournament-related UI components.
// ============================================================

/** Props for the tournament list card on the tournaments page */
export interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}

/** Props for an individual match display card */
export interface MatchCardProps {
  match: Match;
  showGroup?: boolean;           // Whether to show the group label
  showDate?: boolean;            // Whether to show the match date
  onRecordResult?: (matchId: string) => void; // Admin action to record a result
  onClick?: () => void;
}

/** Props for the group standings table component */
export interface StandingsTableProps {
  standings: GroupStanding[];
  groupName?: string;
  highlightPositions?: number[]; // Positions to highlight (e.g., [1, 2] for qualification spots)
  expandable?: boolean;          // Whether rows can expand to show detailed stats
}

/** Props for the record result modal dialog */
export interface RecordResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSubmit: (result: MatchResult) => void;
}

/** Props for the status badge pill component */
export interface StatusBadgeProps {
  status: TournamentStatus | MatchStatus;
  size?: 'sm' | 'md' | 'lg';
}

/** Props for the tournament detail page sidebar navigation */
export interface TournamentSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  tournamentId: string;
  tournamentType?: string;
}

/**
 * Valid section identifiers for tournament detail page navigation.
 * Each corresponds to a tab in the TournamentSidebar.
 */
export type TournamentSection =
  | 'overview'    // Tournament info, rules, stats
  | 'groups'      // Group stage tables and matches
  | 'fixtures'    // Full fixture list
  | 'teams'       // All participants/teams
  | 'knockout'    // Knockout bracket visualization
  | 'results'     // Completed match results
  // UCL-specific sections
  | 'ucl_pots'    // Pot assignment + player enrollment
  | 'ucl_league'  // Unified league phase standings
  | 'ucl_playoff' // Playoff 2-legged ties
  | 'ucl_stats';  // League phase stats & results

/** Base props passed to each tournament section component */
export interface TournamentSectionProps {
  tournamentId: string;
}
