# Tournament Section Documentation

## Overview

The Tournament section is a comprehensive module for managing football tournaments with group stages, knockout rounds, fixtures, and results. It features a modern tech-inspired UI with sidebar navigation, responsive design, and smooth animations.

---

## Table of Contents

1. [Features](#features)
2. [File Structure](#file-structure)
3. [Pages](#pages)
4. [Components](#components)
5. [Data Types](#data-types)
6. [Usage Examples](#usage-examples)
7. [Firebase Integration](#firebase-integration)

---

## Features

### Core Features
- ✅ Tournament list with search and filtering
- ✅ Tournament creation and management
- ✅ Group stage standings with live updates
- ✅ Fixture scheduling and match results
- ✅ Knockout bracket visualization
- ✅ Comprehensive results tracking
- ✅ Team roster management
- ✅ Responsive sidebar/bottom navigation
- ✅ Mobile-optimized tables with expandable rows
- ✅ Tech-inspired animations and transitions

### Tournament Types Supported
- **League Format**: Round-robin competition
- **Knockout Format**: Single/double elimination
- **Groups + Knockout**: Champions League-style (most common)

---

## File Structure

```
src/
├── app/
│   └── tournaments/
│       ├── page.tsx                    # Tournament list page
│       └── [id]/
│           └── page.tsx                # Tournament detail page
│
├── components/
│   └── tournaments/
│       ├── TournamentSidebar.tsx       # Navigation component
│       ├── TournamentCard.tsx          # Tournament card for list
│       ├── MatchCard.tsx               # Match display card
│       ├── StandingsTable.tsx          # Group standings table
│       ├── StatusBadge.tsx             # Status indicator
│       ├── RecordResultModal.tsx       # Match result modal
│       └── sections/
│           ├── Overview.tsx            # Tournament overview
│           ├── Groups.tsx              # Group standings
│           ├── Fixtures.tsx            # Match fixtures
│           ├── Teams.tsx               # Team roster
│           ├── Knockout.tsx            # Knockout bracket
│           └── Results.tsx             # Match results
│
└── types/
    └── tournament.ts                   # TypeScript interfaces
```

---

## Pages

### 1. Tournament List (`/tournaments`)

Main tournament listing page with search, filter, and creation capabilities.

**Features:**
- Grid layout for tournament cards
- Search by tournament name
- Filter by status (all, active, upcoming, completed)
- Create new tournament button
- Statistics summary

**Example:**
```tsx
import TournamentsPage from '@/app/tournaments/page';

// Automatically displays all tournaments with filters
<TournamentsPage />
```

### 2. Tournament Detail (`/tournaments/[id]`)

Individual tournament page with section-based navigation.

**Features:**
- Sidebar navigation (desktop) / Bottom tabs (mobile)
- 6 main sections: Overview, Groups, Fixtures, Teams, Knockout, Results
- Smooth transitions between sections
- Back navigation to tournament list

**Sections:**

#### Overview
- Tournament details and metadata
- Quick statistics (matches, goals, etc.)
- Progress indicator
- Recent highlights
- Quick actions (Edit, Delete, End Tournament)

#### Groups
- Tab-based group selection
- Standings table for each group
- Highlight top 2 positions
- Mobile-friendly expandable rows
- Qualification info

#### Fixtures
- Upcoming and completed matches
- Search and filter functionality
- Record result button for upcoming matches
- Match status indicators
- Date/time display

#### Teams
- Grid view of all teams
- Team statistics and standings
- Group assignment
- Search and filter by group
- Hover effects

#### Knockout
- Round-based navigation (R16, QF, SF, Final)
- Match cards for each tie
- Two-legged match support
- Bracket overview diagram
- Final match special styling

#### Results
- Chronological match results
- Filter by round
- Statistics summary
- Export functionality
- Date grouping

---

## Components

### Tournament Components

#### TournamentCard
Displays tournament information in a card format.

**Props:**
```tsx
interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<TournamentCard
  tournament={tournament}
  onClick={() => handleClick(tournament.id)}
/>
```

---

#### MatchCard
Displays match information with scores and status.

**Props:**
```tsx
interface MatchCardProps {
  match: Match;
  showGroup?: boolean;
  showDate?: boolean;
  onRecordResult?: (matchId: string) => void;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<MatchCard
  match={match}
  showGroup
  showDate
  onRecordResult={handleRecordResult}
/>
```

---

#### StandingsTable
Displays group standings with responsive design.

**Props:**
```tsx
interface StandingsTableProps {
  standings: GroupStanding[];
  groupName?: string;
  highlightPositions?: number[];
  expandable?: boolean;
}
```

**Usage:**
```tsx
<StandingsTable
  standings={groupStandings}
  groupName="Group A"
  highlightPositions={[1, 2]}
  expandable
/>
```

**Features:**
- Desktop: Full table view
- Mobile: Expandable card view
- Highlighted positions (qualifying spots)
- Form indicators
- Sortable columns

---

#### StatusBadge
Displays tournament or match status with appropriate styling.

**Props:**
```tsx
interface StatusBadgeProps {
  status: TournamentStatus | MatchStatus;
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage:**
```tsx
<StatusBadge status="active" />
<StatusBadge status="completed" />
```

---

#### RecordResultModal
Modal for recording match results.

**Props:**
```tsx
interface RecordResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSubmit: (result: MatchResult) => void;
}
```

**Usage:**
```tsx
<RecordResultModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  match={selectedMatch}
  onSubmit={handleSubmitResult}
/>
```

---

#### TournamentSidebar
Navigation sidebar for tournament sections.

**Props:**
```tsx
interface TournamentSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  tournamentId: string;
}
```

**Features:**
- Desktop: Fixed left sidebar
- Mobile: Bottom tab navigation
- Active section highlighting
- Smooth transitions
- Icon-based navigation

---

## Data Types

### Core Types

```typescript
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
  form?: string[];
}
```

See `src/types/tournament.ts` for complete type definitions.

---

## Usage Examples

### Example 1: Creating a Tournament Page

```tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TournamentCard from '@/components/tournaments/TournamentCard';
import { Tournament } from '@/types/tournament';

export default function MyTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const handleTournamentClick = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onClick={() => handleTournamentClick(tournament.id)}
        />
      ))}
    </div>
  );
}
```

### Example 2: Displaying Group Standings

```tsx
import StandingsTable from '@/components/tournaments/StandingsTable';
import { GroupStanding } from '@/types/tournament';

const standings: GroupStanding[] = [
  {
    teamId: '1',
    teamName: 'Team A',
    played: 3,
    won: 3,
    drawn: 0,
    lost: 0,
    goalsFor: 10,
    goalsAgainst: 2,
    goalDifference: 8,
    points: 9,
    position: 1,
  },
  // ... more teams
];

export default function GroupView() {
  return (
    <StandingsTable
      standings={standings}
      groupName="Group A"
      highlightPositions={[1, 2]}
      expandable
    />
  );
}
```

### Example 3: Recording Match Result

```tsx
import { useState } from 'react';
import RecordResultModal from '@/components/tournaments/RecordResultModal';
import { Match, MatchResult } from '@/types/tournament';

export default function MatchManager() {
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const handleSubmitResult = async (result: MatchResult) => {
    // Submit to Firebase
    await updateMatchResult(result);
    setShowModal(false);
  };

  return (
    <>
      {selectedMatch && (
        <RecordResultModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          match={selectedMatch}
          onSubmit={handleSubmitResult}
        />
      )}
    </>
  );
}
```

---

## Firebase Integration

### Collections Structure

```
tournaments/
  {tournamentId}/
    - name
    - type
    - status
    - startDate
    - endDate
    - numberOfTeams
    - numberOfGroups
    - currentRound
    - createdAt
    - updatedAt

tournaments/{tournamentId}/groups/
  {groupId}/
    - name
    - teams[]

tournaments/{tournamentId}/matches/
  {matchId}/
    - homeTeamId
    - homeTeamName
    - awayTeamId
    - awayTeamName
    - homeScore
    - awayScore
    - status
    - scheduledDate
    - groupId
    - round
    - knockoutRound
    - playedAt

tournaments/{tournamentId}/standings/
  {groupId}/
    teams/
      {teamId}/
        - played
        - won
        - drawn
        - lost
        - goalsFor
        - goalsAgainst
        - goalDifference
        - points
```

### Example Firebase Queries

```typescript
// Get all tournaments
const tournamentsRef = collection(db, 'tournaments');
const tournamentsSnap = await getDocs(tournamentsRef);

// Get tournament by ID
const tournamentRef = doc(db, 'tournaments', tournamentId);
const tournamentSnap = await getDoc(tournamentRef);

// Get matches for tournament
const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);
const matchesSnap = await getDocs(matchesRef);

// Get group standings
const standingsRef = collection(db, `tournaments/${tournamentId}/standings/${groupId}/teams`);
const standingsSnap = await getDocs(standingsRef);

// Update match result
const matchRef = doc(db, `tournaments/${tournamentId}/matches`, matchId);
await updateDoc(matchRef, {
  homeScore: result.homeScore,
  awayScore: result.awayScore,
  status: 'completed',
  playedAt: new Date(),
});
```

---

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
  - Bottom tab navigation
  - Expandable table rows
  - Stacked layouts
  - Single column grids

- **Tablet**: 768px - 1024px
  - 2-column grids
  - Sidebar visible
  - Compact tables

- **Desktop**: > 1024px
  - 3-column grids
  - Full sidebar
  - Full table views
  - Bracket diagrams

### Mobile Optimizations

1. **Navigation**: Bottom tabs instead of sidebar
2. **Tables**: Expandable cards with key stats
3. **Brackets**: Horizontal scroll for knockout view
4. **Modals**: Full-screen on small devices
5. **Touch Targets**: Minimum 44px for all interactive elements

---

## Animations

All components use Framer Motion for smooth animations:

- **Page transitions**: Fade + slide
- **Card hovers**: Lift + glow
- **Tab switches**: Cross-fade
- **Table rows**: Stagger animation
- **Modals**: Scale + fade
- **Status badges**: Pulse for live matches

---

## Best Practices

1. **Always fetch fresh data**: Tournament data changes frequently
2. **Use optimistic updates**: Update UI before Firebase confirms
3. **Handle loading states**: Show skeletons while loading
4. **Validate input**: Check scores before submission
5. **Mobile first**: Design for mobile, enhance for desktop
6. **Accessibility**: Use proper ARIA labels and keyboard navigation
7. **Error handling**: Show user-friendly error messages

---

## Future Enhancements

- [ ] Live match updates via WebSocket
- [ ] Goal scorers tracking
- [ ] Player statistics
- [ ] Match commentary
- [ ] Video highlights
- [ ] Push notifications for match results
- [ ] Tournament templates
- [ ] Export to PDF/CSV
- [ ] Social sharing
- [ ] Advanced analytics

---

**Last Updated:** December 2024
**Version:** 1.0.0
