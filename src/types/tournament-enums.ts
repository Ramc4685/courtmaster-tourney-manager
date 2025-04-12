
// Tournament format enums
export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS',
  GROUP_KNOCKOUT = 'GROUP_KNOCKOUT',
  MULTI_STAGE = 'MULTI_STAGE',
  CUSTOM = 'CUSTOM'
}

// Game type enums - added this to match the format types needed in the forms
export enum GameType {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  BADMINTON = 'BADMINTON',
  TENNIS = 'TENNIS',
  PICKLEBALL = 'PICKLEBALL',
  TABLETENNIS = 'TABLETENNIS',
  SQUASH = 'SQUASH',
  RACQUETBALL = 'RACQUETBALL',
  OTHER = 'OTHER'
}

// Tournament status enums
export enum TournamentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Tournament stage enums
export enum TournamentStage {
  REGISTRATION = 'REGISTRATION',
  SEEDING = 'SEEDING',
  GROUP_STAGE = 'GROUP_STAGE',
  ELIMINATION_ROUND = 'ELIMINATION_ROUND',
  THIRD_PLACE = 'THIRD_PLACE',
  FINALS = 'FINALS',
  COMPLETED = 'COMPLETED',
  INITIAL_ROUND = 'INITIAL_ROUND',
  DIVISION_PLACEMENT = 'DIVISION_PLACEMENT',
  PLAYOFF_KNOCKOUT = 'PLAYOFF_KNOCKOUT'
}

// Match status enums
export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED'
}

// Court status enums
export enum CourtStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED'
}

// Category type enums
export enum CategoryType {
  MENS_SINGLES = 'MENS_SINGLES',
  WOMENS_SINGLES = 'WOMENS_SINGLES',
  MENS_DOUBLES = 'MENS_DOUBLES',
  WOMENS_DOUBLES = 'WOMENS_DOUBLES',
  MIXED_DOUBLES = 'MIXED_DOUBLES',
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  MIXED = 'MIXED',
  TEAM = 'TEAM',
  CUSTOM = 'CUSTOM'
}

// Division enum
export enum Division {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE',
  OPEN = 'OPEN',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  INITIAL = 'INITIAL',
  MENS = 'MENS',
  WOMENS = 'WOMENS'
}

// User role enum
export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  STAFF = 'STAFF',
  SCOREKEEPER = 'SCOREKEEPER',
  PLAYER = 'PLAYER',
  SPECTATOR = 'SPECTATOR',
  USER = 'USER'
}

// Scorer type enum
export enum ScorerType {
  PLAYER = 'PLAYER',
  REFEREE = 'REFEREE',
  ADMIN = 'ADMIN',
  TOURNAMENT = 'TOURNAMENT',
  STANDALONE = 'STANDALONE'
}

// Play type enum
export enum PlayType {
  SINGLES = 'SINGLES',
  DOUBLES = 'DOUBLES',
  MIXED = 'MIXED',
  TEAM = 'TEAM'
}

// Registration status enum
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN',
  WITHDRAWN = 'WITHDRAWN'
}

// Division type values
export const DivisionTypeValues = ['SKILL', 'AGE', 'GENDER'] as const;
export type DivisionType = typeof DivisionTypeValues[number];

// Stage type for match stages
export type StageType = TournamentStage | string;
