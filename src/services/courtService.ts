
import { supabase } from '@/lib/supabase';
import { Court } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';
import { courtFromBackend, courtToBackend } from '@/utils/adapters/courtAdapter';

export const courtService = {
  async createCourt(court: Omit<Court, "id">): Promise<Court> {
    const payload = courtToBackend(court);
      
    const { data, error } = await supabase
      .from('courts')
      .insert(payload)
      .select()
      .single();
      
    if (error) throw error;
    
    return courtFromBackend(data);
  },
  
  async listCourts(tournamentId: string): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('tournament_id', tournamentId);
      
    if (error) throw error;
    
    return data.map(courtFromBackend);
  },
  
  async updateCourt(id: string, courtData: Partial<Court>): Promise<Court> {
    const payload = courtToBackend(courtData);
    
    const { data, error } = await supabase
      .from('courts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return courtFromBackend(data);
  },
  
  async deleteCourt(id: string): Promise<void> {
    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};
