
// Ensure all enums are properly exported
export enum GameType {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  BADMINTON = 'BADMINTON',
  TENNIS = 'TENNIS', 
  PICKLEBALL = 'PICKLEBALL'
}

export enum Division {
  JUNIORS = 'JUNIOR',
  SENIORS = 'SENIOR',
  OPEN = 'OPEN',
  MENS = 'MENS',
  WOMENS = 'WOMENS'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS', 
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export { CourtStatus } from './entities';
