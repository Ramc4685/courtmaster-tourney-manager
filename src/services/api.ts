import { supabase } from '@/integrations/supabase/client';
import { transformers } from '@/utils/dataTransform';
import type {
  Profile,
  Tournament as EntityTournament,
  Division,
  Court,
  Registration,
  Match,
  Notification,
  Team,
  Player,
  TournamentCategory,
} from '@/types/entities';
import { RegistrationStatus } from '@/types/entities';
import type { Tournament as DemoTournament } from '../types/tournament';
import type { RegistrationMetadata, TournamentRegistrationStatus } from '../types/registration';
import { storageService } from './storage';
import { TournamentStage, TournamentStatus } from '../types/tournament';
import type { Json } from '@/types/supabase';
import { TournamentFormat } from '../types/tournament-enums';
import { tournamentService as demoTournamentService } from './tournament/TournamentService';

// Helper function to convert metadata to Json type
function toJson<T>(data: T): Json {
  return data as unknown as Json;
}

// Helper function to convert Json to specific type
function fromJson<T>(json: Json): T {
  return json as unknown as T;
}

// Helper function to convert demo tournament to entity tournament
function convertDemoTournamentToEntity(demo: DemoTournament): EntityTournament {
  return {
    id: demo.id,
    name: demo.name,
    description: demo.description || null,
    startDate: new Date(demo.startDate),
    endDate: new Date(demo.endDate),
    registrationDeadline: demo.registrationDeadline ? new Date(demo.registrationDeadline) : null,
    location: demo.location || null,
    status: demo.status.toLowerCase() as EntityTournament['status'],
    organizer_id: demo.created_by || 'demo-user',
    createdAt: new Date(demo.createdAt),
    updatedAt: new Date(demo.updatedAt),
    format: {
      type: TournamentFormat.ROUND_ROBIN,
      stages: [TournamentStage.GROUP_STAGE, TournamentStage.FINALS],
      scoring: {
        matchFormat: 'STANDARD',
        pointsToWin: 21,
        setsToWin: 2,
        pointsToWinSet: 21,
        tiebreakPoints: 15,
        finalSetTiebreak: true,
        mustWinByTwo: true,
        maxPoints: 30,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30,
        gamesPerSet: undefined,
        pointsPerGame: undefined
      },
      divisions: []
    },
    currentStage: TournamentStage.REGISTRATION,
    registrationEnabled: true,
    requirePlayerProfile: false,
    teams: [],
    matches: [],
    courts: [],
    categories: [],
    scoringSettings: {
      matchFormat: 'STANDARD',
      pointsToWin: 21,
      mustWinByTwo: true,
      maxPoints: 30,
      maxSets: 3,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      setsToWin: 2,
      gamesPerSet: undefined,
      pointsPerGame: undefined
    }
  };
}

// Define TournamentMessage interface
export interface TournamentMessage {
  id: string;
  tournamentId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export class APIService {
  // Profile Services
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return transformers.profile.fromAPI(data);
  }

  async updateProfile(userId: string, profile: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(transformers.profile.toAPI(profile))
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return transformers.profile.fromAPI(data);
  }

  // Tournament Services
  async createTournament(tournament: Omit<EntityTournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntityTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(transformers.tournament.toAPI(tournament))
      .select()
      .single();
    if (error) throw error;
    return transformers.tournament.fromAPI(data);
  }

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
    return transformers.tournament.fromAPI(supabaseData);
  }

  async listTournaments(filters?: { status?: string; organizer_id?: string }): Promise<EntityTournament[]> {
    try {
      const data = await storageService.getItem<DemoTournament[]>('tournaments');
      if (data) {
        console.log('[DEBUG] Using demo tournaments:', data);
        return data
          .filter(t => {
            if (filters?.status && t.status !== filters.status) return false;
            if (filters?.organizer_id && (t.created_by || 'demo-user') !== filters.organizer_id) return false;
            return true;
          })
          .map(convertDemoTournamentToEntity);
      }

      let query = supabase.from('tournaments').select('*');
      
      if (filters?.status) {
        query = query.eq('status', filters.status.toLowerCase());
      }
      if (filters?.organizer_id) {
        query = query.eq('organizer_id', filters.organizer_id);
      }
      
      const { data: supabaseData, error } = await query;
      if (error) {
        console.error('[API] Supabase error listing tournaments:', error);
        throw error;
      }
      
      const tournaments = (supabaseData || []).map(transformers.tournament.fromAPI);
      console.log('[DEBUG] Loaded tournaments from Supabase:', tournaments.length);
      return tournaments;
    } catch (error) {
      console.error('[API] Error listing tournaments:', error);
      // Initialize demo tournaments as fallback
      const demoTournaments = await demoTournamentService.getTournaments();
      console.log('[DEBUG] Falling back to demo tournaments:', demoTournaments.length);
      return demoTournaments.filter(t => {
        if (filters?.status && t.status !== filters.status) return false;
        if (filters?.organizer_id && (t.created_by || 'demo-user') !== filters.organizer_id) return false;
        return true;
      });
    }
  }

  async updateTournament(id: string, tournament: Partial<EntityTournament>): Promise<EntityTournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .update(transformers.tournament.toAPI(tournament))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.tournament.fromAPI(data);
  }

  async generateMatches(tournamentId: string): Promise<{ success: boolean; message: string; matchCount?: number }> {
    console.log(`[API STUB] generateMatches called for tournamentId: ${tournamentId}`);
    // TODO: Implement actual match generation logic based on tournament format
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
    const mockMatchCount = Math.floor(Math.random() * 10) + 4; // Simulate generating matches
    console.log(`[API STUB] Simulated generating ${mockMatchCount} matches.`);
    return { success: true, message: `Match generation initiated (stub). ${mockMatchCount} matches simulated.`, matchCount: mockMatchCount };
  }

  // ADDED: scheduleMatches (Stub)
  async scheduleMatches(tournamentId: string): Promise<{ success: boolean; message: string; scheduledCount?: number }> {
    console.log(`[API STUB] scheduleMatches called for tournamentId: ${tournamentId}`);
    // TODO: Implement actual match scheduling logic
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
    const mockScheduledCount = Math.floor(Math.random() * 8) + 2; // Simulate scheduling
    console.log(`[API STUB] Simulated scheduling ${mockScheduledCount} matches.`);
    return { success: true, message: `Scheduling complete (stub). ${mockScheduledCount} matches scheduled.`, scheduledCount: mockScheduledCount };
  }

  // Division Services
  async createDivision(division: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>): Promise<Division> {
    const { data, error } = await supabase
      .from('divisions')
      .insert(transformers.division.toAPI(division))
      .select()
      .single();
    if (error) throw error;
    return transformers.division.fromAPI(data);
  }

  async getDivision(id: string): Promise<Division> {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformers.division.fromAPI(data);
  }

  async listDivisions(tournamentId: string): Promise<Division[]> {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return data.map(transformers.division.fromAPI);
  }

  // Court Services
  async createCourt(court: Omit<Court, 'id' | 'createdAt' | 'updatedAt'>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .insert(transformers.court.toAPI(court))
      .select()
      .single();
    if (error) throw error;
    return transformers.court.fromAPI(data);
  }

  async updateCourtStatus(id: string, status: string): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.court.fromAPI(data);
  }

  async listCourts(tournamentId: string): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('tournament_id', tournamentId);
    if (error) throw error;
    return data.map(transformers.court.fromAPI);
  }

  async updateCourt(id: string, courtData: Partial<Omit<Court, 'id' | 'tournamentId' | 'createdAt' | 'updatedAt'>>): Promise<Court> {
    const updatePayload: Partial<Court> = {};
    if (courtData.name !== undefined) updatePayload.name = courtData.name;
    if (courtData.description !== undefined) updatePayload.description = courtData.description;
    if (courtData.status !== undefined) updatePayload.status = courtData.status;
    
    if (Object.keys(updatePayload).length === 0) {
      const { data, error } = await supabase.from('courts').select('*').eq('id', id).single();
      if (error) throw error;
      return transformers.court.fromAPI(data);
    }

    const { data, error } = await supabase
      .from('courts')
      .update(transformers.court.toAPI(updatePayload))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.court.fromAPI(data);
  }

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

  // Registration Services
  async createRegistration(registration: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Registration> {
    const apiRegistration = {
      ...registration,
      tournamentId: registration.tournamentId,
      playerId: registration.playerId,
      partnerId: registration.partnerId
    };
    const { data, error } = await supabase
      .from('registrations')
      .insert(transformers.registration.toAPI(apiRegistration))
      .select()
      .single();
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  async getRegistration(id: string): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  async listRegistrations(filters: { 
    tournamentId?: string; 
    divisionId?: string; 
    playerId?: string; 
    partnerId?: string;
    status?: string;
  }): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('tournament_id', filters.tournamentId)
      .eq('division_id', filters.divisionId)
      .eq('player_id', filters.playerId)
      .eq('partner_id', filters.partnerId)
      .eq('status', filters.status);

    if (error) {
      console.error("Error fetching registrations:", error);
      throw error;
    }

    return data.map(transformers.registration.fromAPI);
  }

  async updateRegistration(id: string, registration: Partial<Registration>): Promise<Registration> {
    const apiRegistration = {
      ...registration,
      tournamentId: registration.tournamentId,
      playerId: registration.playerId
    };
    const { data, error } = await supabase
      .from('registrations')
      .update(transformers.registration.toAPI(apiRegistration))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  async addComment(id: string, comment: { text: string; createdBy: string }): Promise<Registration> {
    const { data: registration, error: getError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;

    const currentMetadata = fromJson<RegistrationMetadata>(registration.metadata || {});
    const metadata = toJson({
      ...currentMetadata,
      comments: [
        ...(currentMetadata.comments || []),
        {
          id: crypto.randomUUID(),
          text: comment.text,
          createdAt: new Date().toISOString(),
          createdBy: comment.createdBy,
        },
      ],
    });

    const { data, error } = await supabase
      .from('registrations')
      .update({ metadata })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  async updatePriority(id: string, priority: number): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update({ priority })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  async updateNotes(id: string, notes: string): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update({ notes })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  // --- New Waitlist Management Functions ---
  async updateWaitlistPosition(id: string, newPosition: number): Promise<Registration> {
    const { data: currentRegistration, error: getError } = await supabase
      .from('registrations')
      .select('metadata')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    const currentMetadata = fromJson<RegistrationMetadata>(currentRegistration?.metadata || {});
    const oldPosition = currentMetadata.waitlistPosition;

    const updatedMetadata = toJson({
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
    });

    const { data, error } = await supabase
      .from('registrations')
      .update({ metadata: updatedMetadata })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.registration.fromAPI(data);
  }

  async promoteFromWaitlist(id: string, newStatus: RegistrationStatus = RegistrationStatus.PENDING): Promise<Registration> {
    const { data: currentRegistration, error: getError } = await supabase
      .from('registrations')
      .select('metadata, tournament_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    const currentMetadata = fromJson<RegistrationMetadata>(currentRegistration?.metadata || {});
    const oldPosition = currentMetadata.waitlistPosition;

    // Update the promoted registration: change status, remove waitlist position
    const updatedMetadata = { ...currentMetadata };
    delete updatedMetadata.waitlistPosition; // Remove position

    const { data: promotedReg, error: promoteError } = await supabase
      .from('registrations')
      .update({ 
        status: newStatus as string, 
        metadata: toJson(updatedMetadata),
        priority: 0 // Reset priority? Or keep?
      })
      .eq('id', id)
      .select()
      .single();
      
    if (promoteError) throw promoteError;

    if (oldPosition && currentRegistration.tournament_id) {
      console.warn(`TODO: Implement shifting of waitlist positions after promoting ID: ${id} from position ${oldPosition}`);
    }

    return transformers.registration.fromAPI(promotedReg);
  }
  // --- End Waitlist Management Functions ---

  // Match Services
  async createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert(transformers.match.toAPI(match))
      .select()
      .single();
    if (error) throw error;
    return transformers.match.fromAPI(data);
  }

  async updateMatch(id: string, match: Partial<Match>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update(transformers.match.toAPI(match))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.match.fromAPI(data);
  }

  async getMatch(id: string): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformers.match.fromAPI(data);
  }

  async listMatches(filters: { tournamentId?: string; divisionId?: string; courtId?: string; status?: string }): Promise<Match[]> {
    let query = supabase.from('matches').select('*');
    if (filters.tournamentId) query = query.eq('tournament_id', filters.tournamentId);
    if (filters.divisionId) query = query.eq('division_id', filters.divisionId);
    if (filters.courtId) query = query.eq('court_id', filters.courtId);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(transformers.match.fromAPI);
  }

  // Notification Services
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(transformers.notification.toAPI(notification))
      .select()
      .single();
    if (error) throw error;
    return transformers.notification.fromAPI(data);
  }

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformers.notification.fromAPI(data);
  }

  async listNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (unreadOnly) query = query.eq('read', false);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(transformers.notification.fromAPI);
  }

  // Email Service
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

  // Message Service (NEW)
  async listMessages(tournamentId: string, limit = 50): Promise<TournamentMessage[]> {
    const { data, error } = await supabase
      .from('tournament_messages')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error listing messages:", error);
      throw error;
    }
    
    return (data as unknown as TournamentMessage[]).reverse();
  }

  async sendMessage(tournamentId: string, senderId: string, content: string): Promise<TournamentMessage> {
    if (!content.trim()) {
      throw new Error("Message content cannot be empty.");
    }
    if (content.length > 500) {
      throw new Error("Message content exceeds maximum length (500 characters).");
    }

    const { data, error } = await supabase
      .from('tournament_messages')
      .insert({
        tournament_id: tournamentId,
        sender_id: senderId,
        content
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }

    return data as unknown as TournamentMessage;
  }
}

// Create service instances from APIService
export const registrationService = new APIService();
export const profileService = new APIService();
export const notificationService = new APIService();
export const emailService = new APIService();

export const api = new APIService();

export const courtService = {
  create: (court: Omit<Court, 'id' | 'createdAt' | 'updatedAt'>) => api.createCourt(court),
  updateStatus: (id: string, status: string) => api.updateCourtStatus(id, status),
  list: (tournamentId: string) => api.listCourts(tournamentId),
  update: (id: string, courtData: Partial<Omit<Court, 'id' | 'tournamentId' | 'createdAt' | 'updatedAt'>>) => api.updateCourt(id, courtData),
  delete: (id: string) => api.deleteCourt(id)
};

export const matchService = {
  create: (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => api.createMatch(match),
  update: (id: string, match: Partial<Match>) => api.updateMatch(id, match),
  get: (id: string) => api.getMatch(id),
  list: (filters: { tournamentId?: string; divisionId?: string; courtId?: string; status?: string }) => api.listMatches(filters)
};

// Export an instance of APIService as tournamentService
export const tournamentService = new APIService(); 