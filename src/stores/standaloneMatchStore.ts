
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { Match, MatchStatus, StandaloneMatch } from '@/types/tournament';

type StandaloneMatchStore = {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  
  // Methods
  createMatch: (matchData: Partial<StandaloneMatch>) => StandaloneMatch | null;
  loadMatchById: (matchId: string) => StandaloneMatch | null;
  updateMatch: (match: StandaloneMatch) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => boolean;
  updateCourtNumber: (matchId: string, courtNumber: number) => void;
  saveMatch: () => void;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
  deleteMatch?: (matchId: string) => void; // Optional method
};

// Persist matches to localStorage
const loadMatches = (): StandaloneMatch[] => {
  try {
    const storedMatches = localStorage.getItem('standaloneMatches');
    if (!storedMatches) return [];
    
    // Parse matches and convert string dates back to Date objects
    const parsedMatches = JSON.parse(storedMatches);
    return parsedMatches.map((match: any) => ({
      ...match,
      createdAt: match.createdAt ? new Date(match.createdAt) : new Date(),
      updatedAt: match.updatedAt ? new Date(match.updatedAt) : new Date(),
      completedAt: match.completedAt ? new Date(match.completedAt) : undefined,
      scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : undefined,
      endTime: match.endTime ? new Date(match.endTime) : undefined
    }));
  } catch (error) {
    console.error('Error loading standalone matches:', error);
    return [];
  }
};

const saveMatches = (matches: StandaloneMatch[]) => {
  try {
    localStorage.setItem('standaloneMatches', JSON.stringify(matches));
  } catch (error) {
    console.error('Error saving standalone matches:', error);
  }
};

// Create the store
const standaloneMatchStore = createStore<StandaloneMatchStore>((set, get) => ({
  matches: loadMatches(),
  currentMatch: null,
  
  createMatch: (matchData) => {
    const newMatch: StandaloneMatch = {
      id: `standalone-${Date.now()}`,
      matchNumber: `SM-${Math.floor(Math.random() * 1000)}`,
      team1: {
        id: `team1-${Date.now()}`,
        name: matchData.team1?.name || 'Team 1',
        players: matchData.team1?.players || [
          { id: `player1-${Date.now()}`, name: 'Player 1' }
        ]
      },
      team2: {
        id: `team2-${Date.now()}`,
        name: matchData.team2?.name || 'Team 2',
        players: matchData.team2?.players || [
          { id: `player2-${Date.now()}`, name: 'Player 2' }
        ]
      },
      scores: [],
      status: 'SCHEDULED' as MatchStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'default',
        name: 'Default Category',
        type: 'MENS_SINGLES'
      }
    };
    
    set((state): StandaloneMatchStore => {
      const updatedMatches = [...state.matches, newMatch];
      saveMatches(updatedMatches);
      return {
        ...state,
        matches: updatedMatches,
        currentMatch: newMatch
      };
    });
    
    return newMatch;
  },
  
  loadMatchById: (matchId) => {
    const { matches } = get();
    const foundMatch = matches.find(m => m.id === matchId);
    
    if (foundMatch) {
      set({ currentMatch: foundMatch });
    }
    
    return foundMatch || null;
  },
  
  updateMatch: (match) => {
    set((state): StandaloneMatchStore => {
      const updatedMatch = { 
        ...match, 
        updatedAt: new Date() 
      };
      
      const updatedMatches = state.matches.map(m => 
        m.id === match.id ? updatedMatch : m
      );
      
      saveMatches(updatedMatches);
      
      return {
        ...state,
        matches: updatedMatches,
        currentMatch: updatedMatch
      };
    });
  },
  
  updateMatchScore: (matchId, setIndex, team1Score, team2Score, scorerName) => {
    set((state): StandaloneMatchStore => {
      const match = state.matches.find(m => m.id === matchId);
      
      if (!match) return state;
      
      const scores = [...(match.scores || [])];
      
      // Ensure we have enough entries in the scores array
      while (scores.length <= setIndex) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }
      
      // Update the score for the specific set
      scores[setIndex] = { team1Score, team2Score };
      
      const updatedMatch: StandaloneMatch = {
        ...match,
        scores,
        updatedAt: new Date(),
        ...(scorerName ? { scorerName } : {})
      };
      
      const updatedMatches = state.matches.map(m => 
        m.id === matchId ? updatedMatch : m
      );
      
      saveMatches(updatedMatches);
      
      return {
        ...state,
        matches: updatedMatches,
        currentMatch: updatedMatch
      };
    });
  },
  
  completeMatch: (matchId, scorerName) => {
    let success = false;
    
    set((state): StandaloneMatchStore => {
      const match = state.matches.find(m => m.id === matchId);
      
      if (!match) return state;
      
      const updatedMatch: StandaloneMatch = {
        ...match,
        status: 'COMPLETED' as MatchStatus,
        completedAt: new Date(),
        updatedAt: new Date(),
        ...(scorerName ? { scorerName } : {})
      };
      
      const updatedMatches = state.matches.map(m => 
        m.id === matchId ? updatedMatch : m
      );
      
      saveMatches(updatedMatches);
      success = true;
      
      return {
        ...state,
        matches: updatedMatches,
        currentMatch: updatedMatch
      };
    });
    
    return success;
  },
  
  updateCourtNumber: (matchId, courtNumber) => {
    set((state): StandaloneMatchStore => {
      const match = state.matches.find(m => m.id === matchId);
      
      if (!match) return state;
      
      const updatedMatch: StandaloneMatch = {
        ...match,
        courtNumber,
        updatedAt: new Date()
      };
      
      const updatedMatches = state.matches.map(m => 
        m.id === matchId ? updatedMatch : m
      );
      
      saveMatches(updatedMatches);
      
      return {
        ...state,
        matches: updatedMatches,
        currentMatch: updatedMatch
      };
    });
  },
  
  saveMatch: () => {
    const { matches } = get();
    saveMatches(matches);
  },

  setCurrentMatch: (match) => {
    set({ currentMatch: match });
  },
  
  // Add optional delete functionality
  deleteMatch: (matchId) => {
    set((state) => {
      const updatedMatches = state.matches.filter(m => m.id !== matchId);
      saveMatches(updatedMatches);
      return { 
        ...state,
        matches: updatedMatches,
        currentMatch: state.currentMatch?.id === matchId ? null : state.currentMatch
      };
    });
  }
}));

// React hook for using the store
export const useStandaloneMatchStore = () => useStore(standaloneMatchStore);

export default standaloneMatchStore;
