# Data Model Documentation

## Overview

This document provides comprehensive documentation of the CourtMaster Tournament Management System data model, including all entities, relationships, and data structures.

## Core Type Definitions

### Enums and Constants

```ts
export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS_SYSTEM = 'swiss_system',
  GROUP_KNOCKOUT = 'group_knockout',
  MULTI_STAGE = 'multi_stage'
}

export enum TournamentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum CourtStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved'
}

export enum NotificationType {
  MATCH_UPDATE = 'match_update',
  SCHEDULE_CHANGE = 'schedule_change',
  TOURNAMENT_START = 'tournament_start',
  REGISTRATION_OPEN = 'registration_open',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

export enum SportType {
  BADMINTON = 'badminton',
  TENNIS = 'tennis',
  VOLLEYBALL = 'volleyball',
  TABLE_TENNIS = 'table_tennis'
}

export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type CategoryType = 'singles' | 'doubles' | 'mixed' | 'team';
```

## Core Entities

### Tournament

```ts
interface Tournament {
  id: string;
  name: string;
  description?: string;
  sportType: SportType;
  format: TournamentFormat;
  status: TournamentStatus;
  currentStage: number;
  maxParticipants?: number;
  startDate: string; // ISO 8601 UTC timestamp
  endDate?: string; // ISO 8601 UTC timestamp
  registrationDeadline?: string; // ISO 8601 UTC timestamp
  venue?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  categories: CategoryReference[];
  settings: TournamentSettings;
  createdBy: string;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
  version: number; // For optimistic locking
}

interface TournamentSettings {
  scoringSettings: ScoringSettings;
  scheduleSettings: ScheduleSettings;
  registrationSettings: RegistrationSettings;
  advancementRules?: AdvancementRules;
}

interface CategoryReference {
  id: string;
  name: string;
  type: CategoryType;
}
```

### Match

```ts
interface Match {
  id: string;
  tournamentId: string;
  categoryId: string;
  round: number;
  matchNumber: number;
  teams: TeamReference[];
  scores?: MatchScore;
  sportType: SportType;
  courtId?: string;
  scheduledTime?: string; // ISO 8601 UTC timestamp
  actualStartTime?: string; // ISO 8601 UTC timestamp
  actualEndTime?: string; // ISO 8601 UTC timestamp
  status: MatchStatus;
  winnerId?: string; // Must be one of the team IDs
  notes?: string;
  metadata: MatchMetadata;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
}

interface TeamReference {
  id: string;
  name: string;
  seed?: number;
}

interface MatchScore {
  sets: SetScore[];
  currentSet: number;
  isComplete: boolean;
  winnerId?: string;
  finalScore?: string; // Human-readable final score
}

interface SetScore {
  setNumber: number;
  team1Points: number;
  team2Points: number;
  isComplete: boolean;
  winnerId?: string;
  duration?: number; // Duration in minutes
}

interface MatchMetadata {
  version: number;
  lastUpdatedBy: string;
  lastUpdateTimestamp: string; // ISO 8601 UTC timestamp
  updateId: string; // Unique identifier for this update
  scoringHistory?: ScoringEvent[];
}

interface ScoringEvent {
  timestamp: string; // ISO 8601 UTC timestamp
  teamId: string;
  points: number;
  setNumber: number;
  eventType: 'point_scored' | 'point_removed' | 'set_completed';
  scorerId: string;
}
```

### Team

```ts
interface Team {
  id: string;
  name: string;
  tournamentId: string;
  categoryId: string;
  players: PlayerReference[];
  seed?: number;
  initialRanking?: number;
  registrationDate: string; // ISO 8601 UTC timestamp
  checkedIn: boolean;
  checkedInAt?: string; // ISO 8601 UTC timestamp
  waiverStatus: WaiverStatus;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  notes?: string;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
}

interface PlayerReference {
  id: string;
  name: string;
  role?: 'captain' | 'player' | 'substitute';
}

enum WaiverStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  NOT_REQUIRED = 'not_required'
}
```

### Court

```ts
interface Court {
  id: string;
  name: string;
  number: number;
  tournamentId: string;
  status: CourtStatus;
  sportType: SportType;
  currentMatchId?: string;
  currentMatchSummary?: {
    matchId: string;
    teams: string[];
    currentScore: string;
    startTime: string; // ISO 8601 UTC timestamp
    estimatedEndTime?: string; // ISO 8601 UTC timestamp
  };
  specifications?: {
    surface?: string;
    dimensions?: {
      length: number;
      width: number;
      unit: 'feet' | 'meters';
    };
    equipment?: string[];
  };
  location?: string;
  maintenanceNotes?: string;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
}
```

### Player

```ts
interface Player {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile?: PlayerProfile;
  waiversSigned: WaiverRecord[];
  tournaments: TournamentParticipation[];
  preferences?: PlayerPreferences;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
}

interface PlayerProfile {
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dateOfBirth?: string; // ISO 8601 date (YYYY-MM-DD)
  skillLevel?: string;
  dominantHand?: 'left' | 'right' | 'ambidextrous';
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
    email?: string;
  };
  medicalInfo?: {
    allergies?: string[];
    medications?: string;
    conditions?: string;
  };
}

interface WaiverRecord {
  waiverId: string;
  signedAt: string; // ISO 8601 UTC timestamp
  ipAddress?: string;
  version: number;
}

interface TournamentParticipation {
  tournamentId: string;
  teamId: string;
  role: 'player' | 'captain' | 'substitute';
  joinedAt: string; // ISO 8601 UTC timestamp
}

interface PlayerPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  timezone: string;
  language: string;
}
```

### Tournament Template

```ts
interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  sportType: SportType;
  format: TournamentFormat;
  version: number;
  migrationPath?: string[]; // Array of migration function names
  settings: {
    categories: TournamentCategory[];
    scoringRules: ScoringSettings;
    scheduleSettings: ScheduleSettings;
    registrationSettings: RegistrationSettings;
  };
  defaultCourts: number;
  estimatedDuration: number; // In hours
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
}
```

### Scoring Configuration

```ts
interface ScoringSettings {
  pointsPerSet: number;
  setsToWin: number;
  minimumLeadToWin: number;
  maxPointsPerSet?: number;
  deuceBehavior: 'two_point_lead' | 'sudden_death' | 'traditional';
  tiebreakRules?: TiebreakRules;
  sportSpecificRules: Record<string, any>;
}

interface TiebreakRules {
  enabled: boolean;
  pointsToWin: number;
  minimumLead: number;
  appliesAt?: number; // Set score when tiebreak kicks in
}

interface AdvancementRules {
  qualification: {
    method: 'top_n' | 'percentage' | 'points_threshold';
    value: number;
  };
  seeding: {
    method: 'ranking' | 'random' | 'manual';
    preserveSeeds: boolean;
  };
}
```

### Notification System

```ts
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: Priority;
  read: boolean;
  readAt?: string; // ISO 8601 UTC timestamp
  data?: Record<string, any>; // Additional notification data
  channels: NotificationChannel[];
  createdAt: string; // ISO 8601 UTC timestamp
  expiresAt?: string; // ISO 8601 UTC timestamp
}

interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  sent: boolean;
  sentAt?: string; // ISO 8601 UTC timestamp
  error?: string;
}
```

### Announcement System

```ts
interface Announcement {
  id: string;
  tournamentId?: string; // Global announcements if null
  title: string;
  message: string;
  priority: Priority;
  targetAudience: AudienceFilter;
  displayStart: string; // ISO 8601 UTC timestamp
  displayEnd?: string; // ISO 8601 UTC timestamp
  isActive: boolean;
  createdBy: string;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
  viewCount: number;
  reactions?: AnnouncementReaction[];
}

interface AudienceFilter {
  roles?: string[];
  categories?: string[];
  teams?: string[];
  all?: boolean;
}

interface AnnouncementReaction {
  userId: string;
  type: 'like' | 'important' | 'question';
  timestamp: string; // ISO 8601 UTC timestamp
}
```

### Waiver System

```ts
interface Waiver {
  id: string;
  title: string;
  content: string; // HTML content
  version: number;
  tournamentId?: string; // Tournament-specific waiver
  isDefault: boolean;
  isActive: boolean;
  requiresWitness: boolean;
  fields: WaiverField[];
  createdBy: string;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
  expiresAfter?: number; // Days until expiration
}

interface WaiverField {
  id: string;
  type: 'text' | 'checkbox' | 'signature' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[]; // For select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface WaiverSignature {
  id: string;
  waiverId: string;
  playerId: string;
  signatureData: string; // Base64 encoded signature image
  formData: Record<string, any>;
  witnessInfo?: {
    name: string;
    signature: string;
    timestamp: string; // ISO 8601 UTC timestamp
  };
  ipAddress: string;
  userAgent: string;
  signedAt: string; // ISO 8601 UTC timestamp
  isValid: boolean;
}
```

## Event Bus Schema

```ts
interface EventMap {
  // Match Events
  'match:created': { matchId: string; tournamentId: string };
  'match:updated': { matchId: string; score: MatchScore; updatedBy: string };
  'match:completed': { matchId: string; winnerId: string; finalScore: string };
  'match:started': { matchId: string; courtId: string; timestamp: string };
  'match:cancelled': { matchId: string; reason: string };

  // Tournament Events
  'tournament:created': { tournamentId: string; createdBy: string };
  'tournament:started': { tournamentId: string; timestamp: string };
  'tournament:completed': { tournamentId: string; winnerId?: string };
  'tournament:stage_advanced': { tournamentId: string; newStage: number };

  // Court Events
  'court:assigned': { courtId: string; matchId: string; timestamp: string };
  'court:released': { courtId: string; previousMatchId: string };
  'court:status_changed': { courtId: string; oldStatus: CourtStatus; newStatus: CourtStatus };

  // Team Events
  'team:registered': { teamId: string; tournamentId: string; timestamp: string };
  'team:checked_in': { teamId: string; timestamp: string; checkedInBy: string };
  'team:waiver_completed': { teamId: string; waiverId: string; timestamp: string };

  // System Events
  'notification:created': { notificationId: string; userId: string; type: NotificationType };
  'announcement:published': { announcementId: string; tournamentId?: string };
  'sync:conflict_detected': { entityType: string; entityId: string; conflictType: string };
  'sync:resolution_applied': { entityType: string; entityId: string; strategy: string };
}
```

## Database Indexes and Performance

### Appwrite Collections and Indexes

```ts
interface CollectionSchema {
  name: string;
  indexes: DatabaseIndex[];
  relationships: Relationship[];
}

interface DatabaseIndex {
  name: string;
  attributes: string[];
  type: 'key' | 'fulltext' | 'unique';
  orders?: ('ASC' | 'DESC')[];
}

// Tournament Collection
const tournamentIndexes: DatabaseIndex[] = [
  { name: 'status_created', attributes: ['status', 'createdAt'], type: 'key', orders: ['ASC', 'DESC'] },
  { name: 'creator_status', attributes: ['createdBy', 'status'], type: 'key' },
  { name: 'date_range', attributes: ['startDate', 'endDate'], type: 'key' },
  { name: 'sport_format', attributes: ['sportType', 'format'], type: 'key' }
];

// Match Collection
const matchIndexes: DatabaseIndex[] = [
  { name: 'tournament_status', attributes: ['tournamentId', 'status'], type: 'key' },
  { name: 'court_schedule', attributes: ['courtId', 'scheduledTime'], type: 'key' },
  { name: 'team_lookup', attributes: ['teams'], type: 'key' },
  { name: 'round_number', attributes: ['tournamentId', 'round'], type: 'key' }
];

// Team Collection
const teamIndexes: DatabaseIndex[] = [
  { name: 'tournament_category', attributes: ['tournamentId', 'categoryId'], type: 'key' },
  { name: 'checkin_status', attributes: ['tournamentId', 'checkedIn'], type: 'key' },
  { name: 'waiver_status', attributes: ['tournamentId', 'waiverStatus'], type: 'key' }
];

// Player Collection
const playerIndexes: DatabaseIndex[] = [
  { name: 'email_unique', attributes: ['email'], type: 'unique' },
  { name: 'tournament_participation', attributes: ['tournaments.tournamentId'], type: 'key' },
  { name: 'name_search', attributes: ['name'], type: 'fulltext' }
];
```

## Data Validation Rules

### Entity Validation

```ts
interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
}

// Tournament Validation
const tournamentValidation: ValidationRule[] = [
  { field: 'name', type: 'required', message: 'Tournament name is required' },
  { field: 'startDate', type: 'format', message: 'Start date must be ISO 8601 format' },
  { field: 'endDate', type: 'custom', message: 'End date must be after start date',
    validator: (tournament) => !tournament.endDate || new Date(tournament.endDate) > new Date(tournament.startDate) }
];

// Match Validation
const matchValidation: ValidationRule[] = [
  { field: 'teams', type: 'custom', message: 'Must have exactly 2 teams',
    validator: (match) => match.teams && match.teams.length === 2 },
  { field: 'winnerId', type: 'custom', message: 'Winner must be one of the participating teams',
    validator: (match) => !match.winnerId || match.teams.some(team => team.id === match.winnerId) }
];
```

This data model documentation provides a comprehensive overview of all entities, their relationships, and the underlying database structure used in the CourtMaster Tournament Management System.