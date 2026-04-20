# FIFA League Manager — Project Specification

> Version: 1.0 | Date: April 2, 2026 | Status: SaaS Planning Phase

---

## Table of Contents

1. [What It Is](#1-what-it-is)
2. [Core Features](#2-core-features)
3. [Pages & Routes](#3-pages--routes)
4. [Data Models](#4-data-models)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Authentication Flow](#6-authentication-flow)
7. [Tech Stack](#7-tech-stack)
8. [SaaS Transformation Notes](#8-saas-transformation-notes)

---

## 1. What It Is

**FIFA League Manager** is a web application for organizing and tracking competitive FIFA (EA FC) gaming leagues. It is currently a single-tenant admin tool — one admin manages one community. The goal is to transform it into a **multi-tenant SaaS platform** where any gaming community can sign up and run their own leagues, tournaments, seasons, and player rankings.

### Current Use Case
A group of FIFA players in a private gaming community use this to:
- Run round-robin leagues with live standings
- Organize tournaments (knockout, group stage, Champions League format)
- Track player achievements, titles, and Hall of Fame status
- Maintain a P4P (pound-for-pound) ranking list
- Group everything under "seasons" tied to EA FC game versions (e.g., FC 26 Season 1)

---

## 2. Core Features

### 2.1 Seasons

Seasons act as the top-level container for all activity. Each season maps to a specific EA FC game version.

- **Create/edit/delete seasons** (admin only)
- Season statuses: `setup` → `active` → `completed`
- Each season has a slug (URL-friendly ID), name, game version, start/end dates, and description
- Season detail page shows aggregated stats: total leagues, tournaments, matches, active players
- All leagues, tournaments, and player achievements are scoped to a season

---

### 2.2 League Management

The primary feature. Leagues are round-robin competitions where every player faces every other player.

#### Creation & Settings
- Admin creates a league with: name, season, start/end dates, rules/notes, and initial player roster
- Total matches auto-calculated: `n × (n-1) / 2`
- League statuses: `upcoming` → `active` → `completed`

#### Standings
Calculated in real-time from match results:

| Column | Description |
|--------|-------------|
| Pos | Current rank |
| P | Matches played |
| W / D / L | Wins, draws, losses |
| GF / GA | Goals for / against |
| GD | Goal difference |
| Pts | Points (W=3, D=1, L=0) |
| Form | Last 5 results (W/D/L) |

**Tiebreaker order**: Points → Goal Difference → Goals For → Alphabetical

#### Point Adjustments
Admin can apply manual bonus/deduction points to any player with a reason and timestamp. Shown in standings and tracked historically.

#### Lifecycle Actions (admin)
- Record match results (score + date)
- Edit existing match scores
- Add / remove players from roster
- End league → marks as `completed`, awards title to the points leader
- Delete league

---

### 2.3 Tournament System

Supports three competition formats:

| Format | Description |
|--------|-------------|
| `league` | Round-robin, everyone plays everyone |
| `knockout` | Single-elimination bracket |
| `groups_knockout` | Group stage → knockout (Champions League style) |

**Tournament lifecycle**: `setup` → `group_stage` → `knockout` → `completed`

**Features**:
- Automatic group generation and round-robin fixture scheduling
- Two-legged knockout ties with aggregate score tracking
- Auto-advancing winners through bracket rounds
- Replay handling for drawn aggregate ties
- Admin records group and knockout match results
- Full fixture list, group standings tables, and bracket visualization

---

### 2.4 Player Management

All participants in leagues and tournaments are stored as player profiles.

#### Player Profile Fields
- Name, PSN ID (gaming handle), optional avatar image

#### Achievement Tracking
| Achievement | Description |
|------------|-------------|
| League Wins | Count of league titles won |
| Tournament Wins | Count of tournament titles won |
| Total Titles | Sum of the above |
| Season Achievements | Per-season breakdown of titles |

#### Hall of Fame Tiers (auto-calculated)
| Tier | Threshold | Badge |
|------|-----------|-------|
| Veteran | 1–4 titles | 🎖️ |
| Champion | 5–9 titles | ⭐ |
| Legend | 10+ titles | 👑 |

#### Player Actions
- Create / edit / delete (admin only)
- View profile with full achievement history
- Compare two players head-to-head (win/draw/loss across shared matches, with season filter)
- View in Hall of Fame with tier badge

---

### 2.5 Hall of Fame

Dedicated page celebrating top players.

- All-time records: most league wins, most tournament wins, most titles, current champion
- Tier sections: Legends, Champions, Veterans
- Season filter: View inductees specific to a given season
- Recent inductees display
- Admin can remove a player from a seasonal Hall of Fame entry

---

### 2.6 P4P Rankings

A drag-and-drop ranking list maintained by admins.

- Admin reorders players by dragging cards
- Rankings sync in real-time to all viewers
- Cool-off tracking: prevents same player from being challenged/challenging too frequently
- Wild card system: special challenge opportunities
- Changes persist immediately to Firestore

---

### 2.7 Match History

- Global match history page across all leagues
- Per-league match history
- Filter by player, date, result type
- Supports both legacy match format (`homeTeam`/`awayTeam` text) and current format (player ID references)

---

### 2.8 Player Comparison

- Select any two players from the player roster
- View head-to-head stats: wins, draws, losses
- Filter by season
- View shared match history between the two players

---

## 3. Pages & Routes

```
/                           Home — navigation hub
/seasons                    Seasons list (search, filter by status)
/seasons/[slug]             Season detail (linked leagues, tournaments, stats)
/leagues                    Leagues list (search, filter by season/status)
/leagues/[id]               League detail
  → Overview                Info, progress, recent results, admin actions
  → Standings               Live points table with form
  → Results                 All completed matches
  → Streaks & Stats         Win streaks, unbeaten runs, form analysis
  → Record Match            Admin: add new match result
  → Add Players             Admin: manage player roster
  → Edit League             Admin: edit settings
/tournaments                Tournaments list (search, filter)
/tournaments/[id]           Tournament detail
  → Overview                Info and stats
  → Groups                  Group standings tables
  → Fixtures                Full fixture list
  → Teams                   Participant management
  → Knockout                Bracket visualization
  → Results                 Completed match records
/players                    Players list (search, sort by titles/name/recent)
/players/[id]               Player profile with achievements, season breakdown
/players/compare            Head-to-head player comparison
/rankings                   P4P rankings (drag-to-reorder for admins)
/hall-of-fame               Hall of Fame by tier + all-time records + season filter
/match-history              Global match history with filters
/admin/migrate-players      Admin: legacy data migration tool
```

---

## 4. Data Models

### `seasons`
```
id: string
slug: string                     // URL-friendly, e.g. "fc-26-season-1"
name: string                     // e.g. "FC 26 — Season 1"
gameVersion: string              // e.g. "FC 26"
status: 'setup' | 'active' | 'completed'
startDate: Timestamp
endDate?: Timestamp
description?: string
stats:
  totalLeagues: number
  totalTournaments: number
  totalMatches: number
  activePlayers: number
createdAt: Timestamp
updatedAt: Timestamp
```

### `leagues`
```
id: string
name: string
season: string                   // display name
seasonId?: string                // reference to seasons doc
status: 'active' | 'upcoming' | 'completed'
startDate: Timestamp
endDate?: Timestamp
playerIds: string[]
totalMatches: number             // calculated: n*(n-1)/2
matchesPlayed: number
rules?: string
pointAdjustments?: {
  [playerId]: LeaguePointAdjustment[]
}
createdAt: Timestamp
updatedAt: Timestamp
```

### `leagueMatches`
```
id: string
leagueId: string
playerA: string                  // player ID
playerAName: string              // denormalized
playerB: string
playerBName: string
scoreA: number
scoreB: number
date: Timestamp
winner?: string | null           // null = draw
played: boolean
```

### `tournaments`
```
id: string
name: string
type: 'league' | 'knockout' | 'groups_knockout'
status: 'setup' | 'group_stage' | 'knockout' | 'completed'
seasonId?: string
startDate: Timestamp
endDate?: Timestamp
numberOfTeams: number
numberOfGroups?: number
currentRound?: string
createdAt: Timestamp
updatedAt: Timestamp
```

### `tournament_members`
```
id: string
tournamentId: string
groupId?: string
name: string
// + stats fields per format
```

### `players`
```
id: string
name: string
psnId: string
avatar?: string
achievements:
  leagueWins: number
  tournamentWins: number
  totalTitles: number
  tier: 'legend' | 'champion' | 'veteran' | null
  inductionDate?: string         // ISO timestamp
seasonAchievements: {
  [seasonId]: {
    leagueWins: number
    tournamentWins: number
    titles: string[]             // title descriptions
  }
}
createdAt: Timestamp
updatedAt: Timestamp
```

### `rankings`
```
id: string
memberId: string
name: string
rank: number
coolOff?: string
wildCard?: string
updatedAt: Timestamp
```

### `LeaguePointAdjustment` (embedded)
```
id: string                       // UUID
amount: number                   // positive = bonus, negative = deduction
reason: string
timestamp: Timestamp
adjustedBy: string               // admin identifier
```

---

## 5. User Roles & Permissions

Currently two roles:

### Regular User (Anonymous/Viewer)
Read-only access to everything:
- View leagues, standings, match history
- View tournaments, fixtures, brackets
- View player profiles and stats
- View Hall of Fame, P4P rankings, seasons
- Toggle dark/light theme

### Admin (Authenticated via Google OAuth + email whitelist)
Full write access:
- Create / edit / delete leagues, tournaments, seasons, players
- Record and edit match results
- Add / remove players from leagues and tournaments
- Apply point adjustments (bonus/deduction)
- End leagues and award titles
- Manage P4P rankings (drag-to-reorder)
- Set seasonal player achievements
- Manage Hall of Fame entries
- Run data migration tools

**Current access control**: Email whitelist via `NEXT_PUBLIC_ADMIN_EMAILS` environment variable. Any Google account not in the list is immediately signed out.

---

## 6. Authentication Flow

```
App Load
  └── Firebase anonymous sign-in (read-only state)

Admin Login
  1. User opens login modal
  2. Clicks Google Sign-In
  3. Google OAuth popup
  4. Firebase authenticates user
  5. Email checked against whitelist
     ├── Authorized → isAuthenticated = true, admin UI unlocks
     └── Not authorized → immediate signOut, ACCESS_DENIED error

Admin Logout
  └── Firebase signOut → falls back to anonymous state
```

**Key files**:
- `frontend/my-app/src/lib/AuthContext.tsx` — manages auth state
- `frontend/my-app/src/lib/firebase.ts` — Firebase initialization

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.4 (App Router) |
| UI Library | React 19.1 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Language | TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| Real-time | Firestore `onSnapshot()` subscriptions |
| ID Generation | UUID |
| Deployment | Vercel / Firebase Hosting |

**Data flow pattern**: All standings, streaks, and stats are calculated **client-side** from raw match documents fetched via real-time Firestore subscriptions. No server-side aggregation layer currently exists.

---

## 8. SaaS Transformation Notes

This section captures key architectural gaps to address when converting to a multi-tenant SaaS platform.

### What Needs to Change

| Area | Current State | SaaS State Needed |
|------|--------------|-------------------|
| Tenancy | Single community, single Firestore root | Multi-tenant: each org gets isolated data |
| Auth | Email whitelist per deployment | Role-based per org (owner, admin, viewer) |
| Admin | One admin per deployment | Multiple admins per org, with invites |
| Billing | N/A | Subscription tiers (free/pro/etc.) |
| Onboarding | Manual setup | Self-serve signup → org creation → invite members |
| Branding | Hard-coded "FIFA League Manager" | Custom org name, logo |
| Data isolation | All data in shared root collections | `orgs/{orgId}/...` nested or separate Firebase project per tenant |
| Environment config | Single `.env` with admin emails | Database-driven org config |
| URL structure | Single domain | Subdomains (`myclub.fifaleague.app`) or path-based (`/org/myclub`) |

### Potential Subscription Tiers

| Tier | Limits | Features |
|------|--------|----------|
| Free | 1 active league, 10 players | Core leagues only |
| Pro | Unlimited leagues + tournaments | All features, custom branding |
| Club | Multiple admins, API access | White-label, priority support |

### Key Technical Decisions Needed

1. **Data architecture**: Nested Firestore subcollections under `orgs/{orgId}` vs. top-level collections with `orgId` field on every document
2. **Auth provider**: Stay with Firebase Auth (add custom claims for roles) vs. migrate to Clerk/Auth0 for richer org/role management
3. **Billing**: Stripe integration for subscription management
4. **Subdomain routing**: Next.js middleware for `[tenant].domain.com` routing
5. **Admin panel**: Separate super-admin view to manage all orgs, flag abuse, view usage

---

*This document is a living spec — update as decisions are made during the SaaS planning phase.*
