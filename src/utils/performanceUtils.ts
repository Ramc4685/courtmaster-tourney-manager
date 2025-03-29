
/**
 * Performance utility functions for optimizing the application
 */

// Debounce function to limit how often a function can be called
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function to ensure a function is called at most once in a specified period
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoize function results for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

// Deep clone objects without reference
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if two objects are deeply equal
export function isDeepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Batch process array items to avoid UI blocking
export async function batchProcess<T, R>(
  items: T[],
  processFn: (item: T) => R,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  const totalItems = items.length;
  
  for (let i = 0; i < totalItems; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map(processFn);
    results.push(...batch);
    
    // Allow UI thread to breathe between batches
    if (i + batchSize < totalItems) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}
