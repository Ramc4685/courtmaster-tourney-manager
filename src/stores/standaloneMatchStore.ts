import { create } from 'zustand';
import { StandaloneMatch } from '@/types/tournament';
import { LocalStorage } from '@/utils/localStorage';
import { generateId } from '@/utils/tournamentUtils';
import { addScoringAuditInfo, addCourtAssignmentAuditInfo } from '@/utils/matchAuditUtils';
import { getCurrentUserId } from '@/utils/auditUtils';

export interface StandaloneMatchStore {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  isLoading: boolean;
  error: string | null;
  createMatch: (match: Partial<StandaloneMatch>) => StandaloneMatch;
  updateMatch: (matchId: string, match: Partial<StandaloneMatch>) => StandaloneMatch | null;
  deleteMatch: (matchId: string) => void;
  loadMatches: () => Promise<void>;
  loadMatchById: (id: string) => Promise<StandaloneMatch | null>;
  setCurrentMatch: (match: StandaloneMatch) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => void;
  saveMatch: () => Promise<StandaloneMatch | null>;
  updateCourtNumber: (matchId: string, courtNumber: number) => void; // New method
}

const initialStandaloneMatches: StandaloneMatch[] = [];

export const useStandaloneMatchStore = create<StandaloneMatchStore>((set, get) => ({
  matches: initialStandaloneMatches,
  currentMatch: null,
  isLoading: false,
  error: null,

  createMatch: (matchData) => {
    const newMatch: StandaloneMatch = {
      id: generateId(),
      team1: matchData.team1 || { id: generateId(), name: 'Team 1', players: [] },
      team2: matchData.team2 || { id: generateId(), name: 'Team 2', players: [] },
      scores: [],
      status: 'SCHEDULED',
      createdAt: new Date(),
      updatedAt: new Date(),
      created_by: getCurrentUserId(),
      updated_by: getCurrentUserId(),
      ...matchData,
    } as StandaloneMatch;

    set(state => ({
      matches: [...state.matches, newMatch],
      currentMatch: newMatch,
    }));

    const storage = new LocalStorage();
    storage.saveMatches([...get().matches, newMatch]);

    return newMatch;
  },

  updateMatch: (matchId, matchUpdates) => {
    set(state => {
      const updatedMatches = state.matches.map(match =>
        match.id === matchId ? { ...match, ...matchUpdates, updatedAt: new Date() } : match
      );
      return {
        ...state,
        matches: updatedMatches,
        currentMatch: state.currentMatch?.id === matchId ? { ...state.currentMatch, ...matchUpdates, updatedAt: new Date() } as StandaloneMatch : state.currentMatch,
      };
    });

    const storage = new LocalStorage();
    storage.saveMatches(get().matches);

    return get().matches.find(match => match.id === matchId) || null;
  },

  deleteMatch: (matchId) => {
    set(state => ({
      matches: state.matches.filter(match => match.id !== matchId),
      currentMatch: state.currentMatch?.id === matchId ? null : state.currentMatch,
    }));

    const storage = new LocalStorage();
    storage.saveMatches(get().matches);
  },

  loadMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const storage = new LocalStorage();
      const matches = storage.getMatches() || [];
      set({ matches, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load matches.', isLoading: false });
    }
  },

  loadMatchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const storage = new LocalStorage();
      const matches = storage.getMatches() || [];
      const match = matches.find(m => m.id === id) || null;
      set({ currentMatch: match, isLoading: false });
      return match;
    } catch (error) {
      set({ error: 'Failed to load match.', isLoading: false });
      return null;
    }
  },

  setCurrentMatch: (match) => {
    set({ currentMatch: match });
  },

  updateMatchScore: (matchId, setIndex, team1Score, team2Score, scorerName) => {
    set(state => {
      const updatedMatches = state.matches.map(match => {
        if (match.id === matchId) {
          const newScores = [...match.scores];
          newScores[setIndex] = { team1Score, team2Score };

          // Add scoring audit info
          const updatedMatch = addScoringAuditInfo({
            ...match,
            scores: newScores,
            updatedAt: new Date(),
            updated_by: getCurrentUserId(),
            scorerName: scorerName || match.scorerName
          }, scorerName || match.scorerName) as StandaloneMatch;

          return updatedMatch;
        }
        return match;
      });

      const updatedCurrentMatch = updatedMatches.find(match => match.id === matchId) as StandaloneMatch;

      return {
        ...state,
        matches: updatedMatches,
        currentMatch: updatedCurrentMatch || state.currentMatch,
      };
    });

    const storage = new LocalStorage();
    storage.saveMatches(get().matches);
  },

  completeMatch: (matchId, scorerName) => {
    set(state => {
      const updatedMatches = state.matches.map(match => {
        if (match.id === matchId) {
          // Add scoring audit info for match completion
          const updatedMatch = addScoringAuditInfo({
            ...match,
            status: 'COMPLETED',
            endTime: new Date(),
            updatedAt: new Date(),
            updated_by: getCurrentUserId(),
            scorerName: scorerName || match.scorerName
          }, scorerName || match.scorerName) as StandaloneMatch;

          return updatedMatch;
        }
        return match;
      });

      const updatedCurrentMatch = updatedMatches.find(match => match.id === matchId) as StandaloneMatch;

      return {
        ...state,
        matches: updatedMatches,
        currentMatch: updatedCurrentMatch || state.currentMatch,
      };
    });

    const storage = new LocalStorage();
    storage.saveMatches(get().matches);
  },
  
  updateCourtNumber: (matchId, courtNumber) => {
    const { matches } = get();
    const match = matches.find(m => m.id === matchId);
    
    if (!match) {
      console.error(`Match with ID ${matchId} not found.`);
      return;
    }
    
    const userId = getCurrentUserId();
    const now = new Date();
    
    // Add court assignment to audit log
    const updatedMatch = addCourtAssignmentAuditInfo({
      ...match,
      courtNumber,
      updatedAt: now,
      updated_by: userId
    }, courtNumber) as StandaloneMatch;
    
    // Update match in store
    set(state => ({
      ...state,
      matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
      currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
    }));
    
    console.log(`Court number updated to ${courtNumber} for match ${matchId}`);
    
    // Save to storage in the background
    const storage = new LocalStorage();
    storage.saveMatches([...get().matches.filter(m => m.id !== matchId), updatedMatch]);
  },

  saveMatch: async () => {
    if (!get().currentMatch) {
      console.warn('No current match to save.');
      return null;
    }

    const storage = new LocalStorage();
    storage.saveMatches(get().matches);
    return get().currentMatch;
  },
}));
