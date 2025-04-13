
export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  SCOREKEEPER = 'scorekeeper',
  PLAYER = 'player',
  SPECTATOR = 'spectator'
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum CourtStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED'
}

export enum TournamentStageEnum {
  GROUP_STAGE = 'GROUP_STAGE',
  DIVISION_PLACEMENT = 'DIVISION_PLACEMENT',
  PLAYOFF_KNOCKOUT = 'PLAYOFF_KNOCKOUT'
}
