
import { Court, Tournament } from '@/types/tournament';
import { StateCreator } from 'zustand';
import { ScoringState } from './types';

// Create the scoring actions
export const actions = (set: Function, get: Function) => {
  return {
    // Update score for current match
    updateScore: (team: "team1" | "team2", setIndex: number, value: number) => {
      const { selectedMatch } = get();
      if (!selectedMatch) return;

      // Create new scores array
      const newScores = [...(selectedMatch.scores || [])];
      
      // Ensure we have enough scores in the array
      while (newScores.length <= setIndex) {
        newScores.push({ team1Score: 0, team2Score: 0 });
      }
      
      // Update the specific score
      newScores[setIndex] = {
        ...newScores[setIndex],
        [`${team}Score`]: value
      };
      
      // Update the selected match
      set({
        selectedMatch: {
          ...selectedMatch,
          scores: newScores
        }
      });
    },
    
    // Increment score for a team
    incrementScore: (team: "team1" | "team2", setIndex: number) => {
      const { selectedMatch } = get();
      if (!selectedMatch) return;
      
      const currentScore = (selectedMatch.scores && selectedMatch.scores[setIndex]) 
        ? selectedMatch.scores[setIndex][`${team}Score`] 
        : 0;
        
      get().updateScore(team, setIndex, currentScore + 1);
    },
    
    // Decrement score for a team
    decrementScore: (team: "team1" | "team2", setIndex: number) => {
      const { selectedMatch } = get();
      if (!selectedMatch) return;
      
      const currentScore = (selectedMatch.scores && selectedMatch.scores[setIndex]) 
        ? selectedMatch.scores[setIndex][`${team}Score`] 
        : 0;
        
      get().updateScore(team, setIndex, Math.max(0, currentScore - 1));
    },
    
    // Add a new set to the match
    addNewSet: () => {
      const { selectedMatch, currentSet } = get();
      if (!selectedMatch) return;
      
      // Create new scores array with an additional set
      const newScores = [...(selectedMatch.scores || [])];
      newScores.push({ team1Score: 0, team2Score: 0 });
      
      // Update the selected match
      set({
        selectedMatch: {
          ...selectedMatch,
          scores: newScores
        },
        currentSet: currentSet + 1
      });
    },
    
    // Complete a match
    completeMatch: () => {
      const { selectedMatch } = get();
      if (!selectedMatch) return;
      
      set({
        selectedMatch: {
          ...selectedMatch,
          status: "COMPLETED"
        }
      });
    },
    
    // Select a court for scoring
    selectCourt: (court: Court) => {
      set({ selectedCourt: court });
      
      // If court has a current match, select it
      if (court.currentMatch) {
        set({ selectedMatch: court.currentMatch });
      }
    }
  };
};
