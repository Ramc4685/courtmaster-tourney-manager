
// This file is now just a re-export for backward compatibility
// This ensures existing imports continue to work while we transition to the new structure

export { useScoringStore } from './scoring';
export type { ScoringState } from './scoring/types';

// Export the standalone match store as well
export { useStandaloneMatchStore } from './standaloneMatchStore';
