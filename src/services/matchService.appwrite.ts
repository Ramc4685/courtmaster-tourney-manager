import { databases } from "@/lib/appwrite";
import { Match } from "@/types/entities";
import { Query } from "appwrite";
import { COLLECTIONS } from "@/lib/appwrite";

// Define a type for the upcoming match data needed by the dashboard
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

export class MatchService {

  /**
   * Fetches a single match by ID
   */
  async getMatch(matchId: string): Promise<Match> {
    console.log(`[MatchService] Fetching match data for ${matchId}`);
    try {
      const match = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId
      );
      
      return this.mapAppwriteDocumentToMatch(match);
    } catch (error) {
      console.error(`[MatchService] Error fetching match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Updates a match with new data
   */
  async updateMatch(matchId: string, matchData: Partial<Match>): Promise<Match> {
    console.log(`[MatchService] Updating match ${matchId}`);
    try {
      // Remove any properties that shouldn't be sent to the database
      const { id, ...updateData } = matchData as any;
      
      const updatedMatch = await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId,
        updateData
      );
      
      return this.mapAppwriteDocumentToMatch(updatedMatch);
    } catch (error) {
      console.error(`[MatchService] Error updating match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to map Appwrite document to Match type
   */
  private mapAppwriteDocumentToMatch(doc: any): Match {
    return {
      id: doc.$id,
      tournamentId: doc.tournament_id,
      tournament_id: doc.tournament_id,
      divisionId: doc.division_id,
      division_id: doc.division_id,
      team1Id: doc.team1_id,
      team2Id: doc.team2_id,
      team1_player1: doc.team1_player1,
      team2_player1: doc.team2_player1,
      team1_player2: doc.team1_player2,
      team2_player2: doc.team2_player2,
      status: doc.status,
      scheduledTime: doc.scheduled_time,
      scheduled_time: doc.scheduled_time,
      startTime: doc.start_time,
      start_time: doc.start_time,
      endTime: doc.end_time,
      end_time: doc.end_time,
      courtId: doc.court_id,
      court_id: doc.court_id,
      courtNumber: doc.court_number,
      bracketRound: doc.round_number,
      bracketPosition: doc.bracket_position,
      matchNumber: doc.match_number,
      progression: doc.progression,
      scores: doc.scores,
      winner: doc.winner_id,
      loser: doc.loser_id,
      winner_id: doc.winner_id,
      loser_id: doc.loser_id,
      winner_team: doc.winner_team,
      scorerName: doc.scorer_name,
      verified: doc.verified,
      groupName: doc.group_name,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      team1_name: doc.team1_name,
      team2_name: doc.team2_name,
    };
  }

  /**
   * Fetches upcoming scheduled matches for a specific user.
   * Includes matches where the user is player1, player2, or a member of team1 or team2.
   */
  async getUpcomingMatchesForUser(userId: string): Promise<UpcomingMatchInfo[]> {
    console.log(`[MatchService] Fetching upcoming matches for user: ${userId}`);

    // 1. Get teams the user is a member of
    let userTeamIds: string[] = [];
    try {
      const teamMembersResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TEAM_MEMBERS,
        [Query.equal("user_id", userId)]
      );
      
      userTeamIds = teamMembersResponse.documents.map((tm: any) => tm.team_id);
    } catch (error) {
      console.error("[MatchService] Error fetching user teams:", error);
    }

    // 2. Build queries for matches
    const matchQueries = [
      Query.equal("status", "scheduled"),
      Query.greaterThan("scheduled_time", new Date().toISOString()),
      Query.limit(100) // Appwrite has a limit of 100 documents per request
    ];

    // Add user-specific filters
    const userFilters = [
      Query.equal("player1_id", userId),
      Query.equal("player2_id", userId)
    ];
    
    if (userTeamIds.length > 0) {
      userFilters.push(Query.equal("team1_id", userTeamIds));
      userFilters.push(Query.equal("team2_id", userTeamIds));
    }
    
    matchQueries.push(Query.or(userFilters));

    // 3. Fetch matches
    const matchesResponse = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      COLLECTIONS.MATCHES,
      matchQueries
    );

    // 4. Map data to UpcomingMatchInfo type
    // Note: Appwrite doesn't support joins, so we'll need to fetch related data separately
    const upcomingMatches: UpcomingMatchInfo[] = [];
    
    for (const match of matchesResponse.documents) {
      let opponentName: string | null = null;
      let tournamentName: string | null = null;
      let courtName: string | null = null;
      
      // Determine opponent
      if (match.player1_id && match.player2_id) { // Singles match
        opponentName = match.player1_id === userId 
          ? await this.getPlayerName(match.player2_id)
          : await this.getPlayerName(match.player1_id);
      } else if (match.team1_id && match.team2_id) { // Doubles/Team match
        const isUserInTeam1 = userTeamIds.includes(match.team1_id);
        opponentName = isUserInTeam1 
          ? await this.getTeamName(match.team2_id)
          : await this.getTeamName(match.team1_id);
      }

      // Get tournament name
      tournamentName = await this.getTournamentName(match.tournament_id);

      // Get court name
      courtName = await this.getCourtName(match.court_id);

      upcomingMatches.push({
        id: match.$id,
        tournamentId: match.tournament_id,
        tournamentName: tournamentName || "Unknown Tournament",
        roundNumber: match.round_number,
        matchNumber: match.match_number,
        scheduledTime: match.scheduled_time,
        opponentName: opponentName,
        courtName: courtName || "TBD",
      });
    }

    // Sort by scheduled time
    return upcomingMatches.sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      }
      return 0;
    });
  }

  private async getPlayerName(playerId: string): Promise<string | null> {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("user_id", playerId), Query.limit(1)]
      );
      
      if (response.documents.length > 0) {
        const profile = response.documents[0];
        return profile.display_name || profile.full_name || "Opponent";
      }
      return null;
    } catch (error) {
      console.error("[MatchService] Error fetching player name:", error);
      return null;
    }
  }

  private async getTeamName(teamId: string): Promise<string | null> {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TEAMS,
        [Query.equal("$id", teamId), Query.limit(1)]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0].name || "Opponent Team";
      }
      return null;
    } catch (error) {
      console.error("[MatchService] Error fetching team name:", error);
      return null;
    }
  }

  private async getTournamentName(tournamentId: string): Promise<string | null> {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        [Query.equal("$id", tournamentId), Query.limit(1)]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0].name || "Unknown Tournament";
      }
      return null;
    } catch (error) {
      console.error("[MatchService] Error fetching tournament name:", error);
      return null;
    }
  }

  private async getCourtName(courtId: string): Promise<string | null> {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        [Query.equal("$id", courtId), Query.limit(1)]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0].name || "TBD";
      }
      return null;
    } catch (error) {
      console.error("[MatchService] Error fetching court name:", error);
      return null;
    }
  }
}

export const matchService = new MatchService();
