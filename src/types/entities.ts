
import { 
  MatchStatus, 
  TournamentStatus, 
  CourtStatus, 
  UserRole, 
  RegistrationStatus 
} from './tournament-enums';

export interface Court {
  id: string;
  name: string;
  number: number;
  court_number: number; // For backward compatibility 
  status: CourtStatus;
  description?: string;
  tournament_id: string;
  tournamentId: string; // For type compatibility
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournament_id: string; // For backward compatibility
  division: string;
  stage: string;
  round_number: number; // For backward compatibility
  match_number: string; // For backward compatibility
  bracketRound: number;
  bracketPosition: number;
  progression: any;
  scores: MatchScore[];
  status: MatchStatus;
  courtId?: string;
  court_id?: string; // For backward compatibility
  courtNumber?: number;
  team1?: Team;
  team2?: Team;
  team1Id?: string;
  team2Id?: string;
  winner?: string;
  loser?: string;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  groupName?: string;
  matchNumber?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  division: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration {
  id: string;
  tournamentId: string;
  tournament_id: string; // For backward compatibility
  divisionId: string;
  division_id: string; // For backward compatibility
  playerId: string;
  player_id: string; // For backward compatibility
  partnerId?: string;
  partner_id?: string; // For backward compatibility
  status: RegistrationStatus;
  metadata: any;
  notes?: string;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  email?: string;
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  role: UserRole;
  playerStats?: {
    rating: number;
    ranking?: number;
    matchesWon: number;
    matchesPlayed: number;
    tournamentsWon: number;
    tournamentsPlayed: number;
  };
  preferences?: {
    display: {
      theme: string;
      language: string;
    };
    privacy: {
      showStats: boolean;
      showHistory: boolean;
      showProfile: boolean;
    };
    notifications: {
      push: boolean;
      email: boolean;
      matchReminders: boolean;
      tournamentUpdates: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  status: TournamentStatus;
  organizer_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RolePermissions = {
  // Tournament management
  viewTournament: boolean;
  editTournament: boolean;
  createTournament: boolean;
  deleteTournament: boolean;
  
  // Registration management
  manageRegistrations: boolean;
  approveRegistrations: boolean;
  rejectRegistrations: boolean;
  
  // Match management
  scheduleMatches: boolean;
  scoreMatches: boolean;
  
  // Court management
  manageCourts: boolean;
  
  // User management
  manageUsers: boolean;
  
  // Admin functions
  manageSystem: boolean;
  viewReports: boolean;
  exportData: boolean;
  
  // Legacy permissions (for backward compatibility)
  can_manage_tournaments: boolean;
  can_manage_users: boolean;
  can_manage_registrations: boolean;
  can_score_matches: boolean;
  can_view_reports: boolean;
};
