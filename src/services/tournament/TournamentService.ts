import { databases, APPWRITE_DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { Tournament } from '../../types/tournament';
import { camelizeKeys, snakeizeKeys } from '@/utils/caseTransforms';
import {
  checkCollectionExists as ensureCollectionPresence,
  createServiceLogger,
  formatServiceError,
  logServiceError,
  safeServiceCall,
} from '@/utils/serviceHelpers';
import { divisionService } from './DivisionService';

export class TournamentService {
  private readonly logger = createServiceLogger('TournamentService');

  private get collectionId(): string {
    return COLLECTIONS.TOURNAMENTS;
  }

  private get databaseId(): string {
    return APPWRITE_DATABASE_ID;
  }

  async checkCollectionExists(forceRefresh = false): Promise<void> {
    await ensureCollectionPresence(this.collectionId, {
      forceRefresh,
      context: 'TournamentService.checkCollectionExists',
    });
  }

  async createTournament(tournament: any): Promise<any> {
    try {
      // Convert to backend format
      const payload = snakeizeKeys(tournament);

      // Generate ID if not provided
      const documentId = payload.id || ID.unique();
      delete payload.id; // Remove ID as it's passed separately in Appwrite

      console.log('Attempting to insert tournament. Payload:', payload);
      console.log("Payload organizer_id:", payload.organizer_id);

      await this.checkCollectionExists();

      // Create document in Appwrite
      const data = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        documentId,
        payload,
        [
          Permission.read(Role.any()),
          Permission.read(Role.user(payload.organizer_id)),
          Permission.update(Role.user(payload.organizer_id)),
          Permission.delete(Role.user(payload.organizer_id)),
        ]
      );

      // Convert response back to frontend format
      console.log('[TournamentService] Raw Appwrite response:', JSON.stringify(data, null, 2));
      console.log('[TournamentService] Raw $id:', data.$id);
      const result = camelizeKeys(data);
      console.log('[TournamentService] After camelizeKeys:', JSON.stringify(result, null, 2));
      console.log('[TournamentService] Result id:', result.id);

      // Debug: Check if the conversion worked
      if (!result.id && data.$id) {
        console.error('[TournamentService] CRITICAL: camelizeKeys failed to convert $id to id!');
        // Manually set the id as a fallback
        result.id = data.$id;
        console.log('[TournamentService] Manually set id:', result.id);
      }

      return result;
    } catch (error) {
      console.error('Error creating tournament in service:', error);
      throw error; // Re-throw the error
    }
  }

  async getTournament(id: string): Promise<any> {
    try {
      await this.checkCollectionExists();

      // Get tournament document
      const data = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );

      const tournament = camelizeKeys(data);

      // Fetch related data
      try {
        // Get teams for this tournament
        const teamsResponse = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.TEAMS,
          [Query.equal('tournament_id', id)]
        );
        // Get team IDs for this tournament
        const teamIds = teamsResponse.documents.map(team => team.$id);

        // Get all team members and filter by team IDs
        const allTeamMembersResponse = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.TEAM_MEMBERS,
          [Query.limit(1000)]
        );

        // Filter team members for teams in this tournament
        const teamMembersResponse = {
          documents: allTeamMembersResponse.documents.filter(member =>
            teamIds.includes(member.team_id)
          )
        };

        // Get profiles for team members
        const profilesResponse = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.PROFILES,
          [Query.limit(1000)]
        );

        // Create a map of profiles by user_id
        const profilesMap = new Map();
        profilesResponse.documents.forEach(profile => {
          profilesMap.set(profile.user_id, camelizeKeys(profile));
        });

        // Process teams and populate players array
        tournament.teams = teamsResponse.documents.map(team => {
          const processedTeam = camelizeKeys(team);

          // Find team members for this team
          const teamMembers = teamMembersResponse.documents.filter(
            member => member.team_id === team.$id
          );

          // Map team members to player objects
          processedTeam.players = teamMembers.map(member => {
            const profile = profilesMap.get(member.user_id);
            return {
              id: member.user_id,
              name: profile?.fullName || profile?.displayName || `User ${member.user_id}`,
              email: profile?.email || `${member.user_id}@example.com`,
              profileId: profile?.$id,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          });

          return processedTeam;
        });

        // Get registrations for this tournament
        const registrationsResponse = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.REGISTRATIONS,
          [Query.equal('tournament_id', id)]
        );
        tournament.registrations = registrationsResponse.documents.map(reg => camelizeKeys(reg));

        // Get divisions for this tournament
        const divisions = await divisionService.getDivisionsByTournament(id);
        tournament.divisions = divisions as any;
        tournament.categories = divisions.flatMap(division =>
          (division.categories || []).map(category => ({
            id: category.id,
            name: category.name,
            type: category.type,
            division: division.type,
            format: category.format,
            playType: category.playType,
            divisionId: division.id,
          }))
        );

        // Get courts for this tournament
        const courtsResponse = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.COURTS,
          [Query.equal('tournament_id', id)]
        );
        tournament.courts = courtsResponse.documents.map(court => {
          const processedCourt = camelizeKeys(court);
          // Set default status if not specified or normalize status values
          if (!processedCourt.status || processedCourt.status === 'available' || processedCourt.status === 'Available') {
            processedCourt.status = 'AVAILABLE';
          } else if (processedCourt.status === 'in_use' || processedCourt.status === 'In Use') {
            processedCourt.status = 'IN_USE';
          } else if (processedCourt.status === 'maintenance' || processedCourt.status === 'Maintenance') {
            processedCourt.status = 'MAINTENANCE';
          } else if (processedCourt.status === 'reserved' || processedCourt.status === 'Reserved') {
            processedCourt.status = 'RESERVED';
          } else if (processedCourt.status === 'unavailable' || processedCourt.status === 'Unavailable') {
            processedCourt.status = 'UNAVAILABLE';
          }
          return processedCourt;
        });

        // Get matches for this tournament
        const matchesResponse = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.MATCHES,
          [Query.equal('tournament_id', id)]
        );
        // Process matches and populate team references
        tournament.matches = matchesResponse.documents.map(match => {
          const processedMatch = camelizeKeys(match);

          // Find and populate team1 and team2 objects
          if (processedMatch.team1Id) {
            processedMatch.team1 = tournament.teams.find(team => team.id === processedMatch.team1Id) || null;
          }
          if (processedMatch.team2Id) {
            processedMatch.team2 = tournament.teams.find(team => team.id === processedMatch.team2Id) || null;
          }

          return processedMatch;
        });

        // Set participant count based on registrations (since that's more accurate than teams for mixed doubles)
        tournament.participants = tournament.registrations || [];

        // Set default tournament stage if none exists
        if (!tournament.currentStage) {
          tournament.currentStage = 'INITIAL_ROUND';
        }

      } catch (relatedDataError) {
        console.warn('Error loading related tournament data:', relatedDataError);
        // Set empty arrays if related data fails to load
        tournament.teams = [];
        tournament.registrations = [];
        tournament.divisions = [];
        tournament.courts = [];
        tournament.matches = [];
        tournament.participants = [];
      }

      return tournament;
    } catch (error) {
      console.error('Error getting tournament:', error);
      throw error;
    }
  }

  async getTournaments(): Promise<Tournament[]> {
    await this.checkCollectionExists();

    try {
      const response = await safeServiceCall(
        () =>
          databases.listDocuments(
            this.databaseId,
            this.collectionId,
            [
              Query.orderDesc('$createdAt'),
              Query.limit(100)
            ]
          ),
        {
          retries: 2,
          retryDelayMs: 300,
          timeoutMs: 15000,
          context: 'TournamentService.getTournaments',
          onRetry: (attempt, error) => {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn('Retrying getTournaments due to error', { attempt, message });
          },
        }
      );

      return response.documents.map(tournament => camelizeKeys(tournament)) as Tournament[];
    } catch (error) {
      const message = formatServiceError(
        `fetch tournaments from collection "${this.collectionId}"`,
        error
      );
      logServiceError('TournamentService', message, error, {
        collectionId: this.collectionId,
        databaseId: this.databaseId,
      });
      const finalError = new Error(message);
      (finalError as Error & { cause?: unknown }).cause = error;
      throw finalError;
    }
  }

  async updateTournament(tournament: any): Promise<any> {
    try {
      const payload = snakeizeKeys(tournament);
      const tournamentId = tournament.id;
      delete payload.id; // Remove ID as it's passed separately in Appwrite

      await this.checkCollectionExists();

      const data = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        tournamentId,
        payload
      );

      return camelizeKeys(data);
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  async deleteTournament(id: string): Promise<void> {
    try {
      await this.checkCollectionExists();

      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        id
      );
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  async saveCurrentTournament(tournament: any): Promise<void> {
    // For temporary storage, we could use localStorage or sessionStorage
    try {
      localStorage.setItem('currentTournament', JSON.stringify(tournament));
    } catch (error) {
      console.error('Error saving current tournament:', error);
      throw error;
    }
  }

  // Removed private methods as they were not used and potentially outdated
}

// Export a singleton instance
export const tournamentService = new TournamentService();
