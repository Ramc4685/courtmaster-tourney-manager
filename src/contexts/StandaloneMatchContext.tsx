
import React, { createContext, useContext, ReactNode } from 'react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { StandaloneMatch } from '@/types/tournament';

interface StandaloneMatchContextType {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  loadMatches: () => Promise<void>;
  loadMatchById: (id: string) => Promise<StandaloneMatch | null>;
  createMatch: (match: Partial<StandaloneMatch>) => StandaloneMatch;
  updateMatch: (match: StandaloneMatch) => Promise<StandaloneMatch>;
  deleteMatch: (id: string) => Promise<void>;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
}

const StandaloneMatchContext = createContext<StandaloneMatchContextType | undefined>(undefined);

export const StandaloneMatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const standaloneStore = useStandaloneMatchStore();
  
  // Create a wrapper with the missing properties to satisfy TypeScript
  const contextValue: StandaloneMatchContextType = {
    matches: standaloneStore.matches,
    currentMatch: standaloneStore.currentMatch,
    isLoading: false, // Default value
    error: null,      // Default value
    
    loadMatches: async () => {
      // Implementation would load matches from store or API
      return Promise.resolve();
    },
    
    loadMatchById: async (id: string) => {
      // Wrap the synchronous store function in a promise to match the type
      const match = standaloneStore.loadMatchById(id);
      return Promise.resolve(match);
    },
    
    createMatch: (match: Partial<StandaloneMatch>) => {
      const newMatch = standaloneStore.createMatch(match);
      if (!newMatch) {
        throw new Error("Failed to create match");
      }
      return newMatch;
    },
    
    updateMatch: async (match: StandaloneMatch) => {
      // Wrap the synchronous store function in a promise to match the type
      standaloneStore.updateMatch(match);
      return Promise.resolve(match);
    },
    
    deleteMatch: async (id: string) => {
      // This functionality isn't yet implemented in the store
      // We'll just resolve the promise for now
      return Promise.resolve();
    },
    
    setCurrentMatch: (match: StandaloneMatch | null) => {
      standaloneStore.setCurrentMatch(match);
    }
  };
  
  return (
    <StandaloneMatchContext.Provider value={contextValue}>
      {children}
    </StandaloneMatchContext.Provider>
  );
};

export const useStandaloneMatch = (): StandaloneMatchContextType => {
  const context = useContext(StandaloneMatchContext);
  
  if (context === undefined) {
    throw new Error('useStandaloneMatch must be used within a StandaloneMatchProvider');
  }
  
  return context;
};
