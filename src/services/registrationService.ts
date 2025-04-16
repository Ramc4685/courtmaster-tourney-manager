
import { supabase } from '@/lib/supabase';
import { Registration, RegistrationStatus } from '@/types/entities';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';

export class RegistrationService {
  async getRegistration(id: string): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return this.formatRegistrationData(data);
  }
  
  async listRegistrations(tournamentId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('tournament_id', tournamentId);
      
    if (error) throw error;
    
    return data.map(reg => this.formatRegistrationData(reg));
  }
  
  async listPlayerRegistrations(tournamentId: string): Promise<PlayerRegistrationWithStatus[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        metadata,
        status,
        division_id as divisionId,
        created_at as createdAt
      `)
      .eq('tournament_id', tournamentId)
      .is('team_id', null);
      
    if (error) throw error;
    
    return data.map(reg => ({
      id: reg.id,
      firstName: reg.metadata?.firstName || '',
      lastName: reg.metadata?.lastName || '',
      email: reg.metadata?.email || '',
      phone: reg.metadata?.phone || '',
      status: reg.status as RegistrationStatus,
      divisionId: reg.divisionId,
      createdAt: new Date(reg.createdAt),
      metadata: reg.metadata || {}
    }));
  }
  
  async listTeamRegistrations(tournamentId: string): Promise<TeamRegistrationWithStatus[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        metadata,
        status,
        division_id as divisionId,
        created_at as createdAt
      `)
      .eq('tournament_id', tournamentId)
      .not('team_id', 'is', null);
      
    if (error) throw error;
    
    return data.map(reg => ({
      id: reg.id,
      teamName: reg.metadata?.teamName || '',
      captainName: reg.metadata?.captainName || '',
      playerCount: reg.metadata?.players?.length || 0,
      status: reg.status as RegistrationStatus,
      divisionId: reg.divisionId,
      createdAt: new Date(reg.createdAt),
      metadata: reg.metadata || {}
    }));
  }
  
  async updateRegistrationStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return this.formatRegistrationData(data);
  }
  
  async promoteFromWaitlist(id: string, newStatus: RegistrationStatus): Promise<Registration> {
    return this.updateRegistrationStatus(id, newStatus);
  }
  
  async updateWaitlistPosition(id: string, newPosition: number): Promise<Registration> {
    const { data, error } = await supabase
      .from('registrations')
      .update({ 
        priority: newPosition,
        metadata: supabase.rpc('jsonb_set_recursive', {
          target: supabase.raw('metadata'),
          path: '{waitlistPosition}',
          value: newPosition.toString()
        })
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return this.formatRegistrationData(data);
  }
  
  async bulkUpdateStatus(ids: string[], status: RegistrationStatus): Promise<void> {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .in('id', ids);
      
    if (error) throw error;
  }
  
  // Helper method to format registration data consistently
  private formatRegistrationData(data: any): Registration {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      tournament_id: data.tournament_id,
      divisionId: data.division_id,
      division_id: data.division_id,
      playerId: data.player_id,
      player_id: data.player_id,
      partnerId: data.partner_id,
      partner_id: data.partner_id,
      status: data.status as RegistrationStatus,
      metadata: data.metadata || {},
      notes: data.notes,
      priority: data.priority,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
