import { 
  Tournament, 
  Match, 
  Court, 
  Team, 
  TournamentCategory
} from "@/types/tournament";
import {
  TournamentFormat,
  Division,
  CourtStatus,
  MatchStatus
} from "@/types/tournament-enums";
import { ScoringSettings } from "@/types/scoring";

// Define SchedulingOptions and SchedulingResult types to match the services implementation
export interface SchedulingOptions {
  startDate: Date;
  startTime: string;
  matchDuration: number;
  breakDuration: number;
  assignCourts: boolean;
  autoStartMatches: boolean;
  respectFormat: boolean;
}

export interface SchedulingResult {
  tournament?: Tournament;
  matchesScheduled: number;
  courtsAssigned: number;
  matchesStarted: number;
  errors?: string[];
}

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
  setCurrentTournament: (tournament: Tournament) => Promise<void>;
  createTournament: (data: {
    name: string;
    description?: string;
    format?: TournamentFormat;
    categories: TournamentCategory[];
    location?: string;
    registrationEnabled?: boolean;
    requirePlayerProfile?: boolean;
    startDate?: string | Date;
    endDate?: string | Date;
  }) => Promise<Tournament>;
  updateTournament: (tournament: Tournament) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  loadTournaments: () => Promise<void>;
  
  // Match operations
  startMatch: (matchId: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<void>;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => Promise<void>;
  completeMatch: (matchId: string) => Promise<void>;
  updateMatch: (match: Match) => Promise<void>;
  
  // Court operations
  assignCourt: (matchId: string, courtId: string) => Promise<void>;
  freeCourt: (courtNumber: number) => Promise<void>;
  autoAssignCourts: () => Promise<number>;
  startMatchesWithCourts: () => Promise<number>;
  initializeScoring: (matchId: string) => Promise<Match | null>;
  
  // Team operations
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  importTeams: (teams: Team[]) => Promise<void>;
  
  // Category operations
  addCategory: (category: TournamentCategory) => Promise<void>;
  updateCategory: (category: TournamentCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  
  // Bracket operations
  generateBrackets: () => Promise<number>;
  
  // Additional operations
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => Promise<void>;
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions) => Promise<SchedulingResult>;
  generateMultiStageTournament: () => Promise<void>;
  advanceToNextStage: () => Promise<void>;
  loadSampleData: (format?: TournamentFormat) => Promise<void>;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => Promise<void>;
}
