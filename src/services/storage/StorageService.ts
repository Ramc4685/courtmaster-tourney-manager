import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/entities';
import type { Tournament } from '@/types/tournament';

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
      console.log('[LocalStorage] Getting item:', key);
      const item = localStorage.getItem(key);
      const result = item ? JSON.parse(item) : null;
      console.log('[LocalStorage] Got item result:', { key, found: !!result });
      return result;
    } catch (error) {
      console.error(`[LocalStorage] Error getting item: ${key}`, error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      console.log('[LocalStorage] Setting item:', { key, value });
      localStorage.setItem(key, JSON.stringify(value));
      console.log('[LocalStorage] Item set successfully:', key);
    } catch (error) {
      console.error(`[LocalStorage] Error setting item: ${key}`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      console.log('[LocalStorage] Removing item:', key);
      localStorage.removeItem(key);
      console.log('[LocalStorage] Item removed successfully:', key);
    } catch (error) {
      console.error(`[LocalStorage] Error removing item: ${key}`, error);
      throw error;
    }
  }
}

// Supabase implementation

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const configured = !!supabase.auth.getSession;
  console.log('[Supabase] Checking configuration:', { configured });
  return configured;
};

export class SupabaseStorageService implements StorageService {
  private async getUserId(): Promise<string | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.log('[Supabase] Not configured, skipping getUserId');
        return null;
      }
      
      const { data } = await supabase.auth.getSession();
      const userId = data.session ? data.session.user.id : null;
      console.log('[Supabase] Got user ID:', { userId });
      return userId;
    } catch (error) {
      console.error('[Supabase] Error getting user ID:', error);
      return null;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      console.log('[Supabase] Getting item:', key);
      
      // If Supabase is not configured, fall back to localStorage
      if (!isSupabaseConfigured()) {
        console.log('[Supabase] Not configured, falling back to localStorage');
        return new LocalStorageService().getItem<T>(key);
      }
      
      // For tournaments list - get all tournaments the user has access to
      if (key === 'tournaments') {
        const userId = await this.getUserId();
        if (!userId) {
          console.log('[Supabase] No user ID, cannot fetch tournaments');
          return null;
        }
        
        console.log('[Supabase] Fetching user tournaments:', { userId });
        const { data, error } = await supabase
          .from('user_tournaments')
          .select('tournament_id')
          .eq('user_id', userId);
          
        if (error) {
          console.error('[Supabase] Error fetching user tournaments:', error);
          throw error;
        }
        
        if (!data.length) {
          console.log('[Supabase] No tournaments found for user');
          return [] as unknown as T;
        }
        
        const tournamentIds = data.map(item => item.tournament_id);
        console.log('[Supabase] Found tournament IDs:', tournamentIds);
        
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('*')
          .in('id', tournamentIds);
          
        if (tournamentsError) {
          console.error('[Supabase] Error fetching tournaments:', tournamentsError);
          throw tournamentsError;
        }
        
        const tournaments = tournamentsData.map(t => JSON.parse(t.data as string));
        console.log('[Supabase] Successfully fetched tournaments:', { count: tournaments.length });
        return tournaments as T;
      } 
      // For a specific tournament
      else if (key === 'currentTournament' || key.startsWith('tournament_')) {
        const tournamentId = key === 'currentTournament' 
          ? localStorage.getItem('currentTournamentId') 
          : key.replace('tournament_', '');
          
        if (!tournamentId) {
          console.log('[Supabase] No tournament ID found');
          return null;
        }
        
        console.log('[Supabase] Fetching specific tournament:', { tournamentId });
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();
          
        if (error) {
          console.error('[Supabase] Error fetching tournament:', error);
          throw error;
        }
        
        const tournament = data ? JSON.parse(data.data as string) : null;
        console.log('[Supabase] Successfully fetched tournament:', { found: !!tournament });
        return tournament as T;
      }
      
      // Fallback to localStorage for other keys
      console.log('[Supabase] Key not handled, falling back to localStorage:', key);
      return new LocalStorageService().getItem<T>(key);
    } catch (error) {
      console.error(`[Supabase] Error getting item: ${key}`, error);
      // Fallback to localStorage on error
      console.log('[Supabase] Error occurred, falling back to localStorage');
      return new LocalStorageService().getItem<T>(key);
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      console.log('[Supabase] Setting item:', { key, value });
      
      // If Supabase is not configured, fall back to localStorage
      if (!isSupabaseConfigured()) {
        console.log('[Supabase] Not configured, falling back to localStorage');
        return new LocalStorageService().setItem<T>(key, value);
      }
      
      // For tournaments list - not directly supported, we save individual tournaments
      if (key === 'tournaments') {
        const tournaments = value as Tournament[];
        console.log('[Supabase] Saving tournament list:', { count: tournaments.length });
        // We don't save the full list, but ensure each tournament is saved individually
        for (const tournament of tournaments) {
          await this.setItem(`tournament_${tournament.id}`, tournament);
        }
        return;
      }
      
      // For a specific tournament
      else if (key === 'currentTournament') {
        const tournament = value as Tournament;
        console.log('[Supabase] Setting current tournament:', { id: tournament.id });
        localStorage.setItem('currentTournamentId', tournament.id);
        await this.setItem(`tournament_${tournament.id}`, value);
      }
      else if (key.startsWith('tournament_')) {
        const tournamentId = key.replace('tournament_', '');
        const userId = await this.getUserId();
        
        if (!userId) {
          console.error('[Supabase] User not authenticated, cannot save tournament');
          throw new Error('User not authenticated');
        }
        
        console.log('[Supabase] Saving tournament:', { tournamentId, userId });
        
        // Upsert the tournament data
        const { error } = await supabase
          .from('tournaments')
          .upsert({
            id: tournamentId,
            data: JSON.stringify(value),
            updated_at: new Date().toISOString(),
            user_id: userId
          });
          
        if (error) {
          console.error('[Supabase] Error saving tournament:', error);
          throw error;
        }
        
        // Ensure the user has access to this tournament
        console.log('[Supabase] Creating user-tournament relationship');
        const { error: relationError } = await supabase
          .from('user_tournaments')
          .upsert({
            user_id: userId,
            tournament_id: tournamentId,
            role: 'owner',
            created_at: new Date().toISOString()
          });
          
        if (relationError) {
          console.error('[Supabase] Error creating user-tournament relationship:', relationError);
          throw relationError;
        }
        
        console.log('[Supabase] Tournament saved successfully');
      }
      else {
        // Fallback to localStorage for other keys
        console.log('[Supabase] Key not handled, falling back to localStorage:', key);
        return new LocalStorageService().setItem<T>(key, value);
      }
    } catch (error) {
      console.error(`[Supabase] Error setting item: ${key}`, error);
      // Fallback to localStorage on error
      console.log('[Supabase] Error occurred, falling back to localStorage');
      return new LocalStorageService().setItem<T>(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // If Supabase is not configured, fall back to localStorage
      if (!isSupabaseConfigured()) {
        return new LocalStorageService().removeItem(key);
      }
      
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
      // Fallback to localStorage on error
      return new LocalStorageService().removeItem(key);
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
  const defaultConfig = {
    useSupabase: true,
    useRealtime: false,
    useLocalStorage: false,
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (finalConfig.useRealtime) {
    console.log('[Storage] Using RealTime storage service');
    return new RealTimeStorageService();
  }

  if (finalConfig.useSupabase) {
    console.log('[Storage] Using Supabase storage service');
    return new SupabaseStorageService();
  }

  if (finalConfig.useLocalStorage) {
    console.log('[Storage] Using LocalStorage service');
    return new LocalStorageService();
  }

  // Default to Supabase
  console.log('[Storage] No specific service configured, defaulting to Supabase');
  return new SupabaseStorageService();
};

// Create a singleton instance - auto-detects Supabase
let storageService: StorageService = createStorageService();

// Function to reinitialize storage service with new config
export const initializeStorageService = (config?: StorageConfig): void => {
  console.log('Reinitializing storage service with config:', config);
  storageService = createStorageService(config);
};

export { storageService };
