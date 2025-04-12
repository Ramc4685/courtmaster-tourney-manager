export enum TournamentFormat {
  SINGLE_ELIMINATION = "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION",
  ROUND_ROBIN = "ROUND_ROBIN",
  SWISS = "SWISS",
  GROUP_KNOCKOUT = "GROUP_KNOCKOUT",
  MULTI_STAGE = "MULTI_STAGE"
}

export enum TournamentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum TournamentStage {
  REGISTRATION = "REGISTRATION",
  SEEDING = "SEEDING",
  GROUP_STAGE = "GROUP_STAGE",
  ELIMINATION_ROUND = "ELIMINATION_ROUND",
  THIRD_PLACE = "THIRD_PLACE",
  FINALS = "FINALS",
  COMPLETED = "COMPLETED"
}

export enum Division {
  INITIAL = "INITIAL",
  ADVANCED = "ADVANCED",
  INTERMEDIATE = "INTERMEDIATE",
  BEGINNER = "BEGINNER"
}

// Export the Division enum values as a type
export type DivisionType = keyof typeof Division;

// Also export DivisionType as a value so it can be used in component properties
export const DivisionTypeValues = Object.keys(Division) as DivisionType[];

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum CourtStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE"
}

export enum CategoryType {
  SINGLES = "SINGLES",
  DOUBLES = "DOUBLES",
  MIXED = "MIXED",
  TEAM = "TEAM"
}

export enum ScorerType {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC"
}

export enum PlayType {
  SINGLES = "SINGLES",
  DOUBLES = "DOUBLES",
  MIXED_DOUBLES = "MIXED_DOUBLES"
}

export enum GameType {
  BADMINTON = "BADMINTON",
  TENNIS = "TENNIS",
  TABLE_TENNIS = "TABLE_TENNIS",
  VOLLEYBALL = "VOLLEYBALL",
  BASKETBALL = "BASKETBALL",
  CUSTOM = "CUSTOM"
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  TOURNAMENT_DIRECTOR = "tournament_director",
  FRONT_DESK = "front_desk",
  ADMIN_STAFF = "admin_staff",
  SCOREKEEPER = "scorekeeper",
  PLAYER = "player",
  SPECTATOR = "spectator"
}

export enum StageType {
  GROUP = "GROUP",
  KNOCKOUT = "KNOCKOUT",
  FINAL = "FINAL"
}
