import { supabase } from '../lib/supabase';
import { storageService } from './storage/StorageService';
import type {
  Profile,
  Tournament as EntityTournament,
  Division,
  Court,
  Registration,
  Match,
  Notification,
} from '../types/entities';
import type { Tournament as DemoTournament } from '../types/tournament';
import type { RegistrationMetadata, TournamentRegistrationStatus } from '../types/registration';

// Helper function to convert demo tournament to entity tournament
function convertDemoTournamentToEntity(demo: DemoTournament): EntityTournament {
  return {
    id: demo.id,
    name: demo.name,
    description: demo.description || null,
    start_date: demo.startDate.toISOString(),
    end_date: demo.endDate.toISOString(),
    registration_deadline: demo.registrationDeadline?.toISOString() || null,
    venue: demo.location || null,
    status: demo.status.toLowerCase() as EntityTournament['status'],
    organizer_id: demo.created_by || 'demo-user',
    divisions: [],
    created_at: demo.createdAt.toISOString(),
    updated_at: demo.updatedAt.toISOString()
  };
}

// Profile Services
export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profile: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Tournament Services
export const tournamentService = {
  async createTournament(tournament: Omit<EntityTournament, 'id' | 'created_at' | 'updated_at'>): Promise<EntityTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(tournament)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTournament(id: string): Promise<EntityTournament> {
    const data = await storageService.getItem<DemoTournament>(`tournaments/${id}`);
    if (data) {
      return convertDemoTournamentToEntity(data);
    }

    const { data: supabaseData, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return supabaseData;
  },

  async listTournaments(filters?: { status?: string; organizer_id?: string }): Promise<EntityTournament[]> {
    const data = await storageService.getItem<DemoTournament[]>('tournaments');
    if (data) {
      console.log('[DEBUG] Using demo tournaments:', data);
      return data
        .filter(t => {
          if (filters?.status && t.status.toLowerCase() !== filters.status) return false;
          if (filters?.organizer_id && (t.created_by || 'demo-user') !== filters.organizer_id) return false;
          return true;
        })
        .map(convertDemoTournamentToEntity);
    }

    let query = supabase.from('tournaments').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.organizer_id) query = query.eq('organizer_id', filters.organizer_id);
    const { data: supabaseData, error } = await query;
    if (error) throw error;
    return supabaseData;
  },

  async updateTournament(id: string, tournament: Partial<EntityTournament>): Promise<EntityTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .update(tournament)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async generateMatches(tournamentId: string): Promise<{ success: boolean; message: string; matchCount?: number }> {
    console.log(`[API STUB] generateMatches called for tournamentId: ${tournamentId}`);
    // TODO: Implement actual match generation logic based on tournament format
    // 1. Fetch tournament details (format, divisions, etc.)
    // 2. Fetch approved registrations (players/teams) for each division
    // 3. Based on format (Single Elim, RR, etc.), generate the first round of matches
    //    - Assign players/teams to matches
    //    - Set round_number, match_number
    //    - Potentially handle seeding/byes
    // 4. Insert generated matches into the 'matches' table (use matchService.createMatch in bulk?)
    // 5. Update tournament status (e.g., to 'IN_PROGRESS' or 'SCHEDULED')?
    
    // Placeholder response
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
    const mockMatchCount = Math.floor(Math.random() * 10) + 4; // Simulate generating matches
    console.log(`[API STUB] Simulated generating ${mockMatchCount} matches.`);
    return { success: true, message: `Match generation initiated (stub). ${mockMatchCount} matches simulated.`, matchCount: mockMatchCount };
  },

  // ADDED: scheduleMatches (Stub)
  async scheduleMatches(tournamentId: string): Promise<{ success: boolean; message: string; scheduledCount?: number }> {
    console.log(`[API STUB] scheduleMatches called for tournamentId: ${tournamentId}`);
    // TODO: Implement actual match scheduling logic
    // 1. Fetch unscheduled matches for the tournament (status = 'SCHEDULED', scheduled_time = NULL, court_id = NULL)
    // 2. Fetch available courts and their potential time slots/availability windows
    // 3. Fetch tournament settings (e.g., match duration, time between matches)
    // 4. Implement scheduling algorithm:
    //    - Iterate through matches.
    //    - Find available court/time slot based on constraints.
    //    - Avoid conflicts (player playing two matches at once, court double-booked).
    //    - Consider round priority, player rest time, etc.
    // 5. Update matches with scheduled_time and court_id (use matchService.updateMatch in bulk?)

    // Placeholder response
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
    const mockScheduledCount = Math.floor(Math.random() * 8) + 2; // Simulate scheduling
    console.log(`[API STUB] Simulated scheduling ${mockScheduledCount} matches.`);
    return { success: true, message: `Scheduling complete (stub). ${mockScheduledCount} matches scheduled.`, scheduledCount: mockScheduledCount };
  }
};

// Division Services
export const divisionService = {
  async createDivision(division: Omit<Division, 'id' | 'created_at' | 'updated_at'>): Promise<Division> {
    const { data, error } = await supabase
      .from('divisions')
      .insert(division)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDivision(id: string): Promise<Division> {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async listDivisions(tournamentId: string): Promise<Division[]> {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return data;
  },
};

// Court Services
export const courtService = {
  async createCourt(court: Omit<Court, 'id' | 'created_at' | 'updated_at'>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .insert(court)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCourtStatus(id: string, status: string): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listCourts(tournamentId: string): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return data;
  },

  async updateCourt(id: string, courtData: Partial<Omit<Court, 'id' | 'tournament_id' | 'created_at' | 'updated_at'> >): Promise<Court> {
    const updatePayload: Partial<Court> = {};
    if (courtData.name !== undefined) updatePayload.name = courtData.name;
    if (courtData.description !== undefined) updatePayload.description = courtData.description;
    if (courtData.status !== undefined) updatePayload.status = courtData.status;
    if (courtData.court_number !== undefined) updatePayload.court_number = courtData.court_number;
    
    if (Object.keys(updatePayload).length === 0) {
      const { data, error } = await supabase.from('courts').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('courts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCourt(id: string): Promise<void> {
    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', id);
    if (error) {
      console.error("Error deleting court:", error);
      throw error; 
    }
  }
};

// Registration Services
export const registrationService = {
  async register(registration: Omit<Registration, 'id' | 'created_at' | 'updated_at'>): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        ...registration,
        metadata: registration.metadata || {},
        notes: registration.notes || null,
        priority: registration.priority || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getRegistration(id: string): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async listRegistrations(filters: { 
    tournament_id?: string; 
    division_id?: string; 
    player_id?: string; 
    partner_id?: string;
    status?: string;
  }): Promise<Registration[]> {
    let query = supabase.from('registrations').select('*');
    if (filters.tournament_id) query = query.eq('tournament_id', filters.tournament_id);
    if (filters.division_id) query = query.eq('division_id', filters.division_id);
    if (filters.player_id) query = query.eq('player_id', filters.player_id);
    if (filters.partner_id) query = query.eq('partner_id', filters.partner_id);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('priority', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateRegistration(id: string, registration: Partial<Registration>): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update(registration)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addComment(id: string, comment: { text: string; createdBy: string }): Promise<Registration> {
    const { data: registration, error: getError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;

    const metadata = {
      ...registration.metadata,
      comments: [
        ...(registration.metadata?.comments || []),
        {
          id: crypto.randomUUID(),
          text: comment.text,
          createdAt: new Date().toISOString(),
          createdBy: comment.createdBy,
        },
      ],
    };

    const { data, error } = await supabase
      .from('registrations')
      .update({ metadata })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePriority(id: string, priority: number): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update({ priority })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateNotes(id: string, notes: string): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update({ notes })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- New Waitlist Management Functions ---
  async updateWaitlistPosition(id: string, newPosition: number): Promise<Registration> {
    const { data: currentRegistration, error: getError } = await supabase
      .from('registrations')
      .select('metadata')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    const currentMetadata = (currentRegistration?.metadata || {}) as RegistrationMetadata;
    const oldPosition = currentMetadata.waitlistPosition;

    const updatedMetadata = {
      ...currentMetadata,
      waitlistPosition: newPosition,
      waitlistPromotionHistory: [
        ...(currentMetadata.waitlistPromotionHistory || []),
        {
          date: new Date().toISOString(),
          fromPosition: oldPosition || 0,
          toPosition: newPosition,
        },
      ],
    };

    // TODO: Add logic here to shift other waitlist positions if necessary
    // This might involve fetching other waitlisted items and updating them in a transaction

    const { data, error } = await supabase
      .from('registrations')
      .update({ metadata: updatedMetadata })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async promoteFromWaitlist(id: string, newStatus: TournamentRegistrationStatus = 'PENDING'): Promise<Registration> {
    const { data: currentRegistration, error: getError } = await supabase
      .from('registrations')
      .select('metadata, tournament_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    const currentMetadata = (currentRegistration?.metadata || {}) as RegistrationMetadata;
    const oldPosition = currentMetadata.waitlistPosition;

    // Update the promoted registration: change status, remove waitlist position
    const updatedMetadata = { ...currentMetadata };
    delete updatedMetadata.waitlistPosition; // Remove position
    // Optionally clear reason/notified/history or keep for record
    // delete updatedMetadata.waitlistReason;
    // delete updatedMetadata.waitlistNotified;
    // updatedMetadata.waitlistPromotionHistory = [...]; // Add promotion event

    const { data: promotedReg, error: promoteError } = await supabase
      .from('registrations')
      .update({ 
          status: newStatus, 
          metadata: updatedMetadata,
          priority: 0 // Reset priority? Or keep?
      })
      .eq('id', id)
      .select()
      .single();
      
    if (promoteError) throw promoteError;

    // TODO: Shift subsequent waitlisted items up by one position
    if (oldPosition && currentRegistration.tournament_id) {
      // Fetch registrations on waitlist for the same tournament with position > oldPosition
      // Update their waitlistPosition -= 1
      // This should ideally be done in a transaction or a database function for atomicity
      console.warn(`TODO: Implement shifting of waitlist positions after promoting ID: ${id} from position ${oldPosition}`);
    }

    return promotedReg;
  }
  // --- End Waitlist Management Functions ---
};

// Match Services
export const matchService = {
  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert(match)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMatch(id: string, match: Partial<Match>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update(match)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMatch(id: string): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async listMatches(filters: { tournament_id?: string; division_id?: string; court_id?: string; status?: string }): Promise<Match[]> {
    let query = supabase.from('matches').select('*');
    if (filters.tournament_id) query = query.eq('tournament_id', filters.tournament_id);
    if (filters.division_id) query = query.eq('division_id', filters.division_id);
    if (filters.court_id) query = query.eq('court_id', filters.court_id);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

// Notification Services
export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (unreadOnly) query = query.eq('read', false);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

// Email Service
export const emailService = {
  async sendEmail(params: { to: string; subject: string; html: string }): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Error invoking send-email function:', error);
      return { data: null, error };
    }

    console.log('Successfully invoked send-email function:', data);
    return { data, error: null };
  }
};

// Define TournamentMessage type based on schema
interface TournamentMessage {
  id: string;
  tournament_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Optionally join sender profile info here if needed frequently
  // sender?: { display_name: string | null, avatar_url: string | null };
}

// Message Service (NEW)
export const messageService = {
  async listMessages(tournamentId: string, limit = 50): Promise<TournamentMessage[]> {
    const { data, error } = await supabase
      .from('tournament_messages')
      .select('*') 
      // TODO: Select sender profile info if needed: '*, sender:profiles(display_name, avatar_url)'
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error listing messages:", error);
      throw error;
    }
    // Messages are fetched newest first, reverse for display
    return (data as TournamentMessage[]).reverse() || [];
  },

  async sendMessage(tournamentId: string, senderId: string, content: string): Promise<TournamentMessage> {
     if (!content.trim()) {
      throw new Error("Message content cannot be empty.");
    }
     if (content.length > 500) { // Match schema constraint
      throw new Error("Message content exceeds maximum length (500 characters).");
    }

    const { data, error } = await supabase
      .from('tournament_messages')
      .insert({
        tournament_id: tournamentId,
        sender_id: senderId,
        content: content,
      })
      .select()
      // TODO: Select sender profile info if needed
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }
    return data as TournamentMessage;
  },
}; 