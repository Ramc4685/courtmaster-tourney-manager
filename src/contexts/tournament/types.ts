
// Add this import at the top if needed
import { Tournament, Team, Match, Court, Division, MatchStatus, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { SchedulingOptions, SchedulingResult } from "@/services/tournament/SchedulingService";

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isPending: boolean; // Add isPending state to indicate transitions in progress
  setCurrentTournament: (tournament: Tournament | null) => void;
  createTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => Tournament;
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
  addCategory: (category: Omit<TournamentCategory, "id">) => void;
  removeCategory: (categoryId: string) => void;
  updateCategory: (category: TournamentCategory) => void;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => void;
  // Add the scheduleMatches function that uses our enhanced SchedulingService
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions) => Promise<SchedulingResult>;
}
