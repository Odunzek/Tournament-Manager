// Pure UCL algorithm functions — no Firebase dependency.

export interface UCLPot {
  id: string;
  name: string;
}

export interface UCLMatch {
  id?: string;
  tournamentId: string;
  round: 'league_phase';
  leg: null;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  scoreA: number | null;
  scoreB: number | null;
  played: boolean;
  createdAt?: any;
}

export interface UCLStanding {
  memberId: string;
  playerName: string;
  potId: string;
  potName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  zone: 'direct' | 'playoff' | 'eliminated';
  form: ('W' | 'D' | 'L')[];
}

export function computeUCLCutoffs(n: number): {
  bracketSize: number;
  direct: number;
  playoffPool: number;
  eliminated: number;
} {
  let bracketSize = 4;
  for (let b = 8; b * 1.5 <= n; b *= 2) {
    bracketSize = b;
  }
  return {
    bracketSize,
    direct: bracketSize / 2,
    playoffPool: bracketSize,
    eliminated: Math.max(0, n - bracketSize / 2 - bracketSize),
  };
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SimplePlayer {
  id: string;
  name: string;
}

export function generateLeaguePhaseFixtures(
  pots: SimplePlayer[][],
  tournamentId: string
): Omit<UCLMatch, 'id' | 'createdAt'>[] {
  const matches: Omit<UCLMatch, 'id' | 'createdAt'>[] = [];
  const n = pots[0].length;
  const base = {
    tournamentId,
    round: 'league_phase' as const,
    leg: null as null,
    scoreA: null,
    scoreB: null,
    played: false,
  };

  // Same-pot: circular pairs, each pair plays both legs (home + away)
  // Each player faces 2 adjacent pot-mates, 2 legs each = 4 same-pot matches
  for (const pot of pots) {
    const shuffled = shuffleArray([...pot]);
    for (let i = 0; i < shuffled.length; i++) {
      const a = shuffled[i];
      const b = shuffled[(i + 1) % shuffled.length];
      matches.push({ ...base, playerAId: a.id, playerAName: a.name, playerBId: b.id, playerBName: b.name });
      matches.push({ ...base, playerAId: b.id, playerAName: b.name, playerBId: a.id, playerBName: a.name });
    }
  }

  // Cross-pot: 1-for-1 mapping, each pair plays both legs (home + away)
  // Each player faces 1 opponent per opposing pot, 2 legs each = 6 cross-pot matches
  for (let p1 = 0; p1 < pots.length; p1++) {
    for (let p2 = p1 + 1; p2 < pots.length; p2++) {
      const a = pots[p1];
      const b = shuffleArray([...pots[p2]]);
      for (let i = 0; i < n; i++) {
        matches.push({ ...base, playerAId: a[i].id, playerAName: a[i].name, playerBId: b[i].id, playerBName: b[i].name });
        matches.push({ ...base, playerAId: b[i].id, playerAName: b[i].name, playerBId: a[i].id, playerBName: a[i].name });
      }
    }
  }

  return matches;
}

export function computeLeagueStandings(
  matches: UCLMatch[],
  players: SimplePlayer[],
  potMap: Record<string, { potId: string; potName: string }>
): UCLStanding[] {
  const stats: Record<string, {
    memberId: string; playerName: string; potId: string; potName: string;
    played: number; won: number; drawn: number; lost: number;
    goalsFor: number; goalsAgainst: number; goalDifference: number; points: number;
    recentResults: ('W' | 'D' | 'L')[];
  }> = {};

  for (const p of players) {
    stats[p.id] = {
      memberId: p.id,
      playerName: p.name,
      potId: potMap[p.id]?.potId ?? '',
      potName: potMap[p.id]?.potName ?? '',
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      recentResults: [],
    };
  }

  const playedMatches = matches
    .filter(m => m.played && m.round === 'league_phase')
    .sort((a, b) => ((a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)));

  for (const m of playedMatches) {
    const a = stats[m.playerAId];
    const b = stats[m.playerBId];
    if (!a || !b) continue;

    const sA = m.scoreA ?? 0;
    const sB = m.scoreB ?? 0;
    a.played++; b.played++;
    a.goalsFor += sA; a.goalsAgainst += sB;
    b.goalsFor += sB; b.goalsAgainst += sA;

    if (sA > sB) {
      a.won++; a.points += 3; b.lost++;
      a.recentResults.unshift('W'); b.recentResults.unshift('L');
    } else if (sA === sB) {
      a.drawn++; a.points++; b.drawn++; b.points++;
      a.recentResults.unshift('D'); b.recentResults.unshift('D');
    } else {
      b.won++; b.points += 3; a.lost++;
      a.recentResults.unshift('L'); b.recentResults.unshift('W');
    }
  }

  const sorted = Object.values(stats)
    .map(s => ({ ...s, goalDifference: s.goalsFor - s.goalsAgainst }))
    .sort((a, b) =>
      (b.points - a.points) ||
      (b.goalDifference - a.goalDifference) ||
      (b.goalsFor - a.goalsFor) ||
      a.playerName.localeCompare(b.playerName)
    );

  return sorted.map((s, i) => {
    const { recentResults, ...rest } = s;
    return {
      ...rest,
      position: i + 1,
      zone: 'playoff' as const,
      form: recentResults.slice(0, 5),
    };
  });
}

export function applyZones(
  standings: UCLStanding[],
  cutoffs: ReturnType<typeof computeUCLCutoffs>
): UCLStanding[] {
  return standings.map((s, i) => ({
    ...s,
    zone: i < cutoffs.direct
      ? 'direct'
      : i >= standings.length - cutoffs.eliminated
        ? 'eliminated'
        : 'playoff',
  }));
}

export function pickKnockoutRound(playerCount: number): string {
  if (playerCount >= 16) return 'round_16';
  if (playerCount >= 8) return 'quarter_final';
  if (playerCount >= 4) return 'semi_final';
  return 'final';
}
