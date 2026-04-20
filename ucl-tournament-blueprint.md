# UCL Tournament Format — Implementation Blueprint

## What This Is

A "Champions League" style tournament format with 4 seeded pots, a combined league phase, a qualification playoff, and a 2-legged knockout stage. All business logic lives in the application layer — the database just stores rows.

---

## Part 1 — Data Model

### Collections (Firestore equivalent of tables)

**`tournaments`**
```
id: string
name: string
format: 'knockout' | 'groups_knockout' | 'ucl'
status: 'setup' | 'league_phase' | 'playoff' | 'knockout' | 'completed'
numTeams: number         // max capacity
numGroups: number        // always 4 for UCL
twoLegged: boolean       // true for UCL knockout (always 2-legged)
orgId: string
seasonId: string | null
rules: string | null
createdAt: timestamp
```

**`tournament_groups`** (stores pots for UCL, groups for other formats)
```
id: string
tournamentId: string
orgId: string
name: string             // "Pot 1", "Pot 2", "Pot 3", "Pot 4"
createdAt: timestamp
```

**`tournament_players`**
```
id: string
tournamentId: string
orgId: string
userId: string
groupId: string | null   // pot assignment after draw
seeding: number | null   // 1-based, only set for direct qualifiers after league phase
eliminated: boolean      // true if player didn't qualify from playoff/league phase
createdAt: timestamp
```

**`tournament_matches`**
```
id: string
tournamentId: string
orgId: string
groupId: string | null   // null for UCL matches (groupId is for groups_knockout format only)
round: string | null     // 'league_phase' | 'playoff' | 'round_16' | 'quarter_final' | 'semi_final' | 'final' | '{round}_replay'
leg: number | null       // 1 or 2 for two-legged ties, null for single-leg
playerAId: string        // home player
playerBId: string        // away player
scoreA: number | null
scoreB: number | null
played: boolean
createdAt: timestamp
```

---

## Part 2 — State Machine

```
setup
  ↓  admin clicks "Draw Pots" → seeding modal → confirm
league_phase
  ↓  all league matches played → admin clicks "Generate Playoffs"
playoff
  ↓  all playoff matches played → admin clicks "Generate Knockout"
knockout
  ↓  each knockout round completed → admin clicks "Generate Next Round"
completed
```

**State validation guards:**
- `setup → league_phase`: playerCount >= 8, playerCount % 4 === 0
- `league_phase → playoff`: every match with `round === 'league_phase'` has `played === true`
- `playoff → knockout`: every match with `round === 'playoff'` has `played === true`
- `knockout → completed`: final tie resolved (aggregate winner determined)

---

## Part 3 — Core Algorithms

### 3.1 Cutoff Calculation

Run this after league phase standings are computed to decide how many players go direct vs. playoff vs. eliminated.

```typescript
function computeUCLCutoffs(n: number) {
  let bracketSize = 4
  for (let b = 8; b * 1.5 <= n; b *= 2) {
    bracketSize = b
  }
  return {
    bracketSize,
    direct: bracketSize / 2,
    playoffPool: bracketSize,
    eliminated: Math.max(0, n - bracketSize / 2 - bracketSize),
  }
}
```

| Players | Direct | Playoff Pool | Eliminated |
|---------|--------|--------------|------------|
| 8       | 2      | 4            | 2          |
| 12      | 2      | 4            | 6          |
| 16      | 4      | 8            | 4          |
| 24      | 8      | 16           | 0          |
| 32      | 16     | 32           | 0          |

### 3.2 Pot Distribution (PPG Seeding)

PPG = points-per-game × 100 stored as integer (display: divide by 100).

```typescript
function distributeIntoPots(players: Player[], ppgMap: Record<string, number>): Player[][] {
  const sorted = [...players].sort((a, b) => (ppgMap[b.id] ?? 0) - (ppgMap[a.id] ?? 0))
  const pots: Player[][] = [[], [], [], []]
  // Round-robin distribution: player 0 → pot 0, player 1 → pot 1, etc.
  sorted.forEach((p, i) => pots[i % 4].push(p))
  return pots
}
```

Admin can manually reorder players between pots in the seeding modal before confirming.

### 3.3 League Phase Fixture Generation

**Input:** 4 pots of equal size `n` (e.g. 4 pots of 4 = 16 players, 4 pots of 6 = 24 players).

Each player ends up with exactly **8 fixtures**: 2 within their own pot, 2 against each of the 3 other pots.

```typescript
function generateLeaguePhaseFixtures(pots: Player[][]): Match[] {
  const matches: Match[] = []
  const n = pots[0].length
  const offset = Math.ceil(n / 2)

  // Step A: Same-pot fixtures (2 per player)
  for (const pot of pots) {
    const shuffled = shuffle([...pot])
    for (let i = 0; i < shuffled.length; i++) {
      const a = shuffled[i]
      const b = shuffled[(i + 1) % shuffled.length]
      matches.push({ playerAId: a.id, playerBId: b.id, round: 'league_phase' })
      matches.push({ playerAId: b.id, playerBId: a.id, round: 'league_phase' })
    }
  }

  // Step B: Cross-pot fixtures (2 per player per opposing pot)
  for (let p1 = 0; p1 < pots.length; p1++) {
    for (let p2 = p1 + 1; p2 < pots.length; p2++) {
      const a = pots[p1]
      const b = shuffle([...pots[p2]])
      for (let i = 0; i < n; i++) {
        const opp1 = b[i]
        const opp2 = b[(i + offset) % n]
        // Permutation 1: a[i] home
        matches.push({ playerAId: a[i].id, playerBId: opp1.id, round: 'league_phase' })
        // Permutation 2: a[i] away (home/away swapped)
        matches.push({ playerAId: opp2.id, playerBId: a[i].id, round: 'league_phase' })
      }
    }
  }

  return matches
}
```

> **Why the cyclic offset?** Using `i % b.length` (not `Math.min`) ensures every player in the larger pot gets fixtures even when pot sizes aren't perfectly equal.

### 3.4 League Phase Standings

Computed in-memory from match results. Sort order: Points → Goal Difference → Goals For → Name (A-Z).

```typescript
function computeStandings(matches: Match[], players: Player[]) {
  const stats: Record<string, Stats> = {}
  players.forEach(p => {
    stats[p.id] = { id: p.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
  })

  for (const m of matches.filter(m => m.played)) {
    const a = stats[m.playerAId]
    const b = stats[m.playerBId]
    a.played++; b.played++
    a.gf += m.scoreA; a.ga += m.scoreB
    b.gf += m.scoreB; b.ga += m.scoreA
    if (m.scoreA > m.scoreB) { a.won++; a.points += 3; b.lost++ }
    else if (m.scoreA === m.scoreB) { a.drawn++; a.points++; b.drawn++; b.points++ }
    else { b.won++; b.points += 3; a.lost++ }
  }

  return Object.values(stats).sort((a, b) =>
    (b.points - a.points) ||
    ((b.gf - b.ga) - (a.gf - a.ga)) ||
    (b.gf - a.gf) ||
    a.name.localeCompare(b.name)
  )
}
```

### 3.5 Playoff Generation

After standings are computed:

1. Run `computeUCLCutoffs(n)` where `n` is total players
2. Top `direct` players → mark with `seeding = 1, 2, 3...` in order
3. Next `playoffPool` players → playoff pool (seeding = null)
4. Remaining → mark `eliminated = true`
5. Shuffle playoff pool into random pairs → write match rows with `round = 'playoff'`, `leg = 1` and `leg = 2`

### 3.6 Two-Legged Aggregate Calculation

**Home/Away convention:**
- Leg 1: `playerAId` = home, `playerBId` = away
- Leg 2: **swap** — `playerAId` = original away (now home), `playerBId` = original home (now away)

**Aggregate for originalPlayerA:** `leg1.scoreA + leg2.scoreB`  
**Aggregate for originalPlayerB:** `leg1.scoreB + leg2.scoreA`

### 3.7 Playoff Winner Determination (Critical — Read Carefully)

The naive approach of sorting player IDs to build a canonical key **fails** when `idA > idB`. Use a two-pass tally keyed from leg 1:

```typescript
type Tally = { idA: string; idB: string; goalsA: number; goalsB: number }
const tallies: Record<string, Tally> = {}

// Pass 1: seed from leg 1 (playerA is always the leg-1 home player)
for (const m of leg1Matches) {
  const key = `${m.playerAId}:${m.playerBId}`
  tallies[key] = {
    idA: m.playerAId,
    idB: m.playerBId,
    goalsA: m.scoreA ?? 0,
    goalsB: m.scoreB ?? 0,
  }
}

// Pass 2: leg 2 has home/away swapped vs leg 1
// In leg 2: playerAId is the leg-1 away player, playerBId is the leg-1 home player
for (const m of leg2Matches) {
  const key = `${m.playerBId}:${m.playerAId}` // reversed = original leg-1 key
  if (tallies[key]) {
    tallies[key].goalsA += m.scoreB ?? 0 // idA was away in leg 2
    tallies[key].goalsB += m.scoreA ?? 0 // idB was away in leg 2
  }
}

const winners = Object.values(tallies).map(({ idA, idB, goalsA, goalsB }) =>
  goalsA >= goalsB ? idA : idB
)
const deduped = [...new Set(winners)] // guard against duplicate IDs
```

### 3.8 Knockout Bracket Generation

**Input:** Direct qualifiers (sorted by `seeding` 1–N) + playoff winners (in determination order).

**Pairing:** `directQualifiers[i]` vs `playoffWinners[i]`

**Round mapping:**
```typescript
function pickRound(playerCount: number): string {
  if (playerCount >= 16) return 'round_16'
  if (playerCount >= 8) return 'quarter_final'
  if (playerCount >= 4) return 'semi_final'
  return 'final'
}
```

All knockout matches are 2-legged. Write leg 1 and leg 2 as two separate match documents.

### 3.9 Advancing Knockout Rounds

After each round, check all ties:

1. If `leg1.played && leg2.played` → compute aggregate → winner advances
2. If aggregate is tied → create `'{round}_replay'` match rows (lazy, on demand)
3. If any tie has no result yet → show "waiting" state, block advance button
4. Once all ties resolved → collect winners → `pickRound(winners.length)` → write new match rows

---

## Part 4 — Seeding Modal UX

**Flow:** Admin clicks "Draw Pots" → modal opens pre-populated with PPG order → admin can drag/tap-to-move players between pots → "Confirm Draw" writes all data.

**Modal state:**
```typescript
pots: Player[][]                       // mutable 4-element array
selected: { potIdx, playerId } | null  // for tap-then-tap mobile UX
defaultPots: Player[][]                // original PPG order for "Reset" button
ppgMap: Record<string, number>         // display: (ppg / 100).toFixed(2)
```

**Validation before confirm:**
- All 4 pots must have equal size
- Min 2 players per pot (min 8 total)

---

## Part 5 — UI Sections Required

| Section | Shows when |
|---------|-----------|
| Overview | Always — admin action buttons by status |
| Pot Draw / Teams | `setup` — enroll players, show seeding modal |
| League Phase | `league_phase` — unified standings across all pots |
| Fixtures | All statuses — record match results |
| Playoff | `playoff` and beyond — tie cards with aggregate |
| Knockout | `knockout` and beyond — bracket by round |

**Standings display (league phase):**
- Single table, all players ranked together
- Top `direct` rows highlighted (green border)
- Bottom `eliminated` rows grayed out
- Show pot label per row (Pot 1 / Pot 2 etc.)

**Knockout tie card:**
- Collapsed: player A vs player B + aggregate score
- Expanded: Leg 1 row + Leg 2 row + score inputs
- Trophy icon on winner side
- Leg 2 locked until Leg 1 is played

---

## Part 6 — Firestore-Specific Implementation Notes

Since this targets Firestore (not PostgreSQL/Supabase), adapt as follows:

1. **No SQL RPCs** — compute standings, bracket assembly, and aggregate calculation entirely in the application layer. All algorithms above are pure in-memory functions — no DB logic required.

2. **Standings calculation** — fetch all `tournament_matches` where `tournamentId == X` and `round == 'league_phase'`, then run `computeStandings()` client-side or in a Cloud Function.

3. **Bracket query** — fetch all matches where `tournamentId == X` and `round` is one of the knockout rounds, group by `(playerAId, playerBId)` pair, sort by `leg` to assemble ties.

4. **Canonical pair key for tie grouping** — when grouping matches into ties from Firestore results, use a **leg-1-anchored key** (not sorted IDs). The leg 1 match defines who is `playerA` (home) and `playerB` (away). Match leg 2 by checking: `m.playerAId === leg1.playerBId && m.playerBId === leg1.playerAId`.

5. **Batch writes** — fixture generation creates many documents at once. Use `WriteBatch` (max 500 writes per batch) and chunk if needed:
   ```typescript
   const BATCH_SIZE = 400
   for (let i = 0; i < matches.length; i += BATCH_SIZE) {
     const batch = db.batch()
     matches.slice(i, i + BATCH_SIZE).forEach(m => {
       batch.set(db.collection('tournament_matches').doc(), m)
     })
     await batch.commit()
   }
   ```

6. **Atomic status transitions** — use Firestore transactions when updating tournament status + writing new match documents together, to prevent partial state.

---

## Part 7 — Validation Guards (All Required)

| Guard | When to enforce |
|-------|----------------|
| playerCount >= 8 | Before allowing UCL draw |
| playerCount % 4 === 0 | Before allowing UCL draw |
| All league matches played | Before "Generate Playoffs" |
| All playoff matches played | Before "Generate Knockout" |
| playoffPool count is even | Before generating playoff bracket |
| No aggregate tie unresolved | Before advancing knockout round |
| Duplicate winners deduped | After playoff winner determination |
| eliminated count floored to 0 | In `computeUCLCutoffs` |

---

## Part 8 — Implementation Order

1. Write `computeUCLCutoffs()` — pure function, testable in isolation
2. Write `computeStandings()` — pure function
3. Write `generateLeaguePhaseFixtures()` — pure function; log output and verify each player has exactly 8 matches
4. Build the seeding modal UI
5. Wire confirm draw → create groups → assign players → write fixtures → set status `league_phase`
6. Build league phase standings view
7. Wire generate playoffs → standings → cutoffs → mark seedings → write playoff matches
8. Build playoff tie card UI (handle 2-legged aggregate display)
9. Wire generate knockout → determine playoff winners (two-pass key) → write knockout matches
10. Build knockout bracket UI per round
11. Wire generate next round → aggregate check → replay creation → next round write
12. Wire complete tournament → final winner → award title
