
// Add this import at the top if needed
import { Tournament, Team, Match, Court, Division, MatchStatus, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { SchedulingOptions, SchedulingResult } from "@/services/tournament/SchedulingService";

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isPending: boolean; 
  setCurrentTournament: (tournament: Tournament | null) => void;
  
  // Add the missing properties that were causing TypeScript errors
  addTeam: (team: Team) => void;
  createTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => Tournament;
  deleteTournament: (tournamentId: string) => void;
  loadSampleData: (format?: TournamentFormat) => void;
  updateMatch: (match: Match) => void;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => void;
  
  // Retain all existing properties
  updateTournament: (tournament: Tournament) => void;
  importTeams: (teams: Team[]) => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  updateMatchStatus: (matchId: string, status: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  autoAssignCourts: () => void;
  
  // Add the scheduleMatches function
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions) => Promise<SchedulingResult>;
}
