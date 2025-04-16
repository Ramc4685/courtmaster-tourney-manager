
import { supabase } from '@/lib/supabase';
import { Court, CourtStatus } from '@/types/entities';

export const courtService = {
  async createCourt(court: Omit<Court, 'id' | 'createdAt' | 'updatedAt'>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .insert({
        tournament_id: court.tournament_id,
        name: court.name,
        description: court.description || '',
        status: court.status || CourtStatus.AVAILABLE,
        court_number: court.number || court.court_number
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      number: data.court_number,
      status: data.status as CourtStatus,
      description: data.description,
      tournament_id: data.tournament_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },
  
  async listCourts(tournamentId: string): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('tournament_id', tournamentId);
      
    if (error) throw error;
    
    return data.map(court => ({
      id: court.id,
      name: court.name,
      number: court.court_number,
      court_number: court.court_number,
      status: court.status as CourtStatus,
      description: court.description,
      tournament_id: court.tournament_id,
      createdAt: new Date(court.created_at),
      updatedAt: new Date(court.updated_at)
    }));
  },
  
  async updateCourt(id: string, courtData: Partial<Court>): Promise<Court> {
    const payload: any = {};
    if (courtData.name !== undefined) payload.name = courtData.name;
    if (courtData.description !== undefined) payload.description = courtData.description;
    if (courtData.status !== undefined) payload.status = courtData.status;
    if (courtData.number !== undefined) payload.court_number = courtData.number;
    if (courtData.court_number !== undefined) payload.court_number = courtData.court_number;
    
    const { data, error } = await supabase
      .from('courts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      number: data.court_number,
      court_number: data.court_number,
      status: data.status as CourtStatus,
      description: data.description,
      tournament_id: data.tournament_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },
  
  async deleteCourt(id: string): Promise<void> {
    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};
