// Tournament Types and Interfaces

export type TournamentStatus = 'upcoming' | 'active' | 'completed';
export type TournamentType = 'league' | 'knockout' | 'groups_knockout';
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed';
export type KnockoutRound = 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  startDate: Date | string;
  endDate?: Date | string;
  numberOfTeams: number;
  numberOfGroups?: number;
  currentRound?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TournamentGroup {
  id: string;
  tournamentId: string;
  name: string; // e.g., "Group A"
  teams: string[]; // Array of team IDs
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  form?: string[]; // e.g., ['W', 'L', 'D', 'W', 'W']
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  scheduledDate: Date | string;
  groupId?: string;
  round?: string;
  knockoutRound?: KnockoutRound;
  isFirstLeg?: boolean;
  isSecondLeg?: boolean;
  playedAt?: Date | string;
}

export interface KnockoutBracket {
  round: KnockoutRound;
  matches: Match[];
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  groupId?: string;
  groupName?: string;
}

export interface TournamentStats {
  totalTeams: number;
  totalMatches: number;
  matchesPlayed: number;
  matchesRemaining: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  goalScorers?: GoalScorer[];
  notes?: string;
}

export interface GoalScorer {
  playerId: string;
  playerName: string;
  teamId: string;
  minute: number;
}

// Component Props Interfaces

export interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}

export interface MatchCardProps {
  match: Match;
  showGroup?: boolean;
  showDate?: boolean;
  onRecordResult?: (matchId: string) => void;
  onClick?: () => void;
}

export interface StandingsTableProps {
  standings: GroupStanding[];
  groupName?: string;
  highlightPositions?: number[]; // e.g., [1, 2] for top 2 positions
  expandable?: boolean;
}

export interface RecordResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSubmit: (result: MatchResult) => void;
}

export interface StatusBadgeProps {
  status: TournamentStatus | MatchStatus;
  size?: 'sm' | 'md' | 'lg';
}

export interface TournamentSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  tournamentId: string;
}

// Section identifiers
export type TournamentSection =
  | 'overview'
  | 'groups'
  | 'fixtures'
  | 'teams'
  | 'knockout'
  | 'results';

export interface TournamentSectionProps {
  tournamentId: string;
}
