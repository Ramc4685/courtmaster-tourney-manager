
export enum GameType {
  BADMINTON = "BADMINTON",
  TABLE_TENNIS = "TABLE_TENNIS",
  TENNIS = "TENNIS",
  VOLLEYBALL = "VOLLEYBALL",
  PICKLEBALL = "PICKLEBALL",
  // Add missing values for FormatTab
  SINGLE_ELIMINATION = "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION",
  ROUND_ROBIN = "ROUND_ROBIN"
}

export enum PlayType {
  SINGLES = "SINGLES",
  DOUBLES = "DOUBLES",
  MIXED = "MIXED"
}

export enum Division {
  MENS = "MENS",
  WOMENS = "WOMENS",
  OPEN = "OPEN",
  MIXED = "MIXED",
  SENIORS = "SENIORS",
  JUNIORS = "JUNIORS",
  INITIAL = "INITIAL",
  // Add missing advanced/beginner divisions
  ADVANCED = "ADVANCED",
  INTERMEDIATE = "INTERMEDIATE",
  BEGINNER = "BEGINNER"
}

export enum TournamentStage {
  INITIAL_ROUND = "INITIAL_ROUND",
  GROUP_STAGE = "GROUP_STAGE",
  KNOCKOUT_STAGE = "KNOCKOUT_STAGE",
  QUARTERFINALS = "QUARTERFINALS",
  SEMIFINALS = "SEMIFINALS",
  FINALS = "FINALS",
  DIVISION_PLACEMENT = "DIVISION_PLACEMENT",
  PLAYOFF_KNOCKOUT = "PLAYOFF_KNOCKOUT",
  REGISTRATION = "REGISTRATION" // Added for useTournament.ts
}

// Alias for backward compatibility
export type TournamentStageEnum = TournamentStage;

export enum UserRole {
  ADMIN = "admin",
  ORGANIZER = "organizer",
  SCOREKEEPER = "scorekeeper",
  PLAYER = "player",
  SPECTATOR = "spectator"
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION",
  ROUND_ROBIN = "ROUND_ROBIN",
  GROUP_KNOCKOUT = "GROUP_KNOCKOUT",
  SWISS = "SWISS",
  CUSTOM = "CUSTOM",
  MULTI_STAGE = "MULTI_STAGE" // Added for TournamentFormatSelector
}

export enum TournamentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  REGISTRATION = "REGISTRATION",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DEFERRED = "DEFERRED"
}

export enum CourtStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED"
}

export enum CategoryType {
  MENS_SINGLES = "MENS_SINGLES",
  MENS_DOUBLES = "MENS_DOUBLES",
  WOMENS_SINGLES = "WOMENS_SINGLES",
  WOMENS_DOUBLES = "WOMENS_DOUBLES",
  MIXED_DOUBLES = "MIXED_DOUBLES",
  OPEN_SINGLES = "OPEN_SINGLES",
  OPEN_DOUBLES = "OPEN_DOUBLES",
  CUSTOM = "CUSTOM",
  // Add missing types for TournamentCategorySection
  SINGLES = "SINGLES",
  DOUBLES = "DOUBLES",
  MIXED = "MIXED",
  TEAM = "TEAM"
}

export enum ScorerType {
  TOURNAMENT = "TOURNAMENT",
  STANDALONE = "STANDALONE"
}

// Re-export RegistrationStatus here for consistency
export { RegistrationStatus } from './registration';
