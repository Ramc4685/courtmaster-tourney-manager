
import { Tournament, Match, Team, Court, Division, MatchStatus, TournamentStage, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { SchedulingOptions, SchedulingResult } from '@/services/tournament/SchedulingService';

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isPending: boolean;
  setCurrentTournament: (tournament: Tournament | null) => void;
  createTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => Tournament;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (tournamentId: string) => void;
  addTeam: (team: Team) => void;
  importTeams: (teams: Team[]) => void;
  updateMatch: (match: Match) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => void;
  moveTeamToDivision?: (teamId: string, fromDivision: Division, toDivision: Division) => void;
  loadSampleData: (format?: TournamentFormat) => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;
  generateBracket?: () => void;
  autoAssignCourts: () => Promise<number>;
  generateMultiStageTournament?: () => void;
  advanceToNextStage?: () => void;
  addCategory: (category: Omit<TournamentCategory, "id">) => void;
  removeCategory: (categoryId: string) => void;
  updateCategory: (category: TournamentCategory) => void;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => void;
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions) => Promise<SchedulingResult>;
}
