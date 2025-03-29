
// Abstract storage interface that can be implemented for different backends
export interface StorageService {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// LocalStorage implementation
export class LocalStorageService implements StorageService {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
    }
  }
}

// Supabase implementation
import { supabase } from '@/lib/supabase';

export class SupabaseStorageService implements StorageService {
  private async getUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session ? data.session.user.id : null;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      // For tournaments list - get all tournaments the user has access to
      if (key === 'tournaments') {
        const userId = await this.getUserId();
        if (!userId) return null;
        
        const { data, error } = await supabase
          .from('user_tournaments')
          .select('tournament_id')
          .eq('user_id', userId);
          
        if (error) throw error;
        
        if (!data.length) return [] as unknown as T;
        
        const tournamentIds = data.map(item => item.tournament_id);
        
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('*')
          .in('id', tournamentIds);
          
        if (tournamentsError) throw tournamentsError;
        
        return tournamentsData.map(t => JSON.parse(t.data as string)) as T;
      } 
      // For a specific tournament
      else if (key === 'currentTournament' || key.startsWith('tournament_')) {
        const tournamentId = key === 'currentTournament' 
          ? localStorage.getItem('currentTournamentId') 
          : key.replace('tournament_', '');
          
        if (!tournamentId) return null;
        
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();
          
        if (error) throw error;
        
        return data ? JSON.parse(data.data as string) as T : null;
      }
      
      // Fallback to localStorage for other keys
      return new LocalStorageService().getItem<T>(key);
    } catch (error) {
      console.error(`Error getting item from Supabase: ${key}`, error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      // For tournaments list - not directly supported, we save individual tournaments
      if (key === 'tournaments') {
        const tournaments = value as any[];
        // We don't save the full list, but ensure each tournament is saved individually
        for (const tournament of tournaments) {
          await this.setItem(`tournament_${tournament.id}`, tournament);
        }
        return;
      }
      
      // For a specific tournament
      else if (key === 'currentTournament') {
        const tournament = value as any;
        localStorage.setItem('currentTournamentId', tournament.id);
        await this.setItem(`tournament_${tournament.id}`, value);
      }
      else if (key.startsWith('tournament_')) {
        const tournamentId = key.replace('tournament_', '');
        const userId = await this.getUserId();
        
        if (!userId) {
          console.error('User not authenticated, cannot save tournament to Supabase');
          return;
        }
        
        // Upsert the tournament data
        const { error } = await supabase
          .from('tournaments')
          .upsert({
            id: tournamentId,
            data: JSON.stringify(value),
            updated_at: new Date().toISOString(),
            user_id: userId
          });
          
        if (error) throw error;
        
        // Ensure the user has access to this tournament
        const { error: relationError } = await supabase
          .from('user_tournaments')
          .upsert({
            user_id: userId,
            tournament_id: tournamentId,
            role: 'owner',
            created_at: new Date().toISOString()
          });
          
        if (relationError) throw relationError;
      }
      else {
        // Fallback to localStorage for other keys
        return new LocalStorageService().setItem<T>(key, value);
      }
    } catch (error) {
      console.error(`Error setting item in Supabase: ${key}`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (key === 'currentTournament') {
        localStorage.removeItem('currentTournamentId');
      }
      else if (key.startsWith('tournament_')) {
        const tournamentId = key.replace('tournament_', '');
        
        const { error } = await supabase
          .from('tournaments')
          .delete()
          .eq('id', tournamentId);
          
        if (error) throw error;
      }
      else {
        // Fallback to localStorage for other keys
        return new LocalStorageService().removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing item from Supabase: ${key}`, error);
    }
  }
}

// Real-time service implementation (powered by Supabase's real-time features)
export class RealTimeStorageService implements StorageService {
  private supabaseService = new SupabaseStorageService();
  
  async getItem<T>(key: string): Promise<T | null> {
    return this.supabaseService.getItem<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await this.supabaseService.setItem<T>(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.supabaseService.removeItem(key);
  }

  // Subscribe to changes
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (key.startsWith('tournament_')) {
      const tournamentId = key.replace('tournament_', '');
      
      const subscription = supabase
        .channel(`tournament:${tournamentId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        }, async (payload) => {
          // When tournament data changes, fetch the latest and notify
          const tournament = await this.getItem<T>(key);
          if (tournament) {
            callback(tournament);
          }
        })
        .subscribe();
        
      // Return unsubscribe function
      return () => {
        supabase.removeChannel(subscription);
      };
    }
    
    // For other keys (including 'tournaments'), poll for changes
    // This is a simplified approach - in a production app you would setup
    // proper subscriptions for all relevant tables
    const intervalId = setInterval(async () => {
      const data = await this.getItem<T>(key);
      callback(data as T);
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(intervalId);
  }
}

// Service factory with config type
export type StorageConfig = {
  useSupabase?: boolean;
  useRealtime?: boolean;
  useLocalStorage?: boolean;
}

// Service factory - returns the appropriate service based on config
export const createStorageService = (config?: StorageConfig): StorageService => {
  // Default to Supabase when integrated
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    if (config?.useRealtime) {
      console.log('Using RealTime Supabase storage service');
      return new RealTimeStorageService();
    }
    if (config?.useSupabase !== false) {
      console.log('Using Supabase storage service');
      return new SupabaseStorageService();
    }
  }
  
  if (config?.useLocalStorage !== false) {
    console.log('Using LocalStorage storage service');
    return new LocalStorageService();
  }
  
  console.log('Defaulting to LocalStorage storage service');
  return new LocalStorageService();
};

// Create a singleton instance - auto-detects Supabase
export const storageService = createStorageService();
