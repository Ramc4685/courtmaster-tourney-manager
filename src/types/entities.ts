
export { 
  Court, 
  Match, 
  Profile, 
  Division, 
  MatchStatus, 
  CourtStatus 
} from './tournament';

// Add snake_case to camelCase mapping
export interface Court {
  id: string;
  name: string;
  court_number: number;
  tournament_id: string;
  created_at: Date;
  updated_at: Date;
}
