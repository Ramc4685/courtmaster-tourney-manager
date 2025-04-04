
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
  createMatch: (team1: any, team2: any, scheduledTime?: Date) => Promise<StandaloneMatch>;
  updateMatch: (match: StandaloneMatch) => Promise<StandaloneMatch>;
  deleteMatch: (id: string) => Promise<void>;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
}

const StandaloneMatchContext = createContext<StandaloneMatchContextType | undefined>(undefined);

export const StandaloneMatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const standaloneStore = useStandaloneMatchStore();
  
  // Create a wrapper with the missing properties to satisfy TypeScript
  const contextValue: StandaloneMatchContextType = {
    ...standaloneStore,
    isLoading: false, // Default value
    error: null,      // Default value
    loadMatches: async () => {
      // Implementation would load matches from store or API
      return Promise.resolve();
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
