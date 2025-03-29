
/**
 * Cache utility for optimizing data fetching and state management
 */

type CacheOptions = {
  maxAge?: number; // Maximum age in milliseconds
  staleWhileRevalidate?: boolean; // Whether to return stale data while fetching fresh data
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  isStale: boolean;
};

// LRU (Least Recently Used) Cache implementation
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    // Check if the key exists
    if (!this.cache.has(key)) return undefined;
    
    // Get the value
    const value = this.cache.get(key);
    
    // Update the entry by deleting and re-adding to put it at the end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value as V);
    
    return value;
  }
  
  set(key: K, value: V): void {
    // If the key already exists, delete it first
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Check if we need to evict the least recently used item
    if (this.cache.size >= this.maxSize) {
      // Get the first key (least recently used)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Add the new item
    this.cache.set(key, value);
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Time-based cache for API responses
export class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultOptions: CacheOptions = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true
  };
  
  constructor(options?: Partial<CacheOptions>) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check if the data is still fresh
    if (age < (this.defaultOptions.maxAge || 0)) {
      return entry.data as T;
    }
    
    // Data is stale
    if (this.defaultOptions.staleWhileRevalidate) {
      // Mark as stale but return it anyway
      entry.isStale = true;
      return entry.data as T;
    }
    
    // Data is stale and we don't want to use stale data
    this.cache.delete(key);
    return null;
  }
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });
  }
  
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    
    return entry.isStale;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Create a singleton instance of APICache for global use
export const globalAPICache = new APICache();
