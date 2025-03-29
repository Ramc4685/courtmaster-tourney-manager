
import { Tournament, Match, Court, Team, MatchStatus, Division, TournamentFormat, TournamentCategory } from "@/types/tournament";

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  createTournament: (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => Tournament;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (tournamentId: string) => void;
  addTeam: (team: Team) => void;
  importTeams: (teams: Team[]) => void;
  updateMatch: (match: Match) => void;
  updateCourt: (court: Court) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => void;
  completeMatch: (matchId: string) => void;
  moveTeamToDivision: (teamId: string, fromDivision: Division, toDivision: Division) => void;
  loadSampleData: (format?: TournamentFormat) => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;
  generateBracket: () => void;
  autoAssignCourts: () => Promise<number>;
  generateMultiStageTournament: () => void;
  advanceToNextStage: () => void;
  assignSeeding: (tournamentId: string) => void;
  
  // New operations for categories
  addCategory: (category: Omit<TournamentCategory, "id">) => void;
  removeCategory: (categoryId: string) => void;
  updateCategory: (category: TournamentCategory) => void;
  
  // New operation for loading demo data for a specific category
  loadCategoryDemoData: (categoryId: string, format: TournamentFormat) => void;
}
