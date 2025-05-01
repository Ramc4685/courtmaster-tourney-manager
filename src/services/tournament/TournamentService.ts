import { supabase } from '@/lib/supabase';
import { Tournament } from '../../types/tournament';
import { camelizeKeys, snakeizeKeys } from '@/utils/caseTransforms';
import { ScoringSettings } from '../../types/scoring';

export class TournamentService {
  async createTournament(tournament: any): Promise<any> {
    try {
      // Convert to backend format
      const payload = snakeizeKeys(tournament);

      // Remove ID field if it's empty or null (shouldn't be set on create)
      if (!payload.id) { // Check if id is falsy (null, undefined, '')
        delete payload.id;
      }

      // Log the payload and auth user ID for debugging RLS
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Attempting to insert tournament. Payload:', payload);
      console.log('Current auth user ID:', user?.id);
      console.log("Payload organizer_id:", payload.organizer_id);

      // Log the final payload right before insertion
      console.log("Final payload being sent to Supabase:", JSON.stringify(payload, null, 2));

      const { data, error } = await supabase
        .from('tournaments')
        .insert(payload) // Ensure payload includes organizer_id correctly
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error (full details):", JSON.stringify(error, null, 2)); // Log full error object
        throw error; // Re-throw the error so the UI can catch it
      }

      // Convert response back to frontend format
      return camelizeKeys(data);
    } catch (error) {
      console.error('Error creating tournament in service:', error);
      throw error; // Re-throw the error
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

      if (error) {
        // Log the specific error when fetching tournaments (likely RLS)
        console.error('Supabase select error (getTournaments):', error);
        // Return empty array to prevent refresh loop, but log the error
        return []; 
      }

      return data.map(tournament => camelizeKeys(tournament));
    } catch (error) {
      console.error('Error getting tournaments in service:', error);
      // Return empty array in case of other errors to prevent loop
      return []; 
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

  // Removed private methods as they were not used and potentially outdated
}

// Export a singleton instance
export const tournamentService = new TournamentService();

