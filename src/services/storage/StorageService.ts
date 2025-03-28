
// Abstract storage interface that can be implemented for different backends
export interface StorageService {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// LocalStorage implementation (current)
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

// Mock real-time service implementation (will be replaced with actual implementation)
export class RealTimeStorageService implements StorageService {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private mockData: Map<string, any> = new Map();

  async getItem<T>(key: string): Promise<T | null> {
    return this.mockData.get(key) || null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.mockData.set(key, value);
    // Notify listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key)?.forEach(listener => listener(value));
    }
  }

  async removeItem(key: string): Promise<void> {
    this.mockData.delete(key);
  }

  // Subscribe to changes
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }
}

// Service factory - returns the appropriate service based on config
export const createStorageService = (): StorageService => {
  // Could check for environment variables or config to determine which service to use
  return new LocalStorageService();
};

// Create a singleton instance
export const storageService = createStorageService();
