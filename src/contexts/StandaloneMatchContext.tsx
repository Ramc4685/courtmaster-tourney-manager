
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
  saveMatch?: () => Promise<boolean>;
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
      return standaloneStore.createMatch(match);
    },
    
    updateMatch: async (match: StandaloneMatch) => {
      // Wrap the synchronous store function in a promise to match the type
      const updatedMatch = standaloneStore.updateMatch(match);
      return Promise.resolve(updatedMatch);
    },
    
    deleteMatch: async (id: string) => {
      // Use the store's deleteMatch function
      standaloneStore.deleteMatch(id);
      return Promise.resolve();
    },
    
    setCurrentMatch: (match: StandaloneMatch | null) => {
      standaloneStore.setCurrentMatch(match);
    },

    // Optional save match function, returning a promise
    saveMatch: async () => {
      // Use store's saveMatch function if it exists
      return standaloneStore.saveMatch();
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
