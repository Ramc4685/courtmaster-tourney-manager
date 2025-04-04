
import { 
  Tournament, 
  Match, 
  Team, 
  Court, 
  MatchStatus, 
  Division, 
  TournamentFormat, 
  TournamentCategory,
  TournamentStage
} from "@/types/tournament";
import { SchedulingOptions, SchedulingResult } from "@/services/tournament/SchedulingService";

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isPending: boolean;
  setCurrentTournament: (tournament: Tournament | null) => void;
  createTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => Tournament;
  updateTournament: (tournament: Tournament) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  addTeam: (team: Team) => Promise<void>;
  importTeams: (teams: Team[]) => Promise<void>;
  updateMatch: (match: Match) => Promise<void>;
  assignCourt: (matchId: string, courtId: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: MatchStatus) => Promise<void>;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => Promise<void>;
  completeMatch: (matchId: string, scorerName?: string) => Promise<void>;
  loadSampleData: (format?: TournamentFormat) => Promise<void>;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => Promise<void>;
  generateBracket: () => Promise<void>;
  autoAssignCourts: () => Promise<number>;
  generateMultiStageTournament: () => Promise<void>;
  advanceToNextStage: () => Promise<void>;
  addCategory: (category: Omit<TournamentCategory, "id">) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  updateCategory: (category: TournamentCategory) => Promise<void>;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => Promise<void>;
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions) => Promise<SchedulingResult>;
  moveTeamToDivision?: (teamId: string, fromDivision: Division, toDivision: Division) => Promise<void>;
  assignSeeding?: (tournamentId: string) => Promise<void>;
}
