
export enum GameType {
  BADMINTON = "BADMINTON",
  TABLE_TENNIS = "TABLE_TENNIS",
  TENNIS = "TENNIS",
  VOLLEYBALL = "VOLLEYBALL",
  PICKLEBALL = "PICKLEBALL"
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
  INITIAL = "INITIAL"
}

export enum TournamentStage {
  INITIAL_ROUND = "INITIAL_ROUND",
  GROUP_STAGE = "GROUP_STAGE",
  KNOCKOUT_STAGE = "KNOCKOUT_STAGE",
  QUARTERFINALS = "QUARTERFINALS",
  SEMIFINALS = "SEMIFINALS",
  FINALS = "FINALS",
  DIVISION_PLACEMENT = "DIVISION_PLACEMENT",
  PLAYOFF_KNOCKOUT = "PLAYOFF_KNOCKOUT"
}

export enum UserRole {
  ADMIN = "admin",
  ORGANIZER = "organizer",
  SCOREKEEPER = "scorekeeper",
  PLAYER = "player"
}

// Re-export TournamentFormat from tournament.d.ts
export { TournamentFormat } from '@/types/tournament';
