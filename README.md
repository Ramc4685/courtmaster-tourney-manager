# Badminton Tournament Manager

## 1. System Overview

### 1.1 Product Description
The Badminton Tournament Manager is a specialized software platform designed for organizing, managing, and scoring badminton tournaments. It provides a comprehensive solution for tournament organizers, coaches, and players to manage all aspects of tournament operations, from team registration to live scoring and bracket management.

### 1.2 Core Features
- Tournament creation with multiple format options
- Team and player management
- Court assignment and monitoring
- Real-time scoring and match updates
- Bracket visualization and management
- Multi-stage tournament progression
- Category-based tournament organization

### 1.3 Technical Architecture
The application is built using a modern React architecture with:

- State management through Zustand store
- Component-based UI with Tailwind CSS and Shadcn UI
- Modular service architecture for tournament operations
- Real-time updates through a polling mechanism
- Client-side data persistence through localStorage

### 1.4 User Roles
- Tournament Organizer: Full access to create and manage tournaments
- Scorer: Access to scoring interface for updating match scores
- Viewer: Read-only access to view tournament brackets and results

## 2. Tournament Management

### 2.1 Creating a Tournament
To create a new tournament:

1. Navigate to the Tournaments page
2. Click "Create New Tournament" button
3. Fill in the tournament details:
   - Name
   - Description
   - Format (Single Elimination, Double Elimination, etc.)
   - Start date
   - Court details
   - Categories (Men's Singles, Women's Doubles, etc.)
4. Click "Create" to initialize the tournament

### 2.2 Tournament Formats

#### 2.2.1 Single Elimination
A knockout tournament where participants are eliminated after one loss.

- Best for: Quick tournaments with limited time
- Features: Bracket visualization, optional third-place playoff
- Configuration: Enable/disable consolation matches, seeding options

#### 2.2.2 Double Elimination
Participants must lose twice to be eliminated from the tournament.

- Best for: Providing second chances while maintaining competitive integrity
- Features: Winners and losers brackets, "true final" option
- Configuration: Reset option for grand final, bracket layout

#### 2.2.3 Round Robin
Every participant plays against every other participant once.

- Best for: Small groups where maximum play time is desired
- Features: Automated scheduling, standings calculation, tiebreaker rules
- Configuration: Points for win/draw/loss, custom tiebreaker rules

#### 2.2.4 Swiss System
Participants play opponents with similar records but don't play the same opponent twice.

- Best for: Medium to large tournaments with limited time
- Features: Dynamic pairing algorithm, configurable rounds
- Configuration: Number of rounds, initial seeding method

#### 2.2.5 Group Knockout
Initial round-robin groups followed by knockout stages.

- Best for: Large tournaments requiring preliminary filtering
- Features: Configurable group size, qualification rules
- Configuration: Groups count, teams per group, advancing teams count

#### 2.2.6 Multi-Stage
Combines multiple formats in sequential stages.

- Best for: Complex tournaments with division progression
- Features: Stage progression, division placement
- Configuration: Format for each stage, promotion/relegation rules

### 2.3 Tournament Lifecycle
Tournaments progress through several stages:

- DRAFT: Initial setup, adding teams and configuration
- PUBLISHED: Tournament visible to participants but not started
- IN_PROGRESS: Active tournament with ongoing matches
- COMPLETED: All matches finished, results finalized

Each stage allows different operations (e.g., adding teams is restricted after PUBLISHED).

### 2.4 Tournament Categories
Categories help organize different competition types within a tournament:

- Standard categories: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- Custom categories: Create custom categories with specific rules
- Category-specific settings: Each category can have its own scoring rules and format

## 3. Team & Player Management

### 3.1 Adding Teams

1. Navigate to the Teams tab within a tournament
2. Click "Add Team" button
3. Enter team details:
   - Name
   - Players (1-2 depending on category)
   - Initial ranking (optional)
   - Category assignment
4. Click "Save" to add the team

### 3.2 Team Categories
Teams are assigned to categories which determine:

- Match types (singles or doubles)
- Scoring rules
- Tournament progression

### 3.3 Importing Teams
For large tournaments, batch import teams:

1. Navigate to the Teams tab
2. Click "Import Teams"
3. Use CSV template or paste data
4. Match columns to required fields
5. Review and confirm import

### 3.4 Seeding & Rankings
Teams can be seeded based on:

- Initial rankings provided during registration
- Manual seeding assignment
- Auto-seeding based on previous results

## 4. Match Management

### 4.1 Scheduling Matches
Matches can be scheduled:

- Automatically based on tournament format
- Manually by creating individual matches
- Batch scheduling with time slots

To schedule a match:

1. Navigate to the Matches tab
2. Click "Schedule Match" or "Auto Schedule"
3. Select teams, time, and court
4. Set category if applicable
5. Save to create the match

### 4.2 Match Statuses
Matches progress through several statuses:

- SCHEDULED: Match is created but not started
- IN_PROGRESS: Match is currently being played
- COMPLETED: Match has finished with a result
- CANCELLED: Match was cancelled

### 4.3 Auto-Scheduling
The system can automatically schedule matches:

1. Navigate to Schedule tab
2. Select "Auto Schedule"
3. Configure parameters:
   - Time blocks
   - Court availability
   - Match duration
   - Break times
4. Review generated schedule
5. Confirm or adjust as needed

## 5. Court Management

### 5.1 Adding Courts

1. Navigate to Courts tab
2. Click "Add Court"
3. Enter court details:
   - Name
   - Number
   - Location (optional)
4. Save to create the court

### 5.2 Court Statuses
Courts have different status indicators:

- AVAILABLE: Ready for match assignment
- IN_USE: Currently hosting a match
- MAINTENANCE: Temporarily unavailable

### 5.3 Court Assignment
Matches can be assigned to courts:

- Manually by selecting a court for each match
- Automatically through the auto-assignment feature
- In real-time during tournament operations

### 5.4 Auto Court Assignment

1. Navigate to Courts tab
2. Click "Auto Assign Courts"
3. System will assign available courts to scheduled matches
4. Review assignments and adjust if needed

## 6. Scoring System

### 6.1 Live Scoring Interface
The scoring interface allows real-time score updates:

1. Select court from the courts view
2. View match details
3. Use + and - buttons to update scores
4. System automatically tracks sets and match completion

### 6.2 Scoring Rules Configuration
Configure scoring settings for tournaments or specific categories:

- Points per set (typically 21 for badminton)
- Number of sets (typically best of 3)
- Points needed to win a set
- Two-point lead requirement
- Maximum score (for extended play)

### 6.3 Match Completion
When a match is completed:

- System validates the score against rules
- Winner is determined automatically
- Tournament brackets are updated
- Court becomes available
- Next scheduled match can begin

### 6.4 Set Management
Managing sets during a match:

- Current set is displayed prominently
- Completed sets are shown with final scores
- New sets are started automatically or manually
- Set history is maintained for the match record

## 7. Data Model

### 7.1 Core Entities

#### 7.1.1 Tournament
```typescript
Tournament {
  id: string
  name: string
  description?: string
  format: TournamentFormat
  status: TournamentStatus
  currentStage: TournamentStage
  teams: Team[]
  matches: Match[]
  courts: Court[]
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
  categories: TournamentCategory[]
}
```

#### 7.1.2 Match
```typescript
Match {
  id: string
  tournamentId: string
  team1: Team
  team2: Team
  scores: MatchScore[]
  division: Division
  stage: TournamentStage
  courtNumber?: number
  scheduledTime?: Date
  status: MatchStatus
  winner?: Team
  loser?: Team
  category: TournamentCategory
}
```

#### 7.1.3 Team
```typescript
Team {
  id: string
  name: string
  players: Player[]
  seed?: number
  initialRanking?: number
  category?: TournamentCategory
}
```

#### 7.1.4 Court
```typescript
Court {
  id: string
  name: string
  number: number
  status: CourtStatus
  currentMatch?: Match
}
```

#### 7.1.5 Player
```typescript
Player {
  id: string
  name: string
  email?: string
  phone?: string
}
```

#### 7.1.6 TournamentCategory
```typescript
TournamentCategory {
  id: string
  name: string
  type: CategoryType
  description?: string
  format?: TournamentFormat
  scoringSettings?: ScoringSettings
}
```

### 7.2 State Management
The application uses a Zustand store structure with:

- Tournament store for overall tournament data
- Scoring store for match scoring operations
- Context providers for sharing data across components

## 8. Troubleshooting

### 8.1 Common Issues

#### Match scores not updating:
- Check network connection
- Verify scoring permissions
- Ensure the match is in IN_PROGRESS state

#### Court assignment conflicts:
- Check for overlapping schedules
- Verify court status is AVAILABLE
- Clear any "ghost" assignments manually

#### Tournament bracket not advancing:
- Verify all required matches are completed
- Check match results for validation errors
- Try manual advancement if automatic fails

### 8.2 Data Recovery
The system maintains data in:

- Local storage for offline operations
- Real-time service for multi-user environments

To recover data:

- Check browser storage for cached tournament data
- Use the export feature to backup tournament data regularly
- Contact support for assistance with data recovery

## 9. Best Practices

### 9.1 Tournament Setup
- Create categories before adding teams
- Configure scoring settings early
- Add courts before scheduling matches
- Use meaningful naming conventions for easy identification

### 9.2 During Tournament
- Assign dedicated scorers for busy courts
- Regularly check for scheduling conflicts
- Announce schedule changes to participants
- Backup tournament data periodically

### 9.3 After Tournament
- Complete all matches before finalizing
- Export results for record-keeping
- Generate reports for participants
- Collect feedback for future improvements

## 10. Glossary of Terms

- Bracket: Visual representation of tournament progression
- Category: Type of competition (e.g., Men's Singles)
- Court: Physical location where matches are played
- Division: Grouping of teams based on skill/qualification
- Format: Structure determining how matches are organized
- Match: Contest between two teams/players
- Seed: Initial ranking position in tournament
- Set: Subdivision of a match (typically best of 3 in badminton)
- Stage: Phase of tournament progression
- Team: A single player or pair of players competing together
