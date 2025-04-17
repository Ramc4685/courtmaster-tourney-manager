
// Create a consistent interface mapping between snake_case backend and camelCase frontend
export interface Court {
  id: string;
  name: string;
  court_number: number;
  tournament_id: string;
  status: string;
  description?: string;
  number?: number;
  tournamentId?: string; // Alias for tournament_id
  currentMatch?: any; // Match reference
  created_at: Date;
  updated_at: Date;
  createdAt?: Date; // Alias for created_at
  updatedAt?: Date; // Alias for updated_at
}

export { 
  Match, 
  Profile, 
  Division, 
  MatchStatus, 
  CourtStatus 
} from './tournament';

// Add Notification interface for components that need it
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}
