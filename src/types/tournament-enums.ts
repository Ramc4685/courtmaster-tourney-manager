
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
  REGISTRATION_OPEN = "REGISTRATION_OPEN",
  REGISTRATION_CLOSED = "REGISTRATION_CLOSED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum TournamentStage {
  INITIAL_ROUND = "INITIAL_ROUND",
  QUALIFIER = "QUALIFIER",
  GROUP_STAGE = "GROUP_STAGE",
  BRACKET_STAGE = "BRACKET_STAGE",
  DIVISION_PLACEMENT = "DIVISION_PLACEMENT",
  PLAYOFF_KNOCKOUT = "PLAYOFF_KNOCKOUT",
  FINAL = "FINAL"
}

export enum Division {
  INITIAL = "INITIAL",
  MENS = "MENS",
  WOMENS = "WOMENS",
  MIXED = "MIXED",
  JUNIOR = "JUNIOR",
  SENIOR = "SENIOR",
  DIVISION_1 = "DIVISION_1",
  DIVISION_2 = "DIVISION_2",
  DIVISION_3 = "DIVISION_3",
  QUALIFIER_DIV1 = "QUALIFIER_DIV1",
  QUALIFIER_DIV2 = "QUALIFIER_DIV2",
  GROUP_DIV3 = "GROUP_DIV3"
}

// Export the Division enum values as a type
export type DivisionType = keyof typeof Division;

// Also export DivisionType as a value so it can be used in component properties
export const DivisionTypeValues = Object.keys(Division) as DivisionType[];

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS", 
  COMPLETED = "COMPLETED",
  DEFERRED = "DEFERRED",
  CANCELLED = "CANCELLED"
}

export enum CourtStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED"
}

export enum CategoryType {
  MENS_SINGLES = "MENS_SINGLES",
  WOMENS_SINGLES = "WOMENS_SINGLES",
  MENS_DOUBLES = "MENS_DOUBLES",
  WOMENS_DOUBLES = "WOMENS_DOUBLES",
  MIXED_DOUBLES = "MIXED_DOUBLES",
  JUNIOR_SINGLES = "JUNIOR_SINGLES",
  JUNIOR_DOUBLES = "JUNIOR_DOUBLES",
  CUSTOM = "CUSTOM"
}

export enum ScorerType {
  PLAYER = "PLAYER",
  OFFICIAL = "OFFICIAL",
  VOLUNTEER = "VOLUNTEER",
  ADMIN = "ADMIN",
  SYSTEM = "SYSTEM"
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

export type StageType = keyof typeof TournamentStage;
