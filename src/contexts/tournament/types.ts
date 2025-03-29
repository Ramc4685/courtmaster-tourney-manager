
import { Tournament, Match, Court, Team, MatchStatus, Division } from "@/types/tournament";

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
  loadSampleData: () => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => void;
  generateBracket: () => void;
  autoAssignCourts: () => Promise<number>;
  generateMultiStageTournament: () => void;
  advanceToNextStage: () => void;
  
  // Tournament seeding functionality
  assignSeeding: (tournamentId: string) => void;
}
