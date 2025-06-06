// Ensure all enums are properly exported

import { ScoringSettings } from './scoring';

// Convert CategoryType from type to enum
export enum CategoryType {
  MENS = 'MENS',
  WOMENS = 'WOMENS',
  MIXED = 'MIXED',
  OPEN = 'OPEN',
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM',
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  TEAM = 'TEAM'
}

export enum GameType {
  BADMINTON = 'BADMINTON',
  TENNIS = 'TENNIS', 
  PICKLEBALL = 'PICKLEBALL',
  VOLLEYBALL = 'VOLLEYBALL',
  SQUASH = 'SQUASH',
  TABLE_TENNIS = 'TABLE_TENNIS',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN'
}

export enum Division {
  JUNIORS = 'JUNIORS',
  SENIORS = 'SENIORS',
  OPEN = 'OPEN',
  MENS = 'MENS',
  WOMENS = 'WOMENS',
  MIXED = 'MIXED',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PRO = 'PRO',
  CUSTOM = 'CUSTOM',
  INITIAL = 'INITIAL'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS', 
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DEFERRED = 'DEFERRED'
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUP_KNOCKOUT = 'GROUP_KNOCKOUT',
  SWISS = 'SWISS',
  CUSTOM = 'CUSTOM',
  MULTI_STAGE = 'MULTI_STAGE'
}

export enum PlayType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  MIXED = 'MIXED'
}

export enum CourtStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  SCOREKEEPER = 'scorekeeper',
  PLAYER = 'player',
  SPECTATOR = 'spectator',
  DIRECTOR = 'director',
  FRONT_DESK = 'front_desk',
  ADMIN_STAFF = 'admin_staff'
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PUBLISHED = 'PUBLISHED'
}

export enum TournamentStageEnum {
  GROUP_STAGE = 'GROUP_STAGE',
  DIVISION_PLACEMENT = 'DIVISION_PLACEMENT',
  PLAYOFF_KNOCKOUT = 'PLAYOFF_KNOCKOUT',
  INITIAL_ROUND = 'INITIAL_ROUND',
  ELIMINATION_ROUND = 'ELIMINATION_ROUND',
  FINALS = 'FINALS',
  REGISTRATION = 'REGISTRATION',
  SEEDING = 'SEEDING'
}

// Define RegistrationStatus here as the canonical source
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  WAITLISTED = 'WAITLISTED',
  CHECKED_IN = 'CHECKED_IN',
  WITHDRAWN = 'WITHDRAWN',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

// Alias for backward compatibility
export type TournamentRegistrationStatus = RegistrationStatus;

// Audit log types
export enum AuditLogType {
  MATCH_CREATED = 'MATCH_CREATED',
  MATCH_UPDATED = 'MATCH_UPDATED',
  MATCH_DELETED = 'MATCH_DELETED',
  MATCH_STARTED = 'MATCH_STARTED',
  MATCH_COMPLETED = 'MATCH_COMPLETED',
  SCORE_UPDATED = 'SCORE_UPDATED',
  MATCH_CANCELLED = 'MATCH_CANCELLED'
}

// Notification types
export enum NotificationType {
  GENERAL = 'GENERAL',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MATCH_REMINDER = 'MATCH_REMINDER',
  SCORE_UPDATE = 'SCORE_UPDATE',
  REGISTRATION_CONFIRMATION = 'REGISTRATION_CONFIRMATION',
  WAITLIST_PROMOTION = 'WAITLIST_PROMOTION',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER'
}

// Add Division interface
export interface DivisionConfig {
  id: string;
  name: string;
  type: Division;
  capacity?: number;
  categories?: any[];
  min_age?: number;
  max_age?: number;
  gender?: string;
  skill_level?: string;
}

export interface TournamentFormatConfig {
  type: TournamentFormat;
  stages: TournamentStageEnum[];
  scoring: ScoringSettings;
  divisions: Division[];
  thirdPlaceMatch?: boolean;
  seedingEnabled?: boolean;
}

