import { supabase } from "@/lib/supabase";
import { PlayerRegistration, TeamRegistration, RegistrationStatus } from "@/types/registration";
import { Database } from "@/lib/database.types";
import { Tournament } from "@/types/tournament"; // Import Tournament type

// Define types for insert/update payloads
type PlayerRegInsert = Database["public"]["Tables"]["tournament_registrations"]["Insert"];
type PlayerRegUpdate = Database["public"]["Tables"]["tournament_registrations"]["Update"];
// Assuming team registrations are also in 'registrations' table based on previous analysis
type RegInsert = Database["public"]["Tables"]["registrations"]["Insert"];
type RegUpdate = Database["public"]["Tables"]["registrations"]["Update"];

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
    const { data, error } = await supabase
      .from("tournament_registrations") // Assuming this is the correct table for player registrations
      .select(`
        *,
        profiles ( id, full_name, display_name, email )
      `)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[RegService] Error fetching player registrations:", error);
      throw error;
    }
    
    // Map data to PlayerRegistration type
    return data.map((reg: any) => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        userId: reg.user_id,
        categoryId: reg.category_id,
        status: reg.status as RegistrationStatus,
        registeredAt: reg.created_at,
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
    
    const { data, error } = await supabase
      .from("registrations") // Use the correct table name
      .select(`
        *,
        teams ( id, name, captain_id )
      `)
      .eq("tournament_id", tournamentId)
      .not("team_id", "is", null) // Filter for team registrations
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[RegService] Error fetching team registrations:", error);
      throw error;
    }
    
    // Map data to TeamRegistration type
    return data.map((reg: any) => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        teamId: reg.team_id,
        divisionId: reg.division_id,
        categoryId: reg.category_id,
        status: reg.status as RegistrationStatus,
        registeredAt: reg.created_at,
        updatedAt: reg.updated_at,
        teamName: reg.teams?.name || "Unknown Team",
        captainId: reg.teams?.captain_id,
        waitlistPosition: reg.waitlist_position
    }));
  }

  /**
   * Fetches all registrations (player and team) for a specific user.
   * Includes tournament details.
   */
  async getUserRegistrations(userId: string): Promise<UserRegistration[]> {
    console.log(`[RegService] Fetching registrations for user: ${userId}`);
    
    // 1. Fetch player registrations (assuming table 'tournament_registrations')
    const { data: playerRegsData, error: playerRegsError } = await supabase
      .from('tournament_registrations')
      .select(`
        id,
        tournament_id,
        status,
        created_at,
        tournaments ( id, name, start_date, end_date )
      `)
      .eq('user_id', userId);

    if (playerRegsError) {
      console.error("[RegService] Error fetching user's player registrations:", playerRegsError);
      throw playerRegsError;
    }

    // 2. Fetch teams the user is a member of
    const { data: teamMembersData, error: teamMembersError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (teamMembersError) {
      console.error("[RegService] Error fetching user's teams:", teamMembersError);
      throw teamMembersError;
    }

    const teamIds = teamMembersData.map(tm => tm.team_id);
    let teamRegsData: any[] = [];

    // 3. Fetch team registrations if the user is part of any teams
    if (teamIds.length > 0) {
      const { data: fetchedTeamRegs, error: teamRegsError } = await supabase
        .from('registrations') // Assuming 'registrations' table holds team registrations
        .select(`
          id,
          tournament_id,
          team_id,
          status,
          created_at,
          tournaments ( id, name, start_date, end_date ),
          teams ( name )
        `)
        .in('team_id', teamIds);

      if (teamRegsError) {
        console.error("[RegService] Error fetching user's team registrations:", teamRegsError);
        throw teamRegsError;
      }
      teamRegsData = fetchedTeamRegs;
    }

    // 4. Combine and map results
    const combinedRegistrations: UserRegistration[] = [];

    playerRegsData.forEach((reg: any) => {
      if (reg.tournaments) { // Ensure tournament data exists
        combinedRegistrations.push({
          id: reg.id,
          tournamentId: reg.tournament_id,
          tournamentName: reg.tournaments.name,
          tournamentStartDate: reg.tournaments.start_date,
          tournamentEndDate: reg.tournaments.end_date,
          status: reg.status as RegistrationStatus,
          registeredAt: reg.created_at,
          isTeamRegistration: false,
        });
      }
    });

    teamRegsData.forEach((reg: any) => {
      if (reg.tournaments && reg.teams) { // Ensure tournament and team data exists
        // Avoid duplicates if a user is registered individually AND via a team for the same tournament (edge case)
        if (!combinedRegistrations.some(cr => cr.tournamentId === reg.tournament_id)) {
          combinedRegistrations.push({
            id: reg.id,
            tournamentId: reg.tournament_id,
            tournamentName: reg.tournaments.name,
            tournamentStartDate: reg.tournaments.start_date,
            tournamentEndDate: reg.tournaments.end_date,
            status: reg.status as RegistrationStatus,
            registeredAt: reg.created_at,
            isTeamRegistration: true,
            teamName: reg.teams.name,
          });
        }
      }
    });

    // Sort by registration date or tournament start date if needed
    combinedRegistrations.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return combinedRegistrations;
  }


  /**
   * Updates the status of a single player registration.
   */
  async updatePlayerRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Updating player registration ${id} status to ${status}`);
    const updatePayload: PlayerRegUpdate = { 
        status: status,
        updated_at: new Date().toISOString()
    };
    if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
    }
    
    const { error } = await supabase
      .from("tournament_registrations")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
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
    
    const updatePayload: RegUpdate = { // Use RegUpdate for 'registrations' table
        status: status,
        updated_at: new Date().toISOString()
    };
    if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
    }
    
    const { error } = await supabase
      .from("registrations") // Target the registrations table
      .update(updatePayload)
      .eq("id", id)
      .not("team_id", "is", null); // Ensure it's a team registration

    if (error) {
      console.error("[RegService] Error updating team registration status:", error);
      throw error;
    }
  }

  /**
   * Bulk updates the status for multiple player registrations.
   */
  async bulkUpdatePlayerStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Bulk updating ${ids.length} player registrations to ${status}`);
    const updatePayload: PlayerRegUpdate = { 
        status: status,
        updated_at: new Date().toISOString()
    };
    if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
    }

    const { error } = await supabase
      .from("tournament_registrations")
      .update(updatePayload)
      .in("id", ids);

    if (error) {
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
    
    const updatePayload: RegUpdate = { // Use RegUpdate for 'registrations' table
        status: status,
        updated_at: new Date().toISOString()
    };
    if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
    }

    const { error } = await supabase
      .from("registrations") // Target the registrations table
      .update(updatePayload)
      .in("id", ids)
      .not("team_id", "is", null); // Ensure these are team registrations

    if (error) {
      console.error("[RegService] Error bulk updating team status:", error);
      throw error;
    }
  }
  
  // --- Add methods for creating registrations (player/team) --- 
  async createPlayerRegistration(payload: Omit<PlayerRegInsert, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerRegistration> {
      console.log(`[RegService] Creating player registration for user ${payload.user_id} in tournament ${payload.tournament_id}`);
      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert(payload)
        .select('*, profiles ( id, full_name, display_name, email )')
        .single();
        
      if (error) {
          console.error("[RegService] Error creating player registration:", error);
          throw error;
      }
      
      // Map result back to PlayerRegistration type
      const reg: any = data;
      return {
          id: reg.id,
          tournamentId: reg.tournament_id,
          userId: reg.user_id,
          categoryId: reg.category_id,
          status: reg.status as RegistrationStatus,
          registeredAt: reg.created_at,
          playerName: reg.profiles?.display_name || reg.profiles?.full_name || "Unknown Player",
          playerEmail: reg.profiles?.email || "N/A",
          waiverAccepted: reg.waiver_accepted || false,
          paymentStatus: reg.payment_status || 'pending',
          waitlistPosition: reg.waitlist_position
      };
  }
  
  // async createTeamRegistration(...) { ... } // Placeholder

  // --- Add methods for waitlist management (requires backend logic/triggers) --- 
  // async updateWaitlistPosition(...) { ... } // Placeholder
  // async notifyWaitlistedUser(...) { ... } // Placeholder
}

export const registrationService = new RegistrationService();

