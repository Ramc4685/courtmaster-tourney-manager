
import { create } from 'zustand';
import { Match, MatchScore, ScoringSettings } from '@/types/tournament';
import { getDefaultScoringSettings } from '@/utils/matchUtils';

type MatchScoringState = {
  currentMatch: Match | null;
  currentSet: number;
  scoringSettings: ScoringSettings;
  
  // Actions
  setCurrentMatch: (match: Match | null) => void;
  setCurrentSet: (setIndex: number) => void;
  incrementScore: (team: 'team1' | 'team2') => void;
  decrementScore: (team: 'team1' | 'team2') => void;
  updateScore: (team: 'team1' | 'team2', value: number) => void;
  addNewSet: () => void;
  completeMatch: () => void;
  resetScoring: () => void;
};

export const useMatchScoringStore = create<MatchScoringState>((set, get) => ({
  currentMatch: null,
  currentSet: 0,
  scoringSettings: getDefaultScoringSettings(),
  
  setCurrentMatch: (match) => set({ currentMatch: match }),
  
  setCurrentSet: (setIndex) => set({ currentSet: setIndex }),
  
  incrementScore: (team) => {
    const { currentMatch, currentSet } = get();
    if (!currentMatch) return;
    
    const scores = [...(currentMatch.scores || [])];
    
    // Ensure we have enough scores
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Get current score for the team
    const currentScore = scores[currentSet][`${team}Score`] || 0;
    
    // Update score
    scores[currentSet] = {
      ...scores[currentSet],
      [`${team}Score`]: currentScore + 1
    };
    
    set({
      currentMatch: {
        ...currentMatch,
        scores
      }
    });
  },
  
  decrementScore: (team) => {
    const { currentMatch, currentSet } = get();
    if (!currentMatch) return;
    
    const scores = [...(currentMatch.scores || [])];
    
    // Ensure we have enough scores
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Get current score for the team and ensure it doesn't go below 0
    const currentScore = scores[currentSet][`${team}Score`] || 0;
    const newScore = Math.max(0, currentScore - 1);
    
    // Update score
    scores[currentSet] = {
      ...scores[currentSet],
      [`${team}Score`]: newScore
    };
    
    set({
      currentMatch: {
        ...currentMatch,
        scores
      }
    });
  },
  
  updateScore: (team, value) => {
    const { currentMatch, currentSet } = get();
    if (!currentMatch) return;
    
    const scores = [...(currentMatch.scores || [])];
    
    // Ensure we have enough scores
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Update score
    scores[currentSet] = {
      ...scores[currentSet],
      [`${team}Score`]: Math.max(0, value)
    };
    
    set({
      currentMatch: {
        ...currentMatch,
        scores
      }
    });
  },
  
  addNewSet: () => {
    const { currentMatch, currentSet } = get();
    if (!currentMatch) return;
    
    const scores = [...(currentMatch.scores || [])];
    scores.push({ team1Score: 0, team2Score: 0 });
    
    set({
      currentMatch: {
        ...currentMatch,
        scores
      },
      currentSet: currentSet + 1
    });
  },
  
  completeMatch: () => {
    const { currentMatch } = get();
    if (!currentMatch) return;
    
    set({
      currentMatch: {
        ...currentMatch,
        status: 'COMPLETED',
        endTime: new Date()
      }
    });
  },
  
  resetScoring: () => set({
    currentMatch: null,
    currentSet: 0
  })
}));
