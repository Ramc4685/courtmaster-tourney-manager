
export enum UserRole {
  ADMIN = "admin",
  ORGANIZER = "organizer",
  SCOREKEEPER = "scorekeeper",
  PLAYER = "player",
  FRONT_DESK = "front_desk",
  ADMIN_STAFF = "admin_staff",
  DIRECTOR = "director",
  SPECTATOR = "spectator"
}

export interface RolePermissions {
  [key: string]: boolean;
  viewTournament: boolean;
  editTournament: boolean;
  createTournament: boolean;
  deleteTournament: boolean;
  viewMatch: boolean;
  editMatch: boolean;
  createMatch: boolean;
  deleteMatch: boolean;
  viewRegistration: boolean;
  editRegistration: boolean;
  createRegistration: boolean;
  deleteRegistration: boolean;
  viewCourt: boolean;
  editCourt: boolean;
  createCourt: boolean;
  deleteCourt: boolean;
  viewTeam: boolean;
  editTeam: boolean;
  createTeam: boolean;
  deleteTeam: boolean;
  viewPlayer: boolean;
  editPlayer: boolean;
  createPlayer: boolean;
  deletePlayer: boolean;
  viewScoring: boolean;
  editScoring: boolean;
  manageCheckIn: boolean;
  manageSchedule: boolean;
  viewDashboard: boolean;
}

export interface UserPermissions extends RolePermissions {
  // Additional user-specific permissions
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  display_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  country_code?: string;
  created_at?: string;
  updated_at?: string;
  player_details?: {
    skillLevel?: string;
    preferredEvents?: string[];
    playingSince?: string;
    equipment?: {
      racket?: string;
      shoes?: string;
    };
  };
  player_stats?: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
    pointsScored: number;
    pointsConceded: number;
  };
}
