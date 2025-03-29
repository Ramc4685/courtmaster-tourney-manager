
/**
 * Utility for lazy loading components to optimize initial bundle size
 */
import { lazy } from 'react';

// Function to create a lazy loaded component with improved error handling
export function lazyWithRetry(componentImport: () => Promise<any>) {
  return lazy(async () => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Attempt to import the component
        const component = await componentImport();
        return component;
      } catch (err) {
        // Store the error and retry
        lastError = err as Error;
        console.warn(`Failed to load component, retrying (${i + 1}/${MAX_RETRIES})...`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    // If we get here, all retries failed
    console.error('Failed to load component after multiple retries', lastError);
    throw lastError;
  });
}

// Function to prefetch a component
export function prefetchComponent(componentImport: () => Promise<any>): void {
  componentImport().catch(err => {
    console.warn('Error prefetching component:', err);
  });
}
