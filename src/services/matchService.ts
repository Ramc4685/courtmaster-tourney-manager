// Appwrite implementation
export * from "./matchService.appwrite";
import { matchService } from "./matchService.appwrite";

// Define a type for the upcoming match data needed by the dashboard
export interface UpcomingMatchInfo {
  id: string;
  tournamentId: string;
  tournamentName: string; // Need to join with tournaments table
  roundNumber: number;
  matchNumber: number;
  scheduledTime: string | null;
  opponentName: string | null; // Name of the opponent player or team
  courtName: string | null; // Need to join with courts table
}

type MatchRecord = Database["public"]["Tables"]["matches"]["Row"];

export class MatchService {

  /**
   * Fetches upcoming scheduled matches for a specific user.
   * Includes matches where the user is player1, player2, or a member of team1 or team2.
   */
  async getUpcomingMatchesForUser(userId: string): Promise<UpcomingMatchInfo[]> {
    console.log(`[MatchService] Fetching upcoming matches for user: ${userId}`);

    // 1. Get teams the user is a member of
    // Using Appwrite implementation instead of Supabase
    const teamMembersData: any[] = []; // Will be populated by Appwrite implementation
    const teamMembersError: any = null; // Will be handled by Appwrite implementation

    if (teamMembersError) {
      console.error("[MatchService] Error fetching user teams:", teamMembersError);
      throw teamMembersError;
    }
    const userTeamIds = teamMembersData.map(tm => tm.team_id);

    // 2. Build the query for matches
    // Appwrite query would be implemented here
    const query: any = null; // Placeholder for Appwrite implementation

    const { data: matchesData, error: matchesError } = await query;

    if (matchesError) {
      console.error("[MatchService] Error fetching upcoming matches:", matchesError);
      throw matchesError;
    }

    // 3. Map data to UpcomingMatchInfo type
    return matchesData.map((match: any): UpcomingMatchInfo => {
      let opponentName: string | null = null;
      // Determine opponent
      if (match.player1_id && match.player2_id) { // Singles match
        opponentName = match.player1_id === userId 
          ? match.player2?.display_name || match.player2?.full_name || "Opponent"
          : match.player1?.display_name || match.player1?.full_name || "Opponent";
      } else if (match.team1_id && match.team2_id) { // Doubles/Team match
        const isUserInTeam1 = userTeamIds.includes(match.team1_id);
        opponentName = isUserInTeam1 
          ? match.team2?.name || "Opponent Team"
          : match.team1?.name || "Opponent Team";
      }

      return {
        id: match.id,
        tournamentId: match.tournament_id,
        tournamentName: match.tournaments?.name || "Unknown Tournament",
        roundNumber: match.round_number,
        matchNumber: match.match_number,
        scheduledTime: match.scheduled_time,
        opponentName: opponentName,
        courtName: match.courts?.name || "TBD",
      };
    });
  }

  // Add other match-related methods here if needed (e.g., getMatchDetails, updateMatchScore)
}

// matchService is now exported from matchService.appwrite via export * from "./matchService.appwrite";

