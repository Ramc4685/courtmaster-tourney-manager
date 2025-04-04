
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Match, StandaloneMatch, MatchStatus } from '@/types/tournament';
import { generateId } from '@/utils/tournamentUtils';
import { addScoringAuditInfo } from '@/utils/matchAuditUtils'; 
import { getCurrentUserId } from '@/utils/auditUtils';

// Define the store state type
interface StandaloneMatchStore {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  
  // Actions
  createMatch: (match: Partial<StandaloneMatch>) => StandaloneMatch;
  updateMatch: (matchId: string, updates: Partial<StandaloneMatch>) => StandaloneMatch | null;
  deleteMatch: (matchId: string) => void;
  loadMatchById: (matchId: string) => StandaloneMatch | null;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
  updateMatchScore: (
    matchId: string, 
    setIndex: number, 
    team1Score: number, 
    team2Score: number,
    scorerName?: string
  ) => void;
  completeMatch: (matchId: string, scorerName?: string) => void;
  saveMatch: () => Promise<StandaloneMatch | null>;
}

// Create the store with persistence
export const useStandaloneMatchStore = create<StandaloneMatchStore>()(
  persist(
    (set, get) => ({
      matches: [],
      currentMatch: null,
      
      createMatch: (matchData) => {
        const now = new Date();
        const userId = getCurrentUserId();
        const newMatch: StandaloneMatch = {
          id: generateId(),
          team1: matchData.team1 || { id: generateId(), name: 'Team 1', players: [] },
          team2: matchData.team2 || { id: generateId(), name: 'Team 2', players: [] },
          scores: [],
          status: 'SCHEDULED' as MatchStatus,
          createdAt: now,
          updatedAt: now,
          created_by: userId,
          updated_by: userId,
          matchNumber: `SM-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, // Add match number
          ...matchData
        };
        
        set(state => ({
          matches: [...state.matches, newMatch],
          currentMatch: newMatch
        }));
        
        return newMatch;
      },
      
      updateMatch: (matchId, updates) => {
        const match = get().matches.find(m => m.id === matchId);
        if (!match) return null;
        
        const updatedMatch = {
          ...match,
          ...updates,
          updatedAt: new Date(),
          updated_by: getCurrentUserId()
        };
        
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
        
        return updatedMatch;
      },
      
      deleteMatch: (matchId) => {
        set(state => ({
          matches: state.matches.filter(m => m.id !== matchId),
          currentMatch: state.currentMatch?.id === matchId ? null : state.currentMatch
        }));
      },
      
      loadMatchById: (matchId) => {
        const match = get().matches.find(m => m.id === matchId);
        if (match) {
          set({ currentMatch: match });
        }
        return match || null;
      },
      
      setCurrentMatch: (match) => {
        set({ currentMatch: match });
      },
      
      updateMatchScore: (matchId, setIndex, team1Score, team2Score, scorerName) => {
        const match = get().matches.find(m => m.id === matchId);
        if (!match) return;
        
        const scores = [...(match.scores || [])];
        
        // Ensure we have enough sets
        while (scores.length <= setIndex) {
          scores.push({ team1Score: 0, team2Score: 0 });
        }
        
        // Update the score at the specified index
        scores[setIndex] = { team1Score, team2Score };
        
        // Add audit information
        const updatedMatch = addScoringAuditInfo({
          ...match,
          scores,
          updatedAt: new Date(),
          updated_by: getCurrentUserId()
        }, scorerName || getCurrentUserId(), match.courtNumber);
        
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
      },
      
      completeMatch: (matchId, scorerName) => {
        const match = get().matches.find(m => m.id === matchId);
        if (!match) return;
        
        const now = new Date();
        
        // Add audit information with completion details
        const updatedMatch = addScoringAuditInfo({
          ...match,
          status: 'COMPLETED' as MatchStatus,
          endTime: now,
          updatedAt: now,
          updated_by: getCurrentUserId()
        }, scorerName || getCurrentUserId(), match.courtNumber);
        
        set(state => ({
          matches: state.matches.map(m => m.id === matchId ? updatedMatch : m),
          currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
        }));
      },
      
      saveMatch: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return null;
        
        // In a real application, this would send the match data to a server
        // For now, just update the local state with the current timestamp
        const updatedMatch = {
          ...currentMatch,
          updatedAt: new Date(),
          updated_by: getCurrentUserId()
        };
        
        set(state => ({
          matches: state.matches.map(m => m.id === updatedMatch.id ? updatedMatch : m),
          currentMatch: updatedMatch
        }));
        
        return updatedMatch;
      }
    }),
    {
      name: 'standalone-matches-storage'
    }
  )
);
