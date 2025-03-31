
import { useScoringStore } from "@/stores/scoring";
import { useTournamentStore } from "@/stores/tournamentStore";
import { useTournament } from "@/contexts/TournamentContext";
import { useStandaloneMatchStore } from "@/stores/standaloneMatchStore";
import { Match, ScorerType, StandaloneMatch } from "@/types/tournament";
import { useEffect, useState } from "react";

// Flag to control which implementation we use
const USE_ZUSTAND = process.env.USE_ZUSTAND === 'true';

interface ScoringAdapterProps {
  scorerType?: ScorerType; // Default to "TOURNAMENT" if not specified
  matchId?: string; // Optional match ID for directly loading a specific match
}

/**
 * This adapter provides a compatibility layer during migration from
 * the Context-based scoring logic to the Zustand-based store.
 * It maintains the same API so components don't need to change.
 */
export const useScoringAdapter = ({ 
  scorerType = "TOURNAMENT", 
  matchId 
}: ScoringAdapterProps = {}) => {
  // Get both implementations
  const tournamentContext = useTournament();
  const scoringStore = useScoringStore();
  const tournamentStore = useTournamentStore();
  const standaloneStore = useStandaloneMatchStore();
  
  // Track what source we're using
  const [currentScorerType, setCurrentScorerType] = useState<ScorerType>(scorerType);
  
  // Set up appropriate stores based on scorer type
  useEffect(() => {
    const initializeScoring = async () => {
      if (scorerType === "STANDALONE") {
        if (matchId) {
          // Load the specified standalone match
          await standaloneStore.loadMatchById(matchId);
          
          // Select the match in the scoring store if it was found
          if (standaloneStore.currentMatch) {
            scoringStore.setSelectedMatch(standaloneStore.currentMatch);
            scoringStore.setActiveView("scoring");
          }
        }
      } else {
        if (matchId) {
          // For tournament, find the match and select it
          const match = tournamentStore.currentTournament?.matches.find(m => m.id === matchId);
          if (match) {
            scoringStore.handleSelectMatch(match);
          }
        }
      }
      setCurrentScorerType(scorerType);
    };
    
    initializeScoring();
  }, [scorerType, matchId]);
  
  // Import original implementation
  // This would need to be adapted to match your project structure
  try {
    const { default: useOriginalScoringLogic } = require('@/components/scoring/useScoringLogic');
    const originalImplementation = useOriginalScoringLogic();
  
    // If we're using Zustand, return the appropriate store implementation
    if (USE_ZUSTAND) {
      if (currentScorerType === "STANDALONE") {
        return {
          ...scoringStore,
          currentMatch: standaloneStore.currentMatch,
          currentTournament: null, // No tournament for standalone matches
          
          // Override methods to use standalone match service
          handleScoreChange: (team: "team1" | "team2", increment: boolean) => {
            scoringStore.handleStandaloneScoreChange(team, increment, standaloneStore);
          },
          handleStartMatch: (match: Match | StandaloneMatch) => {
            if ('tournamentId' in match) {
              // It's a regular match from tournament
              scoringStore.handleStartMatch(match);
            } else {
              // It's a standalone match
              scoringStore.handleStandaloneStartMatch(match.id, standaloneStore);
            }
          },
          handleCompleteMatch: () => {
            // Check what type of match is currently selected
            const match = scoringStore.selectedMatch;
            if (match && !('tournamentId' in match)) {
              // It's a standalone match
              scoringStore.handleStandaloneCompleteMatch(standaloneStore);
            } else {
              // It's a regular tournament match
              scoringStore.handleCompleteMatch();
            }
          },
          handleNewSet: () => {
            // Check what type of match is currently selected
            const match = scoringStore.selectedMatch;
            if (match && !('tournamentId' in match)) {
              // It's a standalone match
              scoringStore.handleStandaloneNewSet(standaloneStore);
            } else {
              // It's a regular tournament match
              scoringStore.handleNewSet();
            }
          }
        };
      }
      
      // Default to tournament implementation
      return {
        ...scoringStore,
        currentTournament: tournamentStore.currentTournament,
      };
    }
    
    // Use the original implementation
    return originalImplementation;
  } catch (e) {
    console.error("Error loading scoring logic:", e);
    // Fallback to basic store
    return scoringStore;
  }
};

export default useScoringAdapter;
