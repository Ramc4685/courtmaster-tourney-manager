import { databases } from "@/lib/appwrite";
import { PlayerRegistration, TeamRegistration, RegistrationStatus } from "@/types/registration";
import { Tournament } from "@/types/tournament"; // Import Tournament type
import { COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

// Combined type for user registrations (can be player or team)
export interface UserRegistration {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentStartDate: string;
  tournamentEndDate: string;
  status: RegistrationStatus;
  registeredAt: string;
  isTeamRegistration: boolean;
  teamName?: string; // Optional: only for team registrations
}

export class RegistrationService {
  /**
   * Fetches player registrations for a specific tournament.
   * Includes profile information for the registered user.
   */
  async getPlayerRegistrations(tournamentId: string): Promise<PlayerRegistration[]> {
    console.log(`[RegService] Fetching player registrations for tournament: ${tournamentId}`);
    
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [Query.equal("tournament_id", tournamentId), Query.orderAsc("created_at")]
      );
      
      // Map data to PlayerRegistration type
      return response.documents.map((reg: any) => ({
        id: reg.$id,
        tournamentId: reg.tournament_id,
        userId: reg.user_id,
        categoryId: reg.category_id,
        status: reg.status,
        registeredAt: reg.created_at,
        playerName: reg.player_name || "Unknown Player",
        playerEmail: reg.player_email || "N/A",
        waiverAccepted: reg.waiver_accepted || false,
        paymentStatus: reg.payment_status || 'pending',
        waitlistPosition: reg.waitlist_position
      }));
    } catch (error) {
      console.error("[RegService] Error fetching player registrations:", error);
      throw error;
    }
  }

  /**
   * Fetches player registrations with profile details for a specific tournament.
   */
  async getPlayerRegistrationsWithProfiles(tournamentId: string): Promise<PlayerRegistration[]> {
    console.log(`[RegService] Fetching player registrations with profiles for tournament: ${tournamentId}`);
    
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [Query.equal("tournament_id", tournamentId), Query.orderAsc("$createdAt")]
      );
      
      // Map data to PlayerRegistration type
      return response.documents.map((reg: any) => ({
        id: reg.$id,
        tournamentId: reg.tournament_id,
        userId: reg.user_id,
        categoryId: reg.category_id,
        status: reg.status as RegistrationStatus,
        registeredAt: reg.$createdAt,
        playerName: reg.profiles?.display_name || reg.profiles?.full_name || "Unknown Player",
        playerEmail: reg.profiles?.email || "N/A",
        waiverAccepted: reg.waiver_accepted || false,
        paymentStatus: reg.payment_status || 'pending',
        waitlistPosition: reg.waitlist_position
    }));
  }

  /**
   * Fetches team registrations for a specific tournament.
   * Joins with the teams table to get team details.
   */
  async getTeamRegistrations(tournamentId: string): Promise<TeamRegistration[]> {
    console.log(`[RegService] Fetching team registrations for tournament: ${tournamentId}`);
    
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal("tournament_id", tournamentId),
          Query.notEqual("team_id", null), // Filter for team registrations
          Query.orderAsc("$createdAt")
        ]
      );
      
      // Map data to TeamRegistration type
      return response.documents.map((reg: any) => ({
          id: reg.$id,
          tournamentId: reg.tournament_id,
          teamId: reg.team_id,
          status: reg.status as RegistrationStatus,
          registeredAt: reg.$createdAt,
          teamName: reg.team_name || "Unknown Team",
          captainId: reg.captain_id,
          captainName: reg.captain_name || "Unknown Captain",
          paymentStatus: reg.payment_status || 'pending',
          waitlistPosition: reg.waitlist_position
      }));
    } catch (error) {
      console.error("[RegService] Error fetching team registrations:", error);
      throw error;
    }
    
    // Map data to TeamRegistration type
    return response.documents.map((reg: any) => ({
        id: reg.$id,
        tournamentId: reg.tournament_id,
        teamId: reg.team_id,
        divisionId: reg.division_id,
        categoryId: reg.category_id,
        status: reg.status as RegistrationStatus,
        registeredAt: reg.$createdAt,
        updatedAt: reg.$updatedAt,
        teamName: reg.teams?.name || "Unknown Team",
        captainId: reg.teams?.captain_id,
        waitlistPosition: reg.waitlist_position
    }));
  }

  /**
   * Fetches all registrations (player and team) for a specific user.
   * Combines data from tournament_registrations and registrations tables.
   * Includes tournament details for each registration.
   */
  async getUserRegistrations(userId: string): Promise<UserRegistration[]> {
    console.log(`[RegService] Fetching all registrations for user: ${userId}`);
    
    try {
      // 1. Fetch player registrations for the user
      const playerRegsResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [Query.equal('user_id', userId)]
      );

      // 2. Fetch teams the user is a member of
      const teamMembersResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TEAM_MEMBERS,
        [Query.equal('user_id', userId)]
      );

      const teamIds = teamMembersResponse.documents.map((tm: any) => tm.team_id);
      let teamRegsData: any[] = [];

      // 3. Fetch team registrations if the user is part of any teams
      if (teamIds.length > 0) {
        const teamRegsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [Query.equal('team_id', teamIds)]
        );
        teamRegsData = teamRegsResponse.documents;
      }

      // 4. Combine and map results
      const combinedRegistrations: UserRegistration[] = [];

      playerRegsResponse.documents.forEach((reg: any) => {
        combinedRegistrations.push({
          id: reg.$id,
          tournamentId: reg.tournament_id,
          tournamentName: reg.tournament_name,
          tournamentStartDate: reg.tournament_start_date,
          tournamentEndDate: reg.tournament_end_date,
          status: reg.status,
          registeredAt: reg.created_at,
          isTeamRegistration: false,
        });
      });

      teamRegsData.forEach((reg: any) => {
        // Avoid duplicates if a user is registered individually AND via a team for the same tournament (edge case)
        if (!combinedRegistrations.some(cr => cr.tournamentId === reg.tournament_id)) {
          combinedRegistrations.push({
            id: reg.$id,
            tournamentId: reg.tournament_id,
            tournamentName: reg.tournament_name,
            tournamentStartDate: reg.tournament_start_date,
            tournamentEndDate: reg.tournament_end_date,
            status: reg.status,
            registeredAt: reg.created_at,
            isTeamRegistration: true,
            teamName: reg.team_name,
          });
        }
      });

      // Sort by registration date
      combinedRegistrations.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

      return combinedRegistrations;
    } catch (error) {
      console.error("[RegService] Error fetching user registrations:", error);
      throw error;
    }
  }

  /**
   * Updates the status of a single player registration.
   */
  async updatePlayerRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Updating player registration ${id} status to ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
      }
      
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        id,
        updatePayload
      );
    } catch (error) {
      console.error("[RegService] Error updating player registration status:", error);
      throw error;
    }
  }

  /**
   * Updates the status of a single team registration.
   * Uses the registrations table.
   */
  async updateTeamRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Updating team registration ${id} status to ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
      }
      
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        id,
        updatePayload
      );
    } catch (error) {
      console.error("[RegService] Error updating team registration status:", error);
      throw error;
    }
  }

  /**
   * Bulk updates the status for multiple player registrations.
   */
  async bulkUpdatePlayerStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Bulk updating ${ids.length} player registrations to ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
      }
      
      // Appwrite doesn't support bulk updates, so we need to update each document individually
      const updatePromises = ids.map(id => 
        databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id,
          updatePayload
        )
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("[RegService] Error bulk updating player status:", error);
      throw error;
    }
  }

  /**
   * Bulk updates the status for multiple team registrations.
   * Uses the registrations table.
   */
  async bulkUpdateTeamStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Bulk updating ${ids.length} team registrations to ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
      }
      
      // Appwrite doesn't support bulk updates, so we need to update each document individually
      const updatePromises = ids.map(id => 
        databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id,
          updatePayload
        )
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("[RegService] Error bulk updating team status:", error);
      throw error;
    }
  }
  
  // --- Add methods for creating registrations (player/team) --- 
  async createPlayerRegistration(payload: any): Promise<any> {
      console.log(`[RegService] Creating player registration for user ${payload.user_id} in tournament ${payload.tournament_id}`);
      
      try {
        // Add required fields for Appwrite
        const fullPayload = {
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const response = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          'unique()',
          fullPayload
        );
        
        // Map result back to PlayerRegistration type
        return {
          id: response.$id,
          tournamentId: response.tournament_id,
          userId: response.user_id,
          categoryId: response.category_id,
          status: response.status,
          registeredAt: response.created_at,
          playerName: response.player_name || "Unknown Player",
          playerEmail: response.player_email || "N/A",
          waiverAccepted: response.waiver_accepted || false,
          paymentStatus: response.payment_status || 'pending',
          waitlistPosition: response.waitlist_position
        };
      } catch (error) {
        console.error("[RegService] Error creating player registration:", error);
        throw error;
      }
  }
  
  async createTeamRegistration(payload: any): Promise<any> {
      console.log(`[RegService] Creating team registration for team ${payload.team_id} in tournament ${payload.tournament_id}`);
      
      try {
        // Add required fields for Appwrite
        const fullPayload = {
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const response = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          'unique()',
          fullPayload
        );
        
        // Map result back to TeamRegistration type
        return {
          id: response.$id,
          tournamentId: response.tournament_id,
          teamId: response.team_id,
          categoryId: response.category_id,
          status: response.status,
          registeredAt: response.created_at,
          teamName: response.team_name || "Unknown Team",
          waiverAccepted: response.waiver_accepted || false,
          paymentStatus: response.payment_status || 'pending',
          waitlistPosition: response.waitlist_position
        };
      } catch (error) {
        console.error("[RegService] Error creating team registration:", error);
        throw error;
      }
  }
  
  // --- Add methods for waitlist management (requires backend logic/triggers) --- 
  /**
   * Updates the waitlist position for a registration.
   * This method would typically be called by backend triggers when registrations change.
   */
  async updateWaitlistPosition(registrationId: string, position: number | null): Promise<void> {
    console.log(`[RegService] Updating waitlist position for registration ${registrationId} to ${position}`);
    
    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        registrationId,
        {
          waitlist_position: position,
          updated_at: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error("[RegService] Error updating waitlist position:", error);
      throw error;
    }
  }

  /**
   * Notifies a waitlisted user about their position or status change.
   * This would typically integrate with a notification service.
   */
  async notifyWaitlistedUser(userId: string, message: string): Promise<void> {
    console.log(`[RegService] Notifying waitlisted user ${userId}: ${message}`);
    
    try {
      // Create a notification document in Appwrite
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        'unique()',
        {
          user_id: userId,
          message: message,
          read: false,
          created_at: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error("[RegService] Error notifying waitlisted user:", error);
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();

