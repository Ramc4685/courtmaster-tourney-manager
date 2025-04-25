
// Ensure all enums are properly exported

export enum GameType {
  BADMINTON = 'BADMINTON',
  TENNIS = 'TENNIS', 
  PICKLEBALL = 'PICKLEBALL',
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
  INITIAL = 'INITIAL' // Adding this as it's referenced in code
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
  UNAVAILABLE = 'UNAVAILABLE' // Adding this as it might be referenced
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
  PLAYOFF_KNOCKOUT = 'PLAYOFF_KNOCKOUT'
}

// Define RegistrationStatus here as the canonical source
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN',
  WITHDRAWN = 'WITHDRAWN'
}

// Ensure we have a single source of truth for all enums
