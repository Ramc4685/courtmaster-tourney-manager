
import { supabase } from '@/integrations/supabase/client';
import { APIService } from './apiService';
import { Profile, Registration, RegistrationStatus } from '@/types/entities';
import { TournamentRegistration } from '@/types/registration';

export class RegistrationService extends APIService {
  async createRegistration(registration: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Registration> {
    try {
      console.log('[RegistrationService] Creating registration:', registration);
      
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          tournament_id: registration.tournamentId,
          division_id: registration.divisionId,
          player_id: registration.playerId,
          partner_id: registration.partnerId,
          status: registration.status,
          metadata: registration.metadata,
          notes: registration.notes,
          priority: registration.priority || 0
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Map the response to our entity model
      return this.mapRegistrationFromDB(data);
    } catch (error) {
      console.error('[RegistrationService] Error creating registration:', error);
      throw error;
    }
  }

  async getRegistrationsByTournament(tournamentId: string): Promise<Registration[]> {
    try {
      console.log('[RegistrationService] Getting registrations for tournament:', tournamentId);
      
      const { data, error } = await supabase
        .from('registrations')
        .select()
        .eq('tournament_id', tournamentId);
        
      if (error) throw error;
      
      // Map the responses to our entity model
      return data.map(this.mapRegistrationFromDB);
    } catch (error) {
      console.error('[RegistrationService] Error getting registrations:', error);
      throw error;
    }
  }

  async updateRegistrationStatus(registrationId: string, status: RegistrationStatus): Promise<Registration> {
    try {
      console.log('[RegistrationService] Updating registration status:', { registrationId, status });
      
      const { data, error } = await supabase
        .from('registrations')
        .update({ status })
        .eq('id', registrationId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Map the response to our entity model
      return this.mapRegistrationFromDB(data);
    } catch (error) {
      console.error('[RegistrationService] Error updating registration status:', error);
      throw error;
    }
  }

  // Helper to map DB response to our entity model
  private mapRegistrationFromDB(data: any): Registration {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      divisionId: data.division_id,
      playerId: data.player_id,
      partnerId: data.partner_id,
      status: data.status as RegistrationStatus,
      metadata: data.metadata,
      notes: data.notes,
      priority: data.priority,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
