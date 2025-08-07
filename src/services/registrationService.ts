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
        [Query.equal("tournament_id", tournamentId), Query.orderAsc("$createdAt")]
      );
      
      // Map data to PlayerRegistration type
      return response.documents.map((reg: any) => ({
        id: reg.$id,
        tournamentId: reg.tournament_id,
        userId: reg.user_id,
        categoryId: reg.category_id,
        status: reg.status,
        registeredAt: reg.$createdAt,
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
    } catch (error) {
      console.error("[RegService] Error fetching player registrations with profiles:", error);
      throw error;
    }
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
  }

  /**
   * Fetches all registrations (both player and team) for a specific user.
   * Joins with the tournaments table to get tournament details.
   */
  async getUserRegistrations(userId: string): Promise<UserRegistration[]> {
    console.log(`[RegService] Fetching registrations for user: ${userId}`);
    
    try {
      // Fetch player registrations where user is directly registered
      const playerRegsResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [Query.equal("user_id", userId), Query.orderDesc("$createdAt")]
      );
      
      // Fetch team memberships to find team registrations where user is a member
      const teamMembersResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TEAM_MEMBERS,
        [Query.equal("user_id", userId)]
      );
      
      // Extract team IDs where user is a member
      const teamIds = teamMembersResponse.documents.map((member: any) => member.team_id);
      
      let teamRegsData: any[] = [];
      
      // If user is part of any teams, fetch team registrations
      if (teamIds.length > 0) {
        const teamRegsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [Query.equal("team_id", teamIds), Query.orderDesc("$createdAt")]
        );
        
        teamRegsData = teamRegsResponse.documents;
      }
      
      // Fetch tournament details for all registrations
      const tournamentIds = [
        ...playerRegsResponse.documents.map((reg: any) => reg.tournament_id),
        ...teamRegsData.map((reg: any) => reg.tournament_id)
      ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
      
      const tournamentsResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        [Query.equal("$id", tournamentIds)]
      );
      
      const tournamentsMap: Record<string, any> = {};
      tournamentsResponse.documents.forEach((tournament: any) => {
        tournamentsMap[tournament.$id] = tournament;
      });
      
      // Map player registrations to UserRegistration type
      const playerRegistrations = playerRegsResponse.documents.map((reg: any) => {
        const tournament = tournamentsMap[reg.tournament_id] || {};
        return {
          id: reg.$id,
          tournamentId: reg.tournament_id,
          tournamentName: tournament.name || "Unknown Tournament",
          tournamentStartDate: tournament.start_date || "",
          tournamentEndDate: tournament.end_date || "",
          status: reg.status as RegistrationStatus,
          registeredAt: reg.$createdAt,
          isTeamRegistration: false,
          paymentStatus: reg.payment_status || 'pending',
          waitlistPosition: reg.waitlist_position
        };
      });
      
      // Map team registrations to UserRegistration type
      const teamRegistrations = teamRegsData.map((reg: any) => {
        const tournament = tournamentsMap[reg.tournament_id] || {};
        return {
          id: reg.$id,
          tournamentId: reg.tournament_id,
          tournamentName: tournament.name || "Unknown Tournament",
          tournamentStartDate: tournament.start_date || "",
          tournamentEndDate: tournament.end_date || "",
          status: reg.status as RegistrationStatus,
          registeredAt: reg.$createdAt,
          isTeamRegistration: true,
          teamName: reg.team_name || "Unknown Team",
          paymentStatus: reg.payment_status || 'pending',
          waitlistPosition: reg.waitlist_position
        };
      });
      
      // Combine and sort by registration date (newest first)
      return [...playerRegistrations, ...teamRegistrations].sort(
        (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
      );
    } catch (error) {
      console.error("[RegService] Error fetching user registrations:", error);
      throw error;
    }
  }

  /**
   * Updates the status of a player registration.
   * Can be used to approve, reject, or waitlist a registration.
   */
  async updatePlayerRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Updating player registration ${id} status to ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      // If status is waitlisted, we need to calculate waitlist position
      if (status === RegistrationStatus.WAITLISTED) {
        // Get the registration to find the tournament and category
        const registration = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id
        );
        
        // Count existing waitlisted registrations in the same category
        const waitlistedResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [
            Query.equal("tournament_id", registration.tournament_id),
            Query.equal("category_id", registration.category_id),
            Query.equal("status", RegistrationStatus.WAITLISTED)
          ]
        );
        
        // Set waitlist position to current count + 1
        updatePayload.waitlist_position = waitlistedResponse.documents.length + 1;
      } else {
        // If not waitlisted, remove waitlist position
        updatePayload.waitlist_position = null;
      }
      
      // Update the registration
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        id,
        updatePayload
      );
    } catch (error) {
      console.error(`[RegService] Error updating player registration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates the status of a team registration.
   * Can be used to approve, reject, or waitlist a registration.
   */
  async updateTeamRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Updating team registration ${id} status to ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      // If status is waitlisted, we need to calculate waitlist position
      if (status === RegistrationStatus.WAITLISTED) {
        // Get the registration to find the tournament and category
        const registration = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id
        );
        
        // Count existing waitlisted registrations in the same category
        const waitlistedResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [
            Query.equal("tournament_id", registration.tournament_id),
            Query.equal("category_id", registration.category_id),
            Query.equal("status", RegistrationStatus.WAITLISTED),
            Query.notEqual("team_id", null) // Only count team registrations
          ]
        );
        
        // Set waitlist position to current count + 1
        updatePayload.waitlist_position = waitlistedResponse.documents.length + 1;
      } else {
        // If not waitlisted, remove waitlist position
        updatePayload.waitlist_position = null;
      }
      
      // Update the registration
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        id,
        updatePayload
      );
    } catch (error) {
      console.error(`[RegService] Error updating team registration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Bulk updates the status of multiple player registrations.
   * Useful for approving or rejecting multiple registrations at once.
   */
  async bulkUpdatePlayerStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Bulk updating ${ids.length} player registrations to status ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      // If status is waitlisted, we need to handle waitlist positions
      if (status === RegistrationStatus.WAITLISTED) {
        // For each registration, we need to calculate its waitlist position
        // This is more complex and would require sequential updates
        
        // Get all registrations to find their tournaments and categories
        const registrationsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [Query.equal("$id", ids)]
        );
        
        // Group by tournament and category
        const groupedRegs: Record<string, any[]> = {};
        registrationsResponse.documents.forEach((reg: any) => {
          const key = `${reg.tournament_id}_${reg.category_id}`;
          if (!groupedRegs[key]) {
            groupedRegs[key] = [];
          }
          groupedRegs[key].push(reg);
        });
        
        // For each group, get current waitlist count and update positions
        const updatePromises = [];
        
        for (const key in groupedRegs) {
          const [tournamentId, categoryId] = key.split('_');
          const regsInGroup = groupedRegs[key];
          
          // Count existing waitlisted registrations in this category
          const waitlistedResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.REGISTRATIONS,
            [
              Query.equal("tournament_id", tournamentId),
              Query.equal("category_id", categoryId),
              Query.equal("status", RegistrationStatus.WAITLISTED)
            ]
          );
          
          let waitlistPosition = waitlistedResponse.documents.length + 1;
          
          // Update each registration with incremented waitlist position
          for (const reg of regsInGroup) {
            const regUpdatePayload = {
              ...updatePayload,
              waitlist_position: waitlistPosition++
            };
            
            updatePromises.push(
              databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                COLLECTIONS.REGISTRATIONS,
                reg.$id,
                regUpdatePayload
              )
            );
          }
        }
        
        await Promise.all(updatePromises);
      } else {
        // If not waitlisted, we can update all at once with the same payload
        const updatePromises = ids.map(id => 
          databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.REGISTRATIONS,
            id,
            {
              ...updatePayload,
              waitlist_position: null // Remove waitlist position if not waitlisted
            }
          )
        );
        
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error(`[RegService] Error bulk updating player registrations:`, error);
      throw error;
    }
  }

  /**
   * Bulk updates the status of multiple team registrations.
   * Useful for approving or rejecting multiple team registrations at once.
   */
  async bulkUpdateTeamStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Bulk updating ${ids.length} team registrations to status ${status}`);
    
    try {
      const updatePayload: any = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      // If status is waitlisted, we need to handle waitlist positions
      if (status === RegistrationStatus.WAITLISTED) {
        // For each registration, we need to calculate its waitlist position
        // This is more complex and would require sequential updates
        
        // Get all registrations to find their tournaments and categories
        const registrationsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [Query.equal("$id", ids)]
        );
        
        // Group by tournament and category
        const groupedRegs: Record<string, any[]> = {};
        registrationsResponse.documents.forEach((reg: any) => {
          const key = `${reg.tournament_id}_${reg.category_id}`;
          if (!groupedRegs[key]) {
            groupedRegs[key] = [];
          }
          groupedRegs[key].push(reg);
        });
        
        // For each group, get current waitlist count and update positions
        const updatePromises = [];
        
        for (const key in groupedRegs) {
          const [tournamentId, categoryId] = key.split('_');
          const regsInGroup = groupedRegs[key];
          
          // Count existing waitlisted team registrations in this category
          const waitlistedResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.REGISTRATIONS,
            [
              Query.equal("tournament_id", tournamentId),
              Query.equal("category_id", categoryId),
              Query.equal("status", RegistrationStatus.WAITLISTED),
              Query.notEqual("team_id", null) // Only count team registrations
            ]
          );
          
          let waitlistPosition = waitlistedResponse.documents.length + 1;
          
          // Update each registration with incremented waitlist position
          for (const reg of regsInGroup) {
            const regUpdatePayload = {
              ...updatePayload,
              waitlist_position: waitlistPosition++
            };
            
            updatePromises.push(
              databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                COLLECTIONS.REGISTRATIONS,
                reg.$id,
                regUpdatePayload
              )
            );
          }
        }
        
        await Promise.all(updatePromises);
      } else {
        // If not waitlisted, we can update all at once with the same payload
        const updatePromises = ids.map(id => 
          databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.REGISTRATIONS,
            id,
            {
              ...updatePayload,
              waitlist_position: null // Remove waitlist position if not waitlisted
            }
          )
        );
        
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error(`[RegService] Error bulk updating team registrations:`, error);
      throw error;
    }
  }

  /**
   * Creates a new player registration for a tournament.
   */
  async createPlayerRegistration(payload: any): Promise<any> {
    console.log(`[RegService] Creating player registration for user ${payload.user_id} in tournament ${payload.tournament_id}`);
    
    try {
      // Add required fields for Appwrite
      const registrationData = {
        tournament_id: payload.tournament_id,
        user_id: payload.user_id,
        category_id: payload.category_id,
        status: payload.status || RegistrationStatus.PENDING,
        waiver_accepted: payload.waiver_accepted || false,
        payment_status: payload.payment_status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Check if registration already exists
      const existingResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal("tournament_id", payload.tournament_id),
          Query.equal("user_id", payload.user_id),
          Query.equal("category_id", payload.category_id)
        ]
      );
      
      if (existingResponse.documents.length > 0) {
        throw new Error("Player is already registered for this tournament category");
      }
      
      // Check if category has reached capacity
      const tournament = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        payload.tournament_id
      );
      
      const categoryCapacity = tournament.categories?.find(
        (c: any) => c.id === payload.category_id
      )?.capacity || 0;
      
      if (categoryCapacity > 0) {
        // Count approved registrations in this category
        const approvedResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [
            Query.equal("tournament_id", payload.tournament_id),
            Query.equal("category_id", payload.category_id),
            Query.equal("status", RegistrationStatus.APPROVED)
          ]
        );
        
        // If category is full, set status to waitlisted
        if (approvedResponse.documents.length >= categoryCapacity) {
          registrationData.status = RegistrationStatus.WAITLISTED;
          
          // Calculate waitlist position
          const waitlistedResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.REGISTRATIONS,
            [
              Query.equal("tournament_id", payload.tournament_id),
              Query.equal("category_id", payload.category_id),
              Query.equal("status", RegistrationStatus.WAITLISTED)
            ]
          );
          
          registrationData.waitlist_position = waitlistedResponse.documents.length + 1;
        }
      }
      
      // Create the registration
      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        ID.unique(),
        registrationData
      );
      
      return {
        id: response.$id,
        ...registrationData
      };
    } catch (error) {
      console.error("[RegService] Error creating player registration:", error);
      throw error;
    }
  }

  /**
   * Creates a new team registration for a tournament.
   */
  async createTeamRegistration(payload: any): Promise<any> {
    console.log(`[RegService] Creating team registration for team ${payload.team_id} in tournament ${payload.tournament_id}`);
    
    try {
      // Add required fields for Appwrite
      const registrationData = {
        tournament_id: payload.tournament_id,
        team_id: payload.team_id,
        team_name: payload.team_name,
        captain_id: payload.captain_id,
        captain_name: payload.captain_name,
        category_id: payload.category_id,
        status: payload.status || RegistrationStatus.PENDING,
        payment_status: payload.payment_status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Check if registration already exists
      const existingResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal("tournament_id", payload.tournament_id),
          Query.equal("team_id", payload.team_id),
          Query.equal("category_id", payload.category_id)
        ]
      );
      
      if (existingResponse.documents.length > 0) {
        throw new Error("Team is already registered for this tournament category");
      }
      
      // Check if category has reached capacity
      const tournament = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        payload.tournament_id
      );
      
      const categoryCapacity = tournament.categories?.find(
        (c: any) => c.id === payload.category_id
      )?.capacity || 0;
      
      if (categoryCapacity > 0) {
        // Count approved registrations in this category
        const approvedResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          [
            Query.equal("tournament_id", payload.tournament_id),
            Query.equal("category_id", payload.category_id),
            Query.equal("status", RegistrationStatus.APPROVED),
            Query.notEqual("team_id", null) // Only count team registrations
          ]
        );
        
        // If category is full, set status to waitlisted
        if (approvedResponse.documents.length >= categoryCapacity) {
          registrationData.status = RegistrationStatus.WAITLISTED;
          
          // Calculate waitlist position
          const waitlistedResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.REGISTRATIONS,
            [
              Query.equal("tournament_id", payload.tournament_id),
              Query.equal("category_id", payload.category_id),
              Query.equal("status", RegistrationStatus.WAITLISTED),
              Query.notEqual("team_id", null) // Only count team registrations
            ]
          );
          
          registrationData.waitlist_position = waitlistedResponse.documents.length + 1;
        }
      }
      
      // Create the registration
      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        ID.unique(),
        registrationData
      );
      
      return {
        id: response.$id,
        ...registrationData
      };
    } catch (error) {
      console.error("[RegService] Error creating team registration:", error);
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();
