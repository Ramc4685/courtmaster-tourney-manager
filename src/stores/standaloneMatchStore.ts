import { create } from "zustand";
import { StandaloneMatch, Team, MatchStatus } from "@/types/tournament";
import { standaloneMatchService } from "@/services/match/StandaloneMatchService";
import { getDefaultScoringSettings } from "@/utils/matchUtils";
import { generateId } from "@/utils/tournamentUtils";
import { getCurrentUserId } from "@/utils/auditUtils";

interface StandaloneMatchState {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  loadMatches: () => Promise<void>;
  loadMatchById: (id: string) => Promise<StandaloneMatch | null>;
  loadMatchByShareCode: (shareCode: string) => Promise<StandaloneMatch | null>;
  createMatch: (team1: Team, team2: Team, scheduledTime?: Date) => Promise<StandaloneMatch>;
  updateMatch: (match: StandaloneMatch) => Promise<StandaloneMatch>;
  deleteMatch: (id: string) => Promise<void>;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
  saveMatch: () => Promise<boolean>; // Add saveMatch method
  
  // Match operations
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => Promise<void>;
  updateMatchStatus: (matchId: string, status: MatchStatus) => Promise<void>;
  completeMatch: (matchId: string) => Promise<void>;
  toggleMatchPublicity: (matchId: string) => Promise<void>;
  
  // Team operations
  createTeam: (name: string, players?: string[]) => Team;
}

export const useStandaloneMatchStore = create<StandaloneMatchState>((set, get) => ({
  matches: [],
  currentMatch: null,
  isLoading: false,
  error: null,
  
  // CRUD operations
  
  loadMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const matches = await standaloneMatchService.getMatches();
      set({ matches, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
  
  loadMatchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const matches = await standaloneMatchService.getMatches();
      const match = matches.find(m => m.id === id) || null;
      
      if (match) {
        set({ currentMatch: match, isLoading: false });
      } else {
        set({ isLoading: false, error: "Match not found" });
      }
      return match;
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },
  
  loadMatchByShareCode: async (shareCode) => {
    set({ isLoading: true, error: null });
    try {
      const match = await standaloneMatchService.getMatchByShareCode(shareCode);
      
      if (match) {
        set({ currentMatch: match, isLoading: false });
      } else {
        set({ isLoading: false, error: "Match not found" });
      }
      return match;
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },
  
  createMatch: async (team1, team2, scheduledTime) => {
    set({ isLoading: true, error: null });
    try {
      const newMatch = await standaloneMatchService.createMatch(team1, team2, scheduledTime);
      set(state => ({
        matches: [...state.matches, newMatch],
        currentMatch: newMatch,
        isLoading: false
      }));
      return newMatch;
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  },
  
  updateMatch: async (match) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMatch = await standaloneMatchService.updateMatch(match);
      set(state => ({
        matches: state.matches.map(m => m.id === match.id ? updatedMatch : m),
        currentMatch: state.currentMatch?.id === match.id ? updatedMatch : state.currentMatch,
        isLoading: false
      }));
      return updatedMatch;
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  },
  
  // Add saveMatch method that uses updateMatch for the current match
  saveMatch: async () => {
    const { currentMatch, updateMatch } = get();
    if (!currentMatch) return false;
    
    try {
      await updateMatch(currentMatch);
      return true;
    } catch (e) {
      console.error("Error saving match:", e);
      return false;
    }
  },
  
  
  
  deleteMatch: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await standaloneMatchService.deleteMatch(id);
      set(state => ({
        matches: state.matches.filter(m => m.id !== id),
        currentMatch: state.currentMatch?.id === id ? null : state.currentMatch,
        isLoading: false
      }));
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  },
  
  setCurrentMatch: (match) => {
    set({ currentMatch: match });
  },
  
  // Match operations
  updateMatchScore: async (matchId, setIndex, team1Score, team2Score) => {
    try {
      const updatedMatch = await standaloneMatchService.updateMatchScore(
        matchId, setIndex, team1Score, team2Score
      );
      
      if (updatedMatch) {
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },
  
  updateMatchStatus: async (matchId, status) => {
    try {
      const updatedMatch = await standaloneMatchService.updateMatchStatus(
        matchId, status
      );
      
      if (updatedMatch) {
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },
  
  completeMatch: async (matchId) => {
    try {
      // Use the default scoring settings
      const scoringSettings = getDefaultScoringSettings();
      
      const updatedMatch = await standaloneMatchService.completeMatch(
        matchId, scoringSettings
      );
      
      if (updatedMatch) {
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },
  
  toggleMatchPublicity: async (matchId) => {
    try {
      const updatedMatch = await standaloneMatchService.toggleMatchPublicity(matchId);
      
      if (updatedMatch) {
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },
  
  // Team operations
  createTeam: (name, players = []) => {
    const userId = getCurrentUserId();
    const now = new Date();
    
    return {
      id: generateId(),
      name,
      players: players.map(playerName => ({
        id: generateId(),
        name: playerName,
        createdAt: now,
        created_by: userId
      })),
      createdAt: now,
      updatedAt: now,
      created_by: userId,
      updated_by: userId
    };
  }
}));
