
import { supabase } from '@/lib/supabase';
import { Court, CourtStatus } from '@/types/entities';
import { camelizeKeys, snakeizeKeys } from '@/utils/caseTransforms';

export const courtService = {
  async createCourt(court: Omit<Court, "id" | "createdAt" | "updatedAt">): Promise<Court> {
    // Convert camelCase to snake_case for database
    const payload = {
      tournament_id: court.tournamentId,
      name: court.name,
      description: court.description || '',
      status: court.status || CourtStatus.AVAILABLE,
      court_number: court.number
    };
      
    const { data, error } = await supabase
      .from('courts')
      .insert(payload)
      .select()
      .single();
      
    if (error) throw error;
    
    // Transform database response to camelCase for frontend use
    return {
      id: data.id,
      name: data.name,
      number: data.court_number,
      court_number: data.court_number, // For backward compatibility
      status: data.status as CourtStatus,
      description: data.description,
      tournamentId: data.tournament_id,
      tournament_id: data.tournament_id, // For backward compatibility
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
      court_number: court.court_number, // For backward compatibility
      status: court.status as CourtStatus,
      description: court.description,
      tournamentId: court.tournament_id,
      tournament_id: court.tournament_id, // For backward compatibility
      createdAt: new Date(court.created_at),
      updatedAt: new Date(court.updated_at)
    }));
  },
  
  async updateCourt(id: string, courtData: Partial<Omit<Court, "id" | "createdAt" | "updatedAt">>): Promise<Court> {
    const payload: any = {};
    if (courtData.name !== undefined) payload.name = courtData.name;
    if (courtData.description !== undefined) payload.description = courtData.description;
    if (courtData.status !== undefined) payload.status = courtData.status;
    if (courtData.number !== undefined) payload.court_number = courtData.number;
    if (courtData.tournamentId !== undefined) payload.tournament_id = courtData.tournamentId;
    
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
      court_number: data.court_number, // For backward compatibility
      status: data.status as CourtStatus,
      description: data.description,
      tournamentId: data.tournament_id,
      tournament_id: data.tournament_id, // For backward compatibility
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
