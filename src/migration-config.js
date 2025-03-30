
/**
 * Migration Configuration
 * 
 * This file contains settings and utilities for the Context API to Zustand migration.
 * It's used primarily for debugging and development purposes.
 */

// To override this via .env files, use: USE_ZUSTAND=true/false
export const USE_ZUSTAND = process.env.USE_ZUSTAND === 'true';

// Display which implementation is active in the console
console.log(`[STATE MANAGEMENT] Using ${USE_ZUSTAND ? 'Zustand' : 'Context API'} for state management`);

// Utility for gradual migration - helps track which components use which implementation
export const logImplementationUsage = (componentName, implementation = USE_ZUSTAND ? 'Zustand' : 'Context') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MIGRATION] ${componentName} using ${implementation}`);
  }
};
