
import { useScoringStore } from "@/stores/scoringStore";
import { useTournamentStore } from "@/stores/tournamentStore";
import { useTournament } from "@/contexts/TournamentContext";

// Flag to control which implementation we use
const USE_ZUSTAND = process.env.USE_ZUSTAND === 'true';

/**
 * This adapter provides a compatibility layer during migration from
 * the Context-based scoring logic to the Zustand-based store.
 * It maintains the same API so components don't need to change.
 */
export const useScoringLogic = () => {
  // Get both implementations
  const tournamentContext = useTournament();
  const scoringStore = useScoringStore();
  const tournamentStore = useTournamentStore();
  
  // Import original implementation
  // This would need to be adapted to match your project structure
  const { default: useOriginalScoringLogic } = require('@/components/scoring/useScoringLogic');
  const originalImplementation = useOriginalScoringLogic();
  
  // If we're using Zustand, return the store implementation with tournamentStore data
  if (USE_ZUSTAND) {
    return {
      ...scoringStore,
      currentTournament: tournamentStore.currentTournament,
    };
  }
  
  // Use the original implementation
  return originalImplementation;
};

export default useScoringLogic;
