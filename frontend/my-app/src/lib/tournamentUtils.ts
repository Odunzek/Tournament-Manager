// lib/tournamentUtils.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from "uuid";

// Remove ALL undefined values
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== null && item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = removeUndefinedValues(obj[key]);
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
};

// Helper function to check if a knockout round is complete

const isRoundComplete = (bracket: KnockoutTie[], round: string): boolean => {
  // Get all original ties for this round (exclude replays)
  const originalRoundTies = bracket.filter(tie => tie.round === round && !tie.originalTieId);
  
  if (originalRoundTies.length === 0) return false;
  
  // Check each original tie
  for (const tie of originalRoundTies) {
    // If tie is completed normally, it's done
    if (tie.completed && !tie.awaitingReplay) {
      continue; // This tie is properly completed
    }
    
    // If tie is awaiting replay, check if the replay is completed
    if (tie.awaitingReplay && tie.replayTieId) {
      const replayTie = bracket.find(t => t.id === tie.replayTieId);
      if (!replayTie || !replayTie.completed) {
        return false; // Replay not completed yet
      }
      continue; // Replay is completed
    }
    
    // If we get here, this tie is neither completed nor has a completed replay
    return false;
  }
  
  // All ties are either completed or have completed replays
  return true;
};

// Helper function to generate next knockout round
const generateNextRound = (winners: string[], round: string): KnockoutTie[] => {
  const ties: KnockoutTie[] = [];
  
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i + 1]) {
      const tieNumber = (i / 2) + 1;
      const tieId = `${round}_tie_${tieNumber}`;
      
      ties.push({
        id: tieId,
        round: round as any,
        team1: winners[i],
        team2: winners[i + 1],
        firstLeg: {
          id: `${tieId}_leg1`,
          leg: 'first',
          homeTeam: winners[i],
          awayTeam: winners[i + 1],
          played: false
        },
        secondLeg: {
          id: `${tieId}_leg2`,
          leg: 'second',
          homeTeam: winners[i + 1],
          awayTeam: winners[i],
          played: false
        },
        completed: false,
        tieNumber: tieNumber
      });
    }
  }
  
  return ties;
};

// Add these 2 functions right here:

// Helper function to get winners from completed round
const getRoundWinners = (bracket: KnockoutTie[], round: string): string[] => {
  const winners: string[] = [];
  
  // Get all original ties for this round (exclude replays)
  const originalRoundTies = bracket.filter(tie => tie.round === round && !tie.originalTieId);
  
  for (const tie of originalRoundTies) {
    if (tie.completed && !tie.awaitingReplay && tie.winner) {
      // Normal completion
      winners.push(tie.winner);
    } else if (tie.awaitingReplay && tie.replayTieId) {
      // Get winner from replay
      const replayTie = bracket.find(t => t.id === tie.replayTieId);
      if (replayTie && replayTie.completed && replayTie.winner) {
        winners.push(replayTie.winner);
      }
    }
  }
  
  return winners;
};

// Helper function to get next round name
const getNextRound = (currentRound: string): string | null => {
  const progression: { [key: string]: string } = {
    'round_16': 'quarter_final',
    'quarter_final': 'semi_final', 
    'semi_final': 'final'
  };
  return progression[currentRound] || null;
};


export interface Tournament {
  id?: string;
  name: string;
  type: 'league' | 'champions_league' | 'knockout' | 'custom';
  status: 'setup' | 'group_stage' | 'knockout' | 'completed';
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  maxTeams: number;
  currentTeams: number;
  groups?: TournamentGroup[];
  knockoutBracket?: KnockoutTie[];
  settings: TournamentSettings;
  qualifiedTeams?: TournamentParticipant[];  
}

export interface TournamentGroup {
  id: string;
  name: string; // Group A, B, C, etc.
  members: TournamentParticipant[];
  matches: GroupMatch[];
  standings: GroupStanding[];
}

export interface TournamentParticipant {
  id?: string;
  name: string;
  psnId?: string; // Player's PSN ID
  country?: string;
  logo?: string;
  players?: string[]; // User IDs
  tournamentId: string;
  groupId?: string;
  eliminated?: boolean;
  qualified?: boolean;           
  qualificationRank?: number; 
  overallRank?: number;        // Overall ranking across all groups
  groupName?: string;          // Which group they came from
  finalPoints?: number;        // Final points from group stage
  finalGoalDifference?: number; // Final goal difference from group stage
  finalGoalsFor?: number;      // Final goals for from group stage
 
}
export interface GroupMatch {
  id?: string;
  groupId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  matchDate?: Date;
  played: boolean;
  matchday: number; // 1-6 for group stage
}

export interface GroupStanding {
  memberId?: string;
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
}

export interface KnockoutMatch {
  id?: string;
  leg: 'first' | 'second'; 
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homeScorePenalties?: number;
  awayScorePenalties?: number;
  matchDate?: Date;
  played: boolean;
}

export interface KnockoutTie {
  id?: string;
  round: 'round_16' | 'quarter_final' | 'semi_final' | 'final';
  team1: string; // Team name
  team2: string; // Team name  
  firstLeg: KnockoutMatch;
  secondLeg: KnockoutMatch;
  aggregateScore?: {
    team1Goals: number;
    team2Goals: number;
  };
  winner?: string;
  completed: boolean;
  tieNumber: number;

  // Optional fields for replays
  originalTieId?: string;    // Links replay back to original tie
  awaitingReplay?: boolean;  // True when tie needs replay to determine winner
  replayTieId?: string;      // Links original to its replay tie
}



export interface TournamentSettings {
  groupSize: number; // Usually 4 teams per group
  teamsAdvanceFromGroup: number; // Usually 2 teams advance
  hasKnockoutStage: boolean;
  allowExtraTime: boolean;
  allowPenalties: boolean;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
}

// Default tournament settings for different types
export const DEFAULT_CUSTOM_SETTINGS: TournamentSettings = {
  groupSize: 4,
  teamsAdvanceFromGroup: 2,
  hasKnockoutStage: false,
  allowExtraTime: false,
  allowPenalties: false,
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

export const DEFAULT_CHAMPIONS_LEAGUE_SETTINGS: TournamentSettings = {
  groupSize: 4,
  teamsAdvanceFromGroup: 2,
  hasKnockoutStage: true,
  allowExtraTime: true,
  allowPenalties: true,
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

export const DEFAULT_KNOCKOUT_SETTINGS: TournamentSettings = {
  groupSize: 4,
  teamsAdvanceFromGroup: 2,
  hasKnockoutStage: true,
  allowExtraTime: true,
  allowPenalties: true,
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

// Tournament Functions
export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'currentTeams'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...tournamentData,
      createdAt: new Date(),
      currentTeams: 0,
      status: 'setup'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tournament:', error);
    throw error;
  }
};

export const getTournaments = async (): Promise<Tournament[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tournament));
  } catch (error) {
    console.error('Error getting tournaments:', error);
    return [];
  }
};

export const updateTournament = async (tournamentId: string, updates: Partial<Tournament>): Promise<void> => {
  try {
    const cleanUpdates = removeUndefinedValues(updates);
    await updateDoc(doc(db, 'tournaments', tournamentId), cleanUpdates);
  } catch (error) {
    console.error('Error updating tournament:', error);
    throw error;
  }
};

export const deleteTournament = async (tournamentId: string): Promise<void> => {
  try {
    // Delete tournament
    await deleteDoc(doc(db, 'tournaments', tournamentId));
    
    // Delete all teams in this tournament
    const teamsQuery = query(collection(db, 'tournament_members'), where('tournamentId', '==', tournamentId));
    const teamsSnapshot = await getDocs(teamsQuery);
    
    const deleteTeamPromises = teamsSnapshot.docs.map(teamDoc => 
      deleteDoc(doc(db, 'tournament_teams', teamDoc.id))
    );
    
    // Delete all matches in this tournament
    const matchesQuery = query(collection(db, 'tournament_matches'), where('tournamentId', '==', tournamentId));
    const matchesSnapshot = await getDocs(matchesQuery);
    
    const deleteMatchPromises = matchesSnapshot.docs.map(matchDoc => 
      deleteDoc(doc(db, 'tournament_matches', matchDoc.id))
    );
    
    await Promise.all([...deleteTeamPromises, ...deleteMatchPromises]);
  } catch (error) {
    console.error('Error deleting tournament:', error);
    throw error;
  }
};

//  Clean up member from all groups (standings + matches)
//  Auto-generate new fixtures for a member who just joined or moved to a group
export async function generateMissingGroupFixtures(
  tournamentId: string,
  groupId: string,
  newTeamName?: string // optional — works for new or full regen
) {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament || !tournament.groups) return;

  const groups = tournament.groups.map((group) => {
    if (group.id !== groupId) return group;

    const teamNames = group.standings.map((s) => s.teamName.trim());
    const matches: any[] = [];

    // 🧩 Create round-robin home-and-away fixtures
    for (let i = 0; i < teamNames.length; i++) {
      for (let j = i + 1; j < teamNames.length; j++) {
        const home = teamNames[i];
        const away = teamNames[j];

        // skip if same name or already exists
        if (home.toLowerCase() === away.toLowerCase()) continue;

        const match1 = {
          id: uuidv4(),
          groupId,
          homeTeam: home,
          awayTeam: away,
          homeScore: 0,
          awayScore: 0,
          matchDate: new Date(), // you can offset later
          played: false,
          matchday: matches.length + 1,
        };

        const match2 = {
          id: uuidv4(),
          groupId,
          homeTeam: away,
          awayTeam: home,
          homeScore: 0,
          awayScore: 0,
          matchDate: new Date(),
          played: false,
          matchday: matches.length + 2,
        };

        matches.push(match1, match2);
      }
    }

    // 🧹 Remove duplicates by team pairs
    const uniqueMatches = matches.filter(
      (match, index, self) =>
        index ===
        self.findIndex(
          (m) =>
            m.homeTeam.toLowerCase() === match.homeTeam.toLowerCase() &&
            m.awayTeam.toLowerCase() === match.awayTeam.toLowerCase()
        )
    );

    return {
      ...group,
      matches: uniqueMatches,
    };
  });

  await updateTournament(tournamentId, { groups });
}


// Tournament Team Functions
export const addMemberToTournament = async (
  tournamentId: string,
  member: {
    name: string;
    psnId: string;
    groupId?: string | null;
    tournamentId?: string;
    createdAt?: Date;
  }
): Promise<string> => {
  try {
    // ✅ Add to Firestore with all fields dynamically spread
    const docRef = await addDoc(collection(db, "tournament_members"), {
      tournamentId,
      eliminated: false,
      ...member,
    });

    // ✅ Update tournament currentTeams count
    const tournament = await getTournamentById(tournamentId);
    if (tournament) {
      await updateTournament(tournamentId, {
        currentTeams: (tournament.currentTeams || 0) + 1,
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding team to tournament:", error);
    throw error;
  }
};


export const getTournamentMembers = async (tournamentId: string): Promise<TournamentParticipant[]> => {
  try {
    const q = query(collection(db, 'tournament_members'), where('tournamentId', '==', tournamentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TournamentParticipant));
  } catch (error) {
    console.error('Error getting tournament teams:', error);
    return [];
  }
};

// Add this function to your tournamentUtils.ts file

// Helper function to get best teams overall across all groups
export const getBestTeamsOverall = (groups: TournamentGroup[], targetTeams: number): TournamentParticipant[] => {
  const allTeams: Array<{ team: TournamentParticipant; standing: GroupStanding; groupName: string }> = [];
  
  // Collect all teams with their standings
  groups.forEach(group => {
    const sortedStandings = group.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    sortedStandings.forEach((standing, index) => {
      const team = group.members.find(member => member.name === standing.teamName);
      if (team) {
        allTeams.push({
          team,
          standing: { ...standing, position: index + 1 }, // Ensure position is set correctly
          groupName: group.name
        });
      }
    });
  });
  
  // Sort ALL teams by performance across all groups
  const sortedAllTeams = allTeams.sort((a, b) => {
    // First priority: Points
    if (b.standing.points !== a.standing.points) {
      return b.standing.points - a.standing.points;
    }
    
    // Second priority: Goal difference
    if (b.standing.goalDifference !== a.standing.goalDifference) {
      return b.standing.goalDifference - a.standing.goalDifference;
    }
    
    // Third priority: Goals for
    if (b.standing.goalsFor !== a.standing.goalsFor) {
      return b.standing.goalsFor - a.standing.goalsFor;
    }
    
    // Fourth priority: Group position (1st place > 2nd place > 3rd place)
    if (a.standing.position !== b.standing.position) {
      return a.standing.position - b.standing.position;
    }
    
    // Final tiebreaker: Goals against (fewer is better)
    return a.standing.goalsAgainst - b.standing.goalsAgainst;
  });
  
  // Take the best teams up to targetTeams
  return sortedAllTeams.slice(0, targetTeams).map((item, index) => ({
    ...item.team,
    qualified: true,
    qualificationRank: item.standing.position,
    overallRank: index + 1, // Add overall ranking
    groupName: item.groupName,
    finalPoints: item.standing.points,
    finalGoalDifference: item.standing.goalDifference,
    finalGoalsFor: item.standing.goalsFor
  }));
};

// Helper function to calculate optimal knockout bracket size
export const calculateOptimalBracketSize = (totalTeams: number): number => {
  // Always aim for standard tournament bracket sizes: 4, 8, 16, 32, etc.
  if (totalTeams <= 4) return 4;
  if (totalTeams <= 8) return 8;
  if (totalTeams <= 16) return 16;
  if (totalTeams <= 32) return 32;
  return 32; // Max supported size
};

export const getTournamentById = async (tournamentId: string): Promise<Tournament | null> => {
  try {
    const tournaments = await getTournaments();
    return tournaments.find(t => t.id === tournamentId) || null;
  } catch (error) {
    console.error('Error getting tournament by ID:', error);
    return null;
  }
};

// Group Stage Functions
export const generateGroups = async (tournamentId: string): Promise<void> => {
  try {
    const tournament = await getTournamentById(tournamentId);
    const members = await getTournamentMembers(tournamentId);

    if (!tournament || members.length === 0) {
      throw new Error('Tournament or members not found');
    }
    
  const { groupSize } = tournament.settings;
  const totalMembers = members.length;

  // Handle odd numbers - distribute evenly with minimum group size of 3
  const optimalGroups = Math.ceil(totalMembers / groupSize);
  const membersPerGroup = Math.floor(totalMembers / optimalGroups);
  const extraMembers = totalMembers % optimalGroups;

  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Shuffle members for random draw
  const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

  const groups: TournamentGroup[] = [];
  let memberIndex = 0;

  for (let i = 0; i < optimalGroups; i++) {
    // Some groups get an extra member to distribute remainder evenly
    const currentGroupSize = membersPerGroup + (i < extraMembers ? 1 : 0);
    const groupMembers = shuffledMembers.slice(memberIndex, memberIndex + currentGroupSize);
    memberIndex += currentGroupSize;
    
    // Only create group if it has at least 2 members
    if (groupMembers.length >= 2) {
      const groupMatches = generateGroupMatches(groupMembers, i);
      
      groups.push({
        id: `group_${groupNames[i]}`,
        name: `Group ${groupNames[i]}`,
        members: groupMembers,
        matches: groupMatches,
        standings: initializeGroupStandings(groupMembers)
      });
    }
  }
    
    // Update tournament with groups
    await updateTournament(tournamentId, {
      groups,
      status: 'group_stage'
    });
    
  } catch (error) {
    console.error('Error generating groups:', error);
    throw error;
  }
};

const generateGroupMatches = (
  teams: TournamentParticipant[],
  groupIndex: number
): GroupMatch[] => {

  const groupLetter = ['A','B','C','D','E','F','G','H'][groupIndex];

  const matches: GroupMatch[] = [];
  let matchday = 1;

  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {

      // First fixture
      matches.push({
        id: uuidv4(),
        groupId: `group_${groupLetter}`,
        homeTeam: teams[i].name,
        awayTeam: teams[j].name,
        played: false,
        matchday,
      });

      // Reverse fixture
      matches.push({
        id: uuidv4(),
        groupId: `group_${groupLetter}`,
        homeTeam: teams[j].name,
        awayTeam: teams[i].name,
        played: false,
        matchday: matchday + 1,
      });

      matchday += 2;
    }
  }

  return matches;
};


const initializeGroupStandings = (teams: TournamentParticipant[]): GroupStanding[] => {
  return teams.map(team => ({
    teamName: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    position: 0
  }));
};

// Match result recording
export const recordGroupMatch = async (
  tournamentId: string,
  groupId: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): Promise<void> => {
  try {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament || !tournament.groups) {
      throw new Error('Tournament or groups not found');
    }
    
    const groups = [...tournament.groups];
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) {
      throw new Error('Group not found');
    }
    
    const group = groups[groupIndex];
    
    // Update match result
    const matchIndex = group.matches.findIndex(
      m => m.homeTeam === homeTeam && m.awayTeam === awayTeam
    );
    
    if (matchIndex === -1) {
      throw new Error('Match not found');
    }
    
    group.matches[matchIndex] = {
      ...group.matches[matchIndex],
      homeScore,
      awayScore,
      played: true
    };
    
    // Update group standings
    group.standings = calculateGroupStandings(group.matches, group.members, tournament.settings);
    
    groups[groupIndex] = group;
    
    // Update tournament
    await updateTournament(tournamentId, { groups });
    
  } catch (error) {
    console.error('Error recording group match:', error);
    throw error;
  }
};

// 📝 Edit a recorded group match
export async function editGroupMatch(
  tournamentId: string,
  groupId: string,
  matchId: string,
  newHomeScore: number,
  newAwayScore: number
  ) {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament || !tournament.groups) throw new Error("Tournament not found");

    const updatedGroups = tournament.groups.map((group) => {
      if (group.id !== groupId) return group;

      const updatedMatches = group.matches.map((match) => {
        if (match.id !== matchId) return match;

        return {
          ...match,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          played: true,
        };
      });

      return { ...group, matches: updatedMatches };
    });

    await updateTournament(tournamentId, { groups: updatedGroups });

    console.log(`✅ Match ${matchId} updated successfully`);

    return true;
}


export const recordKnockoutMatch = async (
  tournamentId: string,
  tieId: string, 
  leg: 'first' | 'second',
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): Promise<void> => {
  try {
    // Get tournament and validate
    const tournament = await getTournamentById(tournamentId);
    if (!tournament || !tournament.knockoutBracket) {
      throw new Error('Tournament or knockout bracket not found');
    }

    // Find the specific tie
    const knockoutBracket = [...tournament.knockoutBracket];
    const tieIndex = knockoutBracket.findIndex(tie => tie.id === tieId);
    
    if (tieIndex === -1) {
      throw new Error('Tie not found in knockout bracket');
    }
    
    const tie = knockoutBracket[tieIndex];
    
    // Update the specific leg - FIXED: Only set defined values
    if (leg === 'first') {
      tie.firstLeg = {
        id: tie.firstLeg?.id || `${tieId}_leg1`,
        leg: 'first',
        homeTeam: tie.firstLeg?.homeTeam || homeTeam,
        awayTeam: tie.firstLeg?.awayTeam || awayTeam,
        homeScore: homeScore,
        awayScore: awayScore,
        played: true
      };
    } else {
      tie.secondLeg = {
        id: tie.secondLeg?.id || `${tieId}_leg2`,
        leg: 'second',
        homeTeam: tie.secondLeg?.homeTeam || homeTeam,
        awayTeam: tie.secondLeg?.awayTeam || awayTeam,
        homeScore: homeScore,
        awayScore: awayScore,
        played: true
      };
    }
    
    // Check if both legs are complete
    if (tie.firstLeg?.played && tie.secondLeg?.played) {
      // Calculate aggregate score
      const firstLegTeam1Goals = tie.firstLeg.homeTeam === tie.team1 ? 
        (tie.firstLeg.homeScore || 0) : (tie.firstLeg.awayScore || 0);
      const secondLegTeam1Goals = tie.secondLeg.homeTeam === tie.team1 ? 
        (tie.secondLeg.homeScore || 0) : (tie.secondLeg.awayScore || 0);
      
      const firstLegTeam2Goals = tie.firstLeg.homeTeam === tie.team2 ? 
        (tie.firstLeg.homeScore || 0) : (tie.firstLeg.awayScore || 0);
      const secondLegTeam2Goals = tie.secondLeg.homeTeam === tie.team2 ? 
        (tie.secondLeg.homeScore || 0) : (tie.secondLeg.awayScore || 0);
      
      const team1Goals = firstLegTeam1Goals + secondLegTeam1Goals;
      const team2Goals = firstLegTeam2Goals + secondLegTeam2Goals;
      
      // Set aggregate score
      tie.aggregateScore = {
        team1Goals: team1Goals,
        team2Goals: team2Goals
      };
      
      // Determine winner
      if (team1Goals > team2Goals) {
        tie.winner = tie.team1;
        tie.completed = true;
      } else if (team2Goals > team1Goals) {
        tie.winner = tie.team2;
        tie.completed = true;
      } else {
        // REPLAY NEEDED - aggregate is tied
        const replayTieNumber = (knockoutBracket.filter(t => t.round === tie.round).length) + 1;
        const replayId = `${tie.round}_replay_${replayTieNumber}_${Date.now()}`;
        
        const replayTie: KnockoutTie = {
          id: replayId,
          round: tie.round,
          team1: tie.team1,
          team2: tie.team2,
          firstLeg: {
            id: `${replayId}_leg1`,
            leg: 'first',
            homeTeam: tie.team1,
            awayTeam: tie.team2,
            played: false
          },
          secondLeg: {
            id: `${replayId}_leg2`,
            leg: 'second', 
            homeTeam: tie.team2,
            awayTeam: tie.team1,
            played: false
          },
          completed: false,
          tieNumber: replayTieNumber
        };
        
        // Only set these if tie.id exists
        if (tie.id) {
          replayTie.originalTieId = tie.id;
        }
        
        // Add replay tie to bracket
        knockoutBracket.push(replayTie);
        
        // Mark original as awaiting replay
        tie.awaitingReplay = true;
        tie.replayTieId = replayId;
      }

      // Check if current round is complete and generate next round
      if (tie.completed) {
        const currentRound = tie.round;
        const currentBracket = [...knockoutBracket];
        
        // Check if all ties in current round are complete
        if (isRoundComplete(currentBracket, currentRound)) {
          console.log(`${currentRound} is complete! Checking for next round...`);
          
          // Get winners from current round
          const winners = getRoundWinners(currentBracket, currentRound);
          console.log(`Winners from ${currentRound}:`, winners);
          
          // Determine next round
          const nextRound = getNextRound(currentRound);
          
          if (nextRound && winners.length >= 2) {
            console.log(`Generating ${nextRound} with ${winners.length} teams`);
            
            // Generate next round ties
            const nextRoundTies = generateNextRound(winners, nextRound);
            
            // Add next round ties to bracket
            knockoutBracket.push(...nextRoundTies);
            
            console.log(`Generated ${nextRoundTies.length} ties for ${nextRound}`);
          } else if (!nextRound && winners.length === 1) {
            // Tournament is complete!
            console.log('Tournament completed! Winner:', winners[0]);
            
            // You might want to update tournament status to 'completed' here
            // This would be an additional update after the main save
          }
        }
      }
    }
    
    // Update the tie in the bracket
    knockoutBracket[tieIndex] = tie;
    
    // Save to Firebase
    await updateTournament(tournamentId, { knockoutBracket: knockoutBracket });
    
  } catch (error) {
    console.error('Error recording knockout match:', error);
    throw error;
  }
};



// Replace your existing qualification logic with this:

// NEW: Get qualified teams for knockout with proper bracket sizing
export const getQualifiedTeamsForKnockout = (groups: TournamentGroup[]): TournamentParticipant[] => {
  const qualifiedTeams: TournamentParticipant[] = [];
  const thirdPlaceTeams: Array<{ team: TournamentParticipant; standing: GroupStanding; groupName: string }> = [];
  
  // Step 1: Get top 2 from each group (ALWAYS qualify)
  groups.forEach(group => {
    const sortedStandings = group.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    // Top 2 always qualify
    const first = sortedStandings[0];
    const second = sortedStandings[1];
    
    if (first) {
      const team = group.members.find(member => member.name === first.teamName);
      if (team) {
        qualifiedTeams.push({
          ...team,
          qualified: true,
          qualificationRank: 1,
          groupName: group.name,
          finalPoints: first.points,
          finalGoalDifference: first.goalDifference,
          finalGoalsFor: first.goalsFor
        });
      }
    }
    
    if (second) {
      const team = group.members.find(member => member.name === second.teamName);
      if (team) {
        qualifiedTeams.push({
          ...team,
          qualified: true,
          qualificationRank: 2,
          groupName: group.name,
          finalPoints: second.points,
          finalGoalDifference: second.goalDifference,
          finalGoalsFor: second.goalsFor
        });
      }
    }
    
    // Collect 3rd place teams for potential qualification
    const third = sortedStandings[2];
    if (third) {
      const team = group.members.find(member => member.name === third.teamName);
      if (team) {
        thirdPlaceTeams.push({
          team,
          standing: third,
          groupName: group.name
        });
      }
    }
  });
  
  // Step 2: Determine target bracket size
  const currentQualified = qualifiedTeams.length;
  console.log(`Currently qualified: ${currentQualified} teams (top 2 from each group)`);
  
  let targetBracketSize: number;
  if (currentQualified <= 4) {
    targetBracketSize = 4;
  } else if (currentQualified <= 8) {
    targetBracketSize = 8;
  } else if (currentQualified <= 16) {
    targetBracketSize = 16;
  } else {
    targetBracketSize = 32;
  }
  
  console.log(`Target bracket size: ${targetBracketSize}`);
  
  // Step 3: Fill remaining spots with best 3rd place teams
  const spotsToFill = targetBracketSize - currentQualified;
  console.log(`Need to fill ${spotsToFill} spots with best 3rd place teams`);
  
  if (spotsToFill > 0 && thirdPlaceTeams.length > 0) {
    // Sort 3rd place teams by points
    const sortedThirdPlace = thirdPlaceTeams.sort((a, b) => {
      if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
      if (b.standing.goalDifference !== a.standing.goalDifference) return b.standing.goalDifference - a.standing.goalDifference;
      return b.standing.goalsFor - a.standing.goalsFor;
    });
    
    // Take best 3rd place teams up to spots available
    const bestThirdPlace = sortedThirdPlace.slice(0, spotsToFill);
    
    bestThirdPlace.forEach((item, index) => {
      qualifiedTeams.push({
        ...item.team,
        qualified: true,
        qualificationRank: 3,
        overallRank: currentQualified + index + 1, // Overall ranking
        groupName: item.groupName,
        finalPoints: item.standing.points,
        finalGoalDifference: item.standing.goalDifference,
        finalGoalsFor: item.standing.goalsFor
      });
    });
    
    console.log(`Added ${bestThirdPlace.length} best 3rd place teams`);
  }
  
  console.log(`Final qualified teams: ${qualifiedTeams.length}`);
  return qualifiedTeams;
};

// NEW: Generate knockout bracket with proper sizing (NO BYES, NO PRELIMINARY ROUNDS)
export const generateKnockoutBracket = (
  qualifiedTeams: TournamentParticipant[]
): KnockoutTie[] => {
  const bracket: KnockoutTie[] = [];

  // 1️⃣ Separate by qualification rank
  const winners = qualifiedTeams.filter(t => t.qualificationRank === 1);
  const runnersUp = qualifiedTeams.filter(t => t.qualificationRank === 2);
  const others = qualifiedTeams.filter(t => t.qualificationRank && t.qualificationRank > 2);

  // Shuffle runners-up to randomize draw
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  let availableRunners = shuffle(runnersUp);

  const pairs: [TournamentParticipant, TournamentParticipant][] = [];

  for (const winner of winners) {
    // Find a runner-up NOT from same group
    let opponentIndex = availableRunners.findIndex(
      r => r.groupName !== winner.groupName
    );

    // If impossible (edge case), allow same-group
    if (opponentIndex === -1) opponentIndex = 0;

    const opponent = availableRunners[opponentIndex];
    availableRunners.splice(opponentIndex, 1);

    pairs.push([winner, opponent]);
  }

  // Add remaining teams (best 3rd etc.)
  const leftovers = [...availableRunners, ...others];
  for (let i = 0; i < leftovers.length; i += 2) {
    if (leftovers[i + 1]) {
      pairs.push([leftovers[i], leftovers[i + 1]]);
    }
  }

  // 2️⃣ Determine round
  const round =
    pairs.length === 8 ? "round_16" :
    pairs.length === 4 ? "quarter_final" :
    pairs.length === 2 ? "semi_final" :
    "final";

  // 3️⃣ Create ties
  pairs.forEach(([a, b], i) => {
    const tieId = `${round}_tie_${i + 1}`;

    bracket.push({
      id: tieId,
      round,
      team1: a.name,
      team2: b.name,
      firstLeg: {
        id: `${tieId}_leg1`,
        leg: "first",
        homeTeam: a.name,
        awayTeam: b.name,
        played: false
      },
      secondLeg: {
        id: `${tieId}_leg2`,
        leg: "second",
        homeTeam: b.name,
        awayTeam: a.name,
        played: false
      },
      completed: false,
      tieNumber: i + 1
    });
  });

  return bracket;
};


// 🧹 Remove a member completely from all groups and fixtures
export const removeMemberFromGroupsAndFixtures = async (
  tournamentId: string,
  memberName: string
): Promise<void> => {
  try {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament || !tournament.groups) return;

    const updatedGroups = tournament.groups.map((group) => {
      // Remove from standings
      const filteredStandings = group.standings.filter(
        (s) => s.teamName !== memberName
      );

      // Remove from matches
      const filteredMatches = group.matches.filter(
        (m) => m.homeTeam !== memberName && m.awayTeam !== memberName
      );

      // Remove from members list (if exists)
      const filteredMembers = group.members.filter(
        (m) => m.name !== memberName
      );

      return {
        ...group,
        standings: filteredStandings,
        matches: filteredMatches,
        members: filteredMembers,
      };
    });

    await updateTournament(tournamentId, { groups: updatedGroups });

    console.log(`🧹 Cleaned up ${memberName} from all groups and fixtures.`);
  } catch (error) {
    console.error("❌ Error cleaning up member from groups:", error);
  }
};


// UPDATED: Progression from group stage to knockout
export const progressToKnockoutStage = async (tournamentId: string): Promise<void> => {
  try {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament || !tournament.groups) {
      throw new Error('Tournament or groups not found');
    }
    
    // Get qualified teams with proper bracket sizing
    const qualifiedTeams = getQualifiedTeamsForKnockout(tournament.groups);
    
    if (qualifiedTeams.length === 0) {
      throw new Error('No teams qualified for knockout stage');
    }
    
    console.log(`Qualified teams:`, qualifiedTeams.map(t => `${t.name} (${t.groupName}, ${t.qualificationRank})`));
    
    // Generate knockout bracket
    const knockoutBracket = generateKnockoutBracket(qualifiedTeams);
    
    if (knockoutBracket.length === 0) {
      throw new Error('Failed to generate knockout bracket');
    }
    
    // Update tournament
    await updateTournament(tournamentId, {
      status: 'knockout',
      qualifiedTeams: qualifiedTeams,
      knockoutBracket: knockoutBracket
    });
    
    console.log(`Successfully progressed to knockout stage with ${qualifiedTeams.length} teams`);
    
  } catch (error) {
    console.error('Error progressing to knockout stage:', error);
    throw error;
  }
};

const calculateGroupStandings = (
  matches: GroupMatch[],
  teams: TournamentParticipant[],
  settings: TournamentSettings
): GroupStanding[] => {
  const standings: { [teamName: string]: GroupStanding } = {};
  
  // Initialize standings
  teams.forEach(team => {
    standings[team.name] = {
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      position: 0
    };
  });
  
  // Calculate from played matches
  matches.filter(m => m.played).forEach(match => {
    const homeStanding = standings[match.homeTeam];
    const awayStanding = standings[match.awayTeam];
    
    if (homeStanding && awayStanding && match.homeScore !== undefined && match.awayScore !== undefined) {
      // Update games played
      homeStanding.played++;
      awayStanding.played++;
      
      // Update goals
      homeStanding.goalsFor += match.homeScore;
      homeStanding.goalsAgainst += match.awayScore;
      awayStanding.goalsFor += match.awayScore;
      awayStanding.goalsAgainst += match.homeScore;
      
      // Update results and points
      if (match.homeScore > match.awayScore) {
        // Home win
        homeStanding.won++;
        awayStanding.lost++;
        homeStanding.points += settings.pointsForWin;
        awayStanding.points += settings.pointsForLoss;
      } else if (match.homeScore < match.awayScore) {
        // Away win
        awayStanding.won++;
        homeStanding.lost++;
        awayStanding.points += settings.pointsForWin;
        homeStanding.points += settings.pointsForLoss;
      } else {
        // Draw
        homeStanding.drawn++;
        awayStanding.drawn++;
        homeStanding.points += settings.pointsForDraw;
        awayStanding.points += settings.pointsForDraw;
      }
      
      // Update goal difference
      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;
    }
  });

  // Helper function to get best 3rd place teams
const getBest3rdPlaceTeams = (groups: TournamentGroup[], requiredTeams: number): TournamentParticipant[] => {
  // Collect all 3rd place teams
  const thirdPlaceTeams: Array<{ team: TournamentParticipant; standing: GroupStanding }> = [];
  
  groups.forEach(group => {
    const sortedStandings = group.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    const thirdPlace = sortedStandings[2]; // 3rd place team
    if (thirdPlace) {
      const team = group.members.find(member => member.name === thirdPlace.teamName);
      if (team) {
        thirdPlaceTeams.push({ team, standing: thirdPlace });
      }
    }
  });
  
  // Sort 3rd place teams and take the best ones
  const sortedThirdPlace = thirdPlaceTeams.sort((a, b) => {
    if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
    if (b.standing.goalDifference !== a.standing.goalDifference) return b.standing.goalDifference - a.standing.goalDifference;
    return b.standing.goalsFor - a.standing.goalsFor;
  });
  
  return sortedThirdPlace.slice(0, requiredTeams).map(item => ({
    ...item.team,
    qualified: true,
    qualificationRank: 3
  }));
};

// Helper function to calculate knockout bracket size
const calculateKnockoutSize = (totalGroups: number): number => {
  const top2Teams = totalGroups * 2; // Always take top 2 from each group
  
  // Determine ideal knockout bracket size
  if (top2Teams >= 16) return 16;
  if (top2Teams >= 8) return 8;
  if (top2Teams >= 4) return 4;
  return top2Teams;
};

  

  // Sort standings and assign positions
  const sortedStandings = Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  
  // Assign positions
  sortedStandings.forEach((standing, index) => {
    standing.position = index + 1;
  });
  
  return sortedStandings;
};

// Real-time listeners
export const subscribeToTournaments = (callback: (tournaments: Tournament[]) => void) => {
  const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tournaments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tournament));
    callback(tournaments);
  });
};

export const subscribeToTournamentMembers = (tournamentId: string, callback: (members: TournamentParticipant[]) => void) => {
  const q = query(collection(db, 'tournament_members'), where('tournamentId', '==', tournamentId));
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TournamentParticipant));
    callback(members);
  });
};

