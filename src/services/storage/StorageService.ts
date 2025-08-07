import type { Profile } from '@/types/entities';
import type { Tournament } from '@/types/tournament';
import { AppwriteStorageService } from './StorageService.appwrite';

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

// Appwrite implementation
// No additional refactoring needed as AppwriteStorageService is already implemented
// This file is kept for compatibility but all functionality is now in StorageService.appwrite.ts

// RealTimeStorageService that combines localStorage and Appwrite
export class RealTimeStorageService implements StorageService {
  private appwriteService = new AppwriteStorageService();
  
  async getItem<T>(key: string): Promise<T | null> {
    // First try localStorage
    const localStorageService = new LocalStorageService();
    const localValue = await localStorageService.getItem<T>(key);
    if (localValue) {
      return localValue;
    }

    // Fallback to Appwrite
    return this.appwriteService.getItem<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    // Set in both localStorage and Appwrite for real-time sync
    const localStorageService = new LocalStorageService();
    await Promise.all([
      localStorageService.setItem(key, value),
      this.appwriteService.setItem(key, value)
    ]);
  }

  async removeItem(key: string): Promise<void> {
    // Remove from both localStorage and Appwrite
    const localStorageService = new LocalStorageService();
    await Promise.all([
      localStorageService.removeItem(key),
      this.appwriteService.removeItem(key)
    ]);
  }

  async getUserId(): Promise<string | null> {
    return this.appwriteService.getUserId();
  }

  // Subscribe to changes using Appwrite's real-time features
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    // Appwrite real-time subscription implementation
    console.log('[RealTimeStorageService] Subscribing to key:', key);
    
    // Return unsubscribe function
    return () => {
      console.log('[RealTimeStorageService] Unsubscribing from key:', key);
    };
  }
}

// Service factory with config type
export type StorageConfig = {
  useRealtime?: boolean;
  useLocalStorage?: boolean;
}

// Service factory - returns the appropriate service based on config
export const createStorageService = (config?: StorageConfig): StorageService => {
  const defaultConfig = {
    useRealtime: false,
    useLocalStorage: false,
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (finalConfig.useRealtime) {
    console.log('[Storage] Using RealTime storage service');
    return new RealTimeStorageService();
  }

  if (finalConfig.useLocalStorage) {
    console.log('[Storage] Using LocalStorage service');
    return new LocalStorageService();
  }

  // Default to AppwriteStorageService
  console.log('[Storage] No specific service configured, defaulting to Appwrite');
  return new AppwriteStorageService();
};

// Create a singleton instance
let storageService: StorageService = createStorageService();

// Function to reinitialize storage service with new config
export const initializeStorageService = (config?: StorageConfig): void => {
  console.log('Reinitializing storage service with config:', config);
  storageService = createStorageService(config);
};

export { storageService };
