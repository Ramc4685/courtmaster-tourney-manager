import { Match } from "@/types/entities";

export interface UpcomingMatchInfo {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  matchNumber: number;
  scheduledTime: string | null;
  opponentName: string | null;
  courtName: string | null;
}

export interface IMatchService {
  getMatch(matchId: string): Promise<Match>;
  updateMatch(matchId: string, matchData: Partial<Match>): Promise<Match>;
  getUpcomingMatchesForUser(userId: string): Promise<UpcomingMatchInfo[]>;
}