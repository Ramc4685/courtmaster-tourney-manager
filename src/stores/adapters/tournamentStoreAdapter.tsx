
import React, { ReactNode, useContext } from 'react';
import { TournamentContext } from "@/contexts/tournament/TournamentContext";
import { useTournamentStore } from '../tournamentStore';
import { SchedulingOptions, SchedulingResult } from '@/services/tournament/SchedulingService';
import { Team, Tournament, TournamentCategory, TournamentFormat } from '@/types/tournament';

/**
 * This adapter provides a compatibility layer that allows components to
 * gradually migrate from Context API to Zustand while maintaining the same API.
 * 
 * It checks if we're using Zustand (controlled by the USE_ZUSTAND flag)
 * and returns either the Zustand-based implementation or the Context-based one.
 */

// Flag to control which implementation we use
// This would eventually be set to true once migration is complete
const USE_ZUSTAND = process.env.USE_ZUSTAND === 'true';

export const useTournament = () => {
  // Get the original context - used when USE_ZUSTAND is false
  const tournamentContext = useContext(TournamentContext);
  
  if (!tournamentContext) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  
  // Get the Zustand store - used when USE_ZUSTAND is true
  const tournamentStore = useTournamentStore();
  
  // If we're using Zustand, return the store implementation
  if (USE_ZUSTAND) {
    return {
      ...tournamentStore,
      // Add any methods from context that aren't yet implemented in Zustand
      scheduleMatches: async (
        teamPairs: { team1: Team; team2: Team }[],
        options: SchedulingOptions
      ): Promise<SchedulingResult> => {
        // This would eventually be implemented in the Zustand store
        // For now, delegate to the context implementation
        return tournamentContext.scheduleMatches(teamPairs, options);
      },
      addCategory: tournamentContext.addCategory,
      removeCategory: tournamentContext.removeCategory,
      updateCategory: tournamentContext.updateCategory,
      loadCategoryDemoData: tournamentContext.loadCategoryDemoData,
      // Add other methods that exist in context but not yet in Zustand
    };
  }
  
  // Use the original context implementation
  return tournamentContext;
};

// An optional compatibility provider that can be used during migration
// This syncs data between Context and Zustand store during the transition period
export const TournamentStoreCompatibilityProvider = ({ children }: { children: ReactNode }) => {
  const tournamentContext = useContext(TournamentContext);
  const {
    setCurrentTournament,
    updateTournament
  } = useTournamentStore();
  
  // Sync from context to store when context changes
  React.useEffect(() => {
    if (tournamentContext.currentTournament) {
      setCurrentTournament(tournamentContext.currentTournament);
    }
  }, [tournamentContext.currentTournament]);
  
  return <>{children}</>;
};
