// This file is now just a re-export for backward compatibility
// This ensures existing imports continue to work while we transition to the new structure

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Match, MatchScores, ScoreSet } from '@/types/entities';

interface ScoringState {
  activeMatchId: string | null;
  activeMatchData: Match | null;
  // Potentially store score history for undo/redo here
  // scoreHistory: MatchScores[]; 
  isLoading: boolean;
  error: string | null;
  
  setActiveMatch: (match: Match | null) => void;
  updateScore: (newScores: MatchScores) => void;
  // Add other actions: undo, redo, setServer, setEndTime etc.
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useScoringStore = create<ScoringState>()(
  persist(
    (set, get) => ({
      activeMatchId: null,
      activeMatchData: null,
      isLoading: false,
      error: null,

      setActiveMatch: (match) => {
        set({
          activeMatchId: match?.id || null,
          activeMatchData: match,
          isLoading: false,
          error: null,
        });
      },
      
      updateScore: (newScores) => {
        set((state) => {
          if (!state.activeMatchData) return {};
          return {
            activeMatchData: {
              ...state.activeMatchData,
              scores: newScores,
              // Optionally update status here based on score logic
            },
          };
        });
      },

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'courtmaster-scoring-storage', // Unique name for storage
      storage: createJSONStorage(() => localStorage), // Or sessionStorage, or IndexedDB adapter
      partialize: (state) => ({
        // Only persist active match ID and potentially its data
        activeMatchId: state.activeMatchId,
        activeMatchData: state.activeMatchData, 
        // Avoid persisting loading/error states
      }),
    }
  )
);

export type { ScoringState } from './scoring/types';

// Export the standalone match store as well
export { useStandaloneMatchStore } from './standaloneMatchStore';
