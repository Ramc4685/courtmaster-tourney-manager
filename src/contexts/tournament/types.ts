
import { Tournament, Match, Court, Team, TournamentFormat, Category, CourtStatus, ScoringSettings } from "@/types/tournament";

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament) => Promise<void>;
  createTournament: (name: string, categories: Category[]) => Promise<Tournament | null>;
  updateTournament: (tournament: Tournament) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  loadTournaments: () => Promise<void>;
  
  // Match operations
  startMatch: (matchId: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<void>;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => Promise<void>;
  completeMatch: (matchId: string) => Promise<void>;
  
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
  
  // Category operations
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  // Bracket operations
  generateBrackets: () => Promise<number>;
}
