import { databases, APPWRITE_DATABASE_ID } from "@/lib/appwrite";
import { Match } from "@/types/entities";
import { Query } from "appwrite";
import { COLLECTIONS } from "@/lib/appwrite";
import { IMatchService, UpcomingMatchInfo } from "./IMatchService";
import {
  checkCollectionExists,
  createPartialDataHandler,
  createServiceLogger,
  formatServiceError,
  logServiceError,
  safeServiceCall,
} from "@/utils/serviceHelpers";

// Re-export the UpcomingMatchInfo type for external use
export type { UpcomingMatchInfo };

export class MatchService implements IMatchService {
  private readonly logger = createServiceLogger("MatchService");
  private readonly databaseId = APPWRITE_DATABASE_ID;


  /**
   * Fetches a single match by ID
   */
  async getMatch(matchId: string): Promise<Match> {
    console.log(`[MatchService] Fetching match data for ${matchId}`);
    try {
      const match = await databases.getDocument(
        this.databaseId,
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
        this.databaseId,
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
      divisionId: doc.division_id,
      team1Id: doc.team1_id,
      team2Id: doc.team2_id,
      team1_player1: doc.team1_player1,
      team2_player1: doc.team2_player1,
      team1_player2: doc.team1_player2,
      team2_player2: doc.team2_player2,
      status: doc.status,
      scheduledTime: doc.scheduled_time,
      startTime: doc.start_time,
      endTime: doc.end_time,
      courtId: doc.court_id,
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
      scorerName: doc.scorer_name,
      verified: doc.verified,
      groupName: doc.group_name,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      team1_name: doc.team1_name,
      team2_name: doc.team2_name,
    };
  }

  /**
   * Fetches upcoming scheduled matches for a specific user.
   * Includes matches where the user is player1, player2, or a member of team1 or team2.
   */
  async getUpcomingMatchesForUser(userId: string): Promise<UpcomingMatchInfo[]> {
    this.logger.info('Fetching upcoming matches for user', { userId });

    try {
      await Promise.all([
        checkCollectionExists(COLLECTIONS.MATCHES, {
          context: 'MatchService.getUpcomingMatchesForUser.MATCHES',
        }),
        checkCollectionExists(COLLECTIONS.TEAM_MEMBERS, {
          context: 'MatchService.getUpcomingMatchesForUser.TEAM_MEMBERS',
        }),
        checkCollectionExists(COLLECTIONS.PROFILES, {
          context: 'MatchService.getUpcomingMatchesForUser.PROFILES',
        }),
        checkCollectionExists(COLLECTIONS.TEAMS, {
          context: 'MatchService.getUpcomingMatchesForUser.TEAMS',
        }),
        checkCollectionExists(COLLECTIONS.TOURNAMENTS, {
          context: 'MatchService.getUpcomingMatchesForUser.TOURNAMENTS',
        }),
        checkCollectionExists(COLLECTIONS.COURTS, {
          context: 'MatchService.getUpcomingMatchesForUser.COURTS',
        }),
      ]);
    } catch (error) {
      const message = formatServiceError(
        `validate collections for upcoming matches (user ${userId})`,
        error
      );
      logServiceError('MatchService', message, error, { userId });
      const finalError = new Error(message);
      (finalError as Error & { cause?: unknown }).cause = error;
      throw finalError;
    }

    let userTeamIds: string[] = [];
    try {
      const teamMembersResponse = await safeServiceCall(
        () =>
          databases.listDocuments(
            this.databaseId,
            COLLECTIONS.TEAM_MEMBERS,
            [Query.equal('user_id', userId)]
          ),
        {
          retries: 1,
          retryDelayMs: 300,
          context: 'MatchService.getUpcomingMatchesForUser.teamMemberships',
        }
      );
      userTeamIds = teamMembersResponse.documents
        .map((member: any) => member.team_id)
        .filter((teamId: string | null) => Boolean(teamId));
    } catch (error) {
      this.logger.warn('Unable to fetch team memberships; continuing with singles-only context', {
        userId,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const matchQueries = [
      Query.equal('status', 'scheduled'),
      Query.greaterThan('scheduled_time', new Date().toISOString()),
      Query.limit(100),
    ];

    const userFilters = [Query.equal('player1_id', userId), Query.equal('player2_id', userId)];
    if (userTeamIds.length > 0) {
      userFilters.push(Query.equal('team1_id', userTeamIds));
      userFilters.push(Query.equal('team2_id', userTeamIds));
    }

    matchQueries.push(Query.or(userFilters));

    const matchesResponse = await safeServiceCall(
      () =>
        databases.listDocuments(
          this.databaseId,
          COLLECTIONS.MATCHES,
          matchQueries
        ),
      {
        retries: 1,
        retryDelayMs: 300,
        timeoutMs: 15000,
        context: 'MatchService.getUpcomingMatchesForUser.matches',
      }
    );

    const opponentFallbackHandler = createPartialDataHandler<string>({
      serviceName: 'MatchService',
      operation: `resolve opponent name for user ${userId}`,
      fallbackValue: 'TBD',
    });

    const upcomingMatches: UpcomingMatchInfo[] = [];

    for (const match of matchesResponse.documents) {
      let opponentName = 'TBD';

      try {
        if (match.player1_id && match.player2_id) {
          opponentName = match.player1_id === userId
            ? await this.getPlayerName(match.player2_id)
            : await this.getPlayerName(match.player1_id);
        } else if (match.team1_id && match.team2_id) {
          const isUserInTeam1 = userTeamIds.includes(match.team1_id);
          opponentName = isUserInTeam1
            ? await this.getTeamName(match.team2_id)
            : await this.getTeamName(match.team1_id);
        }
      } catch (error) {
        opponentName = opponentFallbackHandler(error);
      }

      const tournamentName = await this.getTournamentName(match.tournament_id);
      const courtName = await this.getCourtName(match.court_id);

      upcomingMatches.push({
        id: match.$id,
        tournamentId: match.tournament_id,
        tournamentName,
        roundNumber: match.round_number,
        matchNumber: match.match_number,
        scheduledTime: match.scheduled_time,
        opponentName,
        courtName,
      });
    }

    return upcomingMatches.sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      }
      return 0;
    });
  }

  private async getPlayerName(playerId: string): Promise<string> {
    if (!playerId) {
      return 'TBD';
    }

    try {
      const response = await safeServiceCall(
        () =>
          databases.listDocuments(
            this.databaseId,
            COLLECTIONS.PROFILES,
            [Query.equal('user_id', playerId), Query.limit(1)]
          ),
        {
          retries: 1,
          retryDelayMs: 300,
          context: 'MatchService.getPlayerName',
        }
      );

      if (response.documents.length > 0) {
        const profile = response.documents[0];
        return profile.display_name || profile.full_name || 'TBD';
      }

      return 'TBD';
    } catch (error) {
      this.logger.warn('Failed to resolve player name; using placeholder', {
        playerId,
        message: error instanceof Error ? error.message : String(error),
      });
      return 'TBD';
    }
  }

  private async getTeamName(teamId: string): Promise<string> {
    if (!teamId) {
      return 'TBD';
    }

    try {
      const response = await safeServiceCall(
        () =>
          databases.listDocuments(
            this.databaseId,
            COLLECTIONS.TEAMS,
            [Query.equal('$id', teamId), Query.limit(1)]
          ),
        {
          retries: 1,
          retryDelayMs: 300,
          context: 'MatchService.getTeamName',
        }
      );

      if (response.documents.length > 0) {
        return response.documents[0].name || 'TBD';
      }

      return 'TBD';
    } catch (error) {
      this.logger.warn('Failed to resolve team name; using placeholder', {
        teamId,
        message: error instanceof Error ? error.message : String(error),
      });
      return 'TBD';
    }
  }

  private async getTournamentName(tournamentId: string): Promise<string> {
    if (!tournamentId) {
      return 'Unknown Tournament';
    }

    try {
      const response = await safeServiceCall(
        () =>
          databases.listDocuments(
            this.databaseId,
            COLLECTIONS.TOURNAMENTS,
            [Query.equal('$id', tournamentId), Query.limit(1)]
          ),
        {
          retries: 1,
          retryDelayMs: 300,
          context: 'MatchService.getTournamentName',
        }
      );

      if (response.documents.length > 0) {
        return response.documents[0].name || 'Unknown Tournament';
      }

      return 'Unknown Tournament';
    } catch (error) {
      this.logger.warn('Failed to resolve tournament name; using placeholder', {
        tournamentId,
        message: error instanceof Error ? error.message : String(error),
      });
      return 'Unknown Tournament';
    }
  }

  private async getCourtName(courtId: string): Promise<string> {
    if (!courtId) {
      return 'TBD';
    }

    try {
      const response = await safeServiceCall(
        () =>
          databases.listDocuments(
            this.databaseId,
            COLLECTIONS.COURTS,
            [Query.equal('$id', courtId), Query.limit(1)]
          ),
        {
          retries: 1,
          retryDelayMs: 300,
          context: 'MatchService.getCourtName',
        }
      );

      if (response.documents.length > 0) {
        return response.documents[0].name || 'TBD';
      }

      return 'TBD';
    } catch (error) {
      this.logger.warn('Failed to resolve court name; using placeholder', {
        courtId,
        message: error instanceof Error ? error.message : String(error),
      });
      return 'TBD';
    }
  }
}

export const matchService = new MatchService();
