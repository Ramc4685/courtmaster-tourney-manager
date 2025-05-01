import { supabase } from "@/lib/supabase";
import { PlayerRegistration, TeamRegistration, RegistrationStatus } from "@/types/registration";
import { Database } from "@/lib/database.types";

// Define types for insert/update payloads
type PlayerRegInsert = Database["public"]["Tables"]["tournament_registrations"]["Insert"];
type PlayerRegUpdate = Database["public"]["Tables"]["tournament_registrations"]["Update"];
type TeamRegInsert = Database["public"]["Tables"]["team_registrations"]["Insert"]; // Assuming a separate table
type TeamRegUpdate = Database["public"]["Tables"]["team_registrations"]["Update"]; // Assuming a separate table

// NOTE: The schema provided doesn't explicitly show a separate team_registrations table.
// Assuming for now that team registrations might also use tournament_registrations 
// or require a different structure. Adjust based on actual schema.
// For now, team functions will be placeholders or mirror player functions.

export class RegistrationService {
  /**
   * Fetches player registrations for a specific tournament.
   * Includes profile information for the registered user.
   */
  async getPlayerRegistrations(tournamentId: string): Promise<PlayerRegistration[]> {
    console.log(`[RegService] Fetching player registrations for tournament: ${tournamentId}`);
    const { data, error } = await supabase
      .from("tournament_registrations")
      .select(`
        *,
        profiles ( id, full_name, display_name, email )
      `)
      .eq("tournament_id", tournamentId)
      // .is("team_id", null) // Assuming player registrations have team_id as null
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
        // Extract profile info
        playerName: reg.profiles?.display_name || reg.profiles?.full_name || "Unknown Player",
        playerEmail: reg.profiles?.email || "N/A",
        // Add other relevant fields like waiver_accepted, payment_status etc.
        waiverAccepted: reg.waiver_accepted || false,
        paymentStatus: reg.payment_status || 'pending',
        waitlistPosition: reg.waitlist_position
    }));
  }

  /**
   * Fetches team registrations for a specific tournament.
   * Placeholder - Adjust based on actual schema for teams.
   */
  async getTeamRegistrations(tournamentId: string): Promise<TeamRegistration[]> {
    console.log(`[RegService] Fetching team registrations for tournament: ${tournamentId}`);
    // --- Placeholder Implementation --- 
    // Adjust query based on how teams are stored (e.g., separate table or flag in tournament_registrations)
    // Example assuming team_id is present in tournament_registrations for team entries:
    /*
    const { data, error } = await supabase
      .from("tournament_registrations")
      .select(`
        *,
        teams ( id, name, captain_id, members:team_members(user_id) )
      `)
      .eq("tournament_id", tournamentId)
      .not("team_id", "is", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[RegService] Error fetching team registrations:", error);
      throw error;
    }
    
    return data.map((reg: any) => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        teamId: reg.team_id,
        categoryId: reg.category_id,
        status: reg.status as RegistrationStatus,
        registeredAt: reg.created_at,
        teamName: reg.teams?.name || "Unknown Team",
        captainId: reg.teams?.captain_id,
        memberUserIds: reg.teams?.members?.map((m: any) => m.user_id) || [],
        waiverAccepted: reg.waiver_accepted || false,
        paymentStatus: reg.payment_status || 'pending',
        waitlistPosition: reg.waitlist_position
    }));
    */
    console.warn("[RegService] getTeamRegistrations is a placeholder and needs implementation based on schema.")
    return []; // Return empty array for now
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
    // If moving from waitlist, clear position
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
   * Placeholder - Adjust based on actual schema.
   */
  async updateTeamRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Updating team registration ${id} status to ${status}`);
    // --- Placeholder Implementation --- 
    // Adjust based on schema
    /*
    const updatePayload: TeamRegUpdate = { 
        status: status,
        updated_at: new Date().toISOString()
    };
    if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
    }
    
    const { error } = await supabase
      .from("team_registrations") // Or tournament_registrations
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("[RegService] Error updating team registration status:", error);
      throw error;
    }
    */
    console.warn("[RegService] updateTeamRegistrationStatus is a placeholder.")
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
   * Placeholder - Adjust based on actual schema.
   */
  async bulkUpdateTeamStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    console.log(`[RegService] Bulk updating ${ids.length} team registrations to ${status}`);
    // --- Placeholder Implementation --- 
    /*
    const updatePayload: TeamRegUpdate = { 
        status: status,
        updated_at: new Date().toISOString()
    };
     if (status !== 'WAITLIST') {
        updatePayload.waitlist_position = null;
    }
    
    const { error } = await supabase
      .from("team_registrations") // Or tournament_registrations
      .update(updatePayload)
      .in("id", ids);

    if (error) {
      console.error("[RegService] Error bulk updating team status:", error);
      throw error;
    }
    */
    console.warn("[RegService] bulkUpdateTeamStatus is a placeholder.")
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

