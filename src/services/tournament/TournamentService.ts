
import { supabase } from '@/lib/supabase';
import { Tournament } from '@/types/tournament';
import { camelizeKeys, snakeizeKeys } from '@/utils/caseTransforms';

export class TournamentService {
  async createTournament(tournament: any): Promise<any> {
    try {
      // Convert to backend format
      const payload = snakeizeKeys(tournament);
      
      // Remove ID field if it's empty
      if (payload.id === '') {
        delete payload.id;
      }
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert(payload)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert response back to frontend format
      return camelizeKeys(data);
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }
  
  async getTournament(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      return camelizeKeys(data);
    } catch (error) {
      console.error('Error getting tournament:', error);
      throw error;
    }
  }
  
  async getTournaments(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map(tournament => camelizeKeys(tournament));
    } catch (error) {
      console.error('Error getting tournaments:', error);
      throw error;
    }
  }
  
  async updateTournament(tournament: any): Promise<any> {
    try {
      const payload = snakeizeKeys(tournament);
      
      const { data, error } = await supabase
        .from('tournaments')
        .update(payload)
        .eq('id', tournament.id)
        .select()
        .single();
        
      if (error) throw error;
      
      return camelizeKeys(data);
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }
  
  async deleteTournament(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }
  
  async saveCurrentTournament(tournament: any): Promise<void> {
    // For temporary storage, we could use localStorage or sessionStorage
    try {
      localStorage.setItem('currentTournament', JSON.stringify(tournament));
    } catch (error) {
      console.error('Error saving current tournament:', error);
      throw error;
    }
  }
}
