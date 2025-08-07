import { databases, realtime, getUser } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Tournament } from '@/types/tournament';
import { COLLECTIONS } from '@/lib/appwrite';

// Base storage service interface
export interface StorageService {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  subscribe?<T>(key: string, callback: (data: T) => void): () => void;
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

// Appwrite storage service implementation
export class AppwriteStorageService implements StorageService {
  // Keep databaseId private but provide a getter
  private databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
  
  // Getter for databaseId
  getDatabaseId(): string {
    return this.databaseId;
  }
  
  async getItem<T>(key: string): Promise<T | null> {
    try {
      console.log('[Appwrite] Getting item:', { key });
      
      // Handle tournaments list
      if (key === 'tournaments') {
        console.log('[Appwrite] Fetching all tournaments');
        const response = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.TOURNAMENTS
        );
        
        return response.documents as unknown as T;
      }
      
      // Handle a specific tournament
      else if (key.startsWith('tournament_')) {
        const tournamentId = key.replace('tournament_', '');
        console.log('[Appwrite] Fetching tournament:', { tournamentId });
        
        const response = await databases.listDocuments(
          this.databaseId,
          COLLECTIONS.TOURNAMENTS,
          [Query.equal('$id', tournamentId)]
        );
        
        const tournament = response.documents[0];
        console.log('[Appwrite] Successfully fetched tournament:', { found: !!tournament });
        return tournament as T;
      }
      
      // Fallback to localStorage for other keys
      console.log('[Appwrite] Key not handled, falling back to localStorage:', key);
      return new LocalStorageService().getItem<T>(key);
    } catch (error) {
      console.error(`[Appwrite] Error getting item: ${key}`, error);
      // Fallback to localStorage on error
      console.log('[Appwrite] Error occurred, falling back to localStorage');
      return new LocalStorageService().getItem<T>(key);
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      console.log('[Appwrite] Setting item:', { key, value });
      
      // For tournaments list - not directly supported, we save individual tournaments
      if (key === 'tournaments') {
        const tournaments = value as Tournament[];
        console.log('[Appwrite] Saving tournament list:', { count: tournaments.length });
        // We don't save the full list, but ensure each tournament is saved individually
        for (const tournament of tournaments) {
          await this.setItem(`tournament_${tournament.id}`, tournament);
        }
        return;
      }
      
      // For a specific tournament
      else if (key === 'currentTournament') {
        const tournament = value as Tournament;
        console.log('[Appwrite] Setting current tournament:', { id: tournament.id });
        localStorage.setItem('currentTournamentId', tournament.id);
        await this.setItem(`tournament_${tournament.id}`, value);
      }
      else if (key.startsWith('tournament_')) {
        const tournamentId = key.replace('tournament_', '');
        
        console.log('[Appwrite] Saving tournament:', { tournamentId });
        
        // Create or update the tournament document
        try {
          // Try to update existing document
          await databases.updateDocument(
            this.databaseId,
            COLLECTIONS.TOURNAMENTS,
            tournamentId,
            {
              data: JSON.stringify(value),
              updated_at: new Date().toISOString()
            }
          );
        } catch (updateError) {
          // If update fails, try to create new document
          await databases.createDocument(
            this.databaseId,
            COLLECTIONS.TOURNAMENTS,
            tournamentId,
            {
              id: tournamentId,
              data: JSON.stringify(value),
              updated_at: new Date().toISOString()
            }
          );
        }
        
        console.log('[Appwrite] Tournament saved successfully');
      }
      else {
        // Fallback to localStorage for other keys
        console.log('[Appwrite] Key not handled, falling back to localStorage:', key);
        return new LocalStorageService().setItem<T>(key, value);
      }
    } catch (error) {
      console.error(`[Appwrite] Error setting item: ${key}`, error);
      // Fallback to localStorage on error
      console.log('[Appwrite] Error occurred, falling back to localStorage');
      return new LocalStorageService().setItem<T>(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (key === 'currentTournament') {
        localStorage.removeItem('currentTournamentId');
      }
      else if (key.startsWith('tournament_')) {
        const tournamentId = key.replace('tournament_', '');
        
        await databases.deleteDocument(
          this.databaseId,
          COLLECTIONS.TOURNAMENTS,
          tournamentId
        );
      }
      else {
        // Fallback to localStorage for other keys
        return new LocalStorageService().removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing item from Appwrite: ${key}`, error);
      // Fallback to localStorage on error
      return new LocalStorageService().removeItem(key);
    }
  }
  
  // Get the current user ID from Appwrite
  async getUserId(): Promise<string | null> {
    try {
      const user = await getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting user ID from Appwrite:', error);
      return null;
    }
  }
}

// Real-time service implementation (powered by Appwrite's real-time features)
export class RealTimeStorageService implements StorageService {
  private appwriteService = new AppwriteStorageService();
  
  async getItem<T>(key: string): Promise<T | null> {
    return this.appwriteService.getItem<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await this.appwriteService.setItem<T>(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.appwriteService.removeItem(key);
  }

  // Subscribe to changes
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (key.startsWith('tournament_')) {
      const tournamentId = key.replace('tournament_', '');
      
      const unsubscribe = realtime.subscribe(
        `databases.${this.appwriteService.getDatabaseId()}.collections.${COLLECTIONS.TOURNAMENTS}.documents.${tournamentId}`,
        async (response) => {
          // When tournament data changes, fetch the latest and notify
          const tournament = await this.getItem<T>(key);
          if (tournament) {
            callback(tournament);
          }
        }
      );
        
      // Return unsubscribe function
      return unsubscribe;
    }
    
    // For other keys (including 'tournaments'), poll for changes
    // This is a simplified approach - in a production app you would setup
    // proper subscriptions for all relevant collections
    const intervalId = setInterval(async () => {
      const data = await this.getItem<T>(key);
      callback(data as T);
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(intervalId);
  }
}

// Service factory with config type
export type StorageConfig = {
  useAppwrite?: boolean;
  useRealtime?: boolean;
  useLocalStorage?: boolean;
}

// Service factory - returns the appropriate service based on config
export const createStorageService = (config?: StorageConfig): StorageService => {
  const defaultConfig = {
    useAppwrite: true,
    useRealtime: false,
    useLocalStorage: false,
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (finalConfig.useRealtime) {
    console.log('[Storage] Using RealTime storage service');
    return new RealTimeStorageService();
  }

  if (finalConfig.useAppwrite) {
    console.log('[Storage] Using Appwrite storage service');
    return new AppwriteStorageService();
  }

  if (finalConfig.useLocalStorage) {
    console.log('[Storage] Using LocalStorage service');
    return new LocalStorageService();
  }

  // Default to Appwrite
  console.log('[Storage] No specific service configured, defaulting to Appwrite');
  return new AppwriteStorageService();
};

// Create a singleton instance - auto-detects Appwrite
let storageService: StorageService = createStorageService();

// Function to reinitialize storage service with new config
export const initializeStorageService = (config?: StorageConfig): void => {
  console.log('Reinitializing storage service with config:', config);
  storageService = createStorageService(config);
};

export { storageService };
