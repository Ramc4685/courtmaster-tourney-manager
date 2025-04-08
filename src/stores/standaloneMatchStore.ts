
import { create } from 'zustand';
import { generateId } from '@/utils/tournamentUtils';
import { getDefaultScoringSettings, isSetComplete, determineMatchWinnerAndLoser, countSetsWon } from '@/utils/matchUtils';
import { StandaloneMatch, MatchStatus, MatchScore, Team, Match } from '@/types/tournament';
import { getCurrentUserId } from '@/utils/auditUtils';

interface StandaloneMatchState {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  addMatch: (team1Name: string, team2Name: string) => void;
  createMatch: (matchData: Partial<StandaloneMatch>) => StandaloneMatch;
  loadMatchById: (matchId: string) => StandaloneMatch | null;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => boolean;
  resetMatches: () => void;
  updateMatch: (match: StandaloneMatch) => StandaloneMatch;
  updateCourtNumber: (matchId: string, courtNumber: number) => void;
  deleteMatch: (matchId: string) => void;
  saveMatch: () => Promise<boolean>;
}

export const useStandaloneMatchStore = create<StandaloneMatchState>((set, get) => ({
  matches: [],
  currentMatch: null,
  
  addMatch: (team1Name: string, team2Name: string) => {
    const newMatch: StandaloneMatch = {
      id: generateId(),
      team1: { id: generateId(), name: team1Name, players: [] },
      team2: { id: generateId(), name: team2Name, players: [] },
      scores: [],
      status: 'SCHEDULED',
      scheduledTime: new Date(),
      scorerName: 'Anonymous Scorer',
      courtNumber: undefined,
    };
    set(state => ({ matches: [...state.matches, newMatch] }));
    console.log("Match added:", newMatch);
  },
  
  createMatch: (matchData: Partial<StandaloneMatch>) => {
    const newMatch: StandaloneMatch = {
      id: generateId(),
      team1: matchData.team1 || { id: generateId(), name: 'Team 1', players: [] },
      team2: matchData.team2 || { id: generateId(), name: 'Team 2', players: [] },
      scores: matchData.scores || [],
      status: matchData.status || 'SCHEDULED',
      scheduledTime: matchData.scheduledTime || new Date(),
      courtName: matchData.courtName,
      courtNumber: matchData.courtNumber,
      scorerName: matchData.scorerName || 'Anonymous Scorer',
      tournamentName: matchData.tournamentName,
      categoryName: matchData.categoryName,
      isPublic: matchData.isPublic || false,
      shareCode: matchData.shareCode,
      auditLogs: matchData.auditLogs || [],
      createdAt: new Date(),
    };
    
    set(state => ({ 
      matches: [...state.matches, newMatch],
      currentMatch: newMatch
    }));
    
    console.log("Match created:", newMatch);
    return newMatch;
  },
  
  loadMatchById: (matchId: string) => {
    const match = get().matches.find(m => m.id === matchId);
    if (match) {
      set({ currentMatch: match });
      console.log("Match loaded:", match);
      return match;
    } else {
      console.log("Match not found:", matchId);
      return null;
    }
  },
  
  setCurrentMatch: (match: StandaloneMatch | null) => {
    set({ currentMatch: match });
  },
  
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => {
    set(state => ({
      matches: state.matches.map(match => {
        if (match.id === matchId) {
          const scores = [...(match.scores || [])];
          while (scores.length <= setIndex) {
            scores.push({ team1Score: 0, team2Score: 0 });
          }
          scores[setIndex] = { team1Score, team2Score };
          
          // Update scorer name if provided
          const updatedMatch = {
            ...match,
            scores: scores,
            scorerName: scorerName || match.scorerName,
          };
          
          // Update current match if it's the one being updated
          if (state.currentMatch?.id === matchId) {
            set({ currentMatch: updatedMatch });
          }
          
          return updatedMatch;
        }
        return match;
      })
    }));
  },
  
  completeMatch: (matchId: string, scorerName?: string) => {
    const match = get().matches.find(m => m.id === matchId);
    if (!match) return false;
    
    const scoringSettings = getDefaultScoringSettings();
    
    // Determine winner
    const team1Sets = countSetsWon(match.scores, "team1");
    const team2Sets = countSetsWon(match.scores, "team2");
    
    let winner = null;
    if (team1Sets > team2Sets) {
      winner = match.team1;
    } else if (team2Sets > team1Sets) {
      winner = match.team2;
    }
    
    set(state => ({
      matches: state.matches.map(match => {
        if (match.id === matchId) {
          const updatedMatch: StandaloneMatch = {
            ...match,
            status: 'COMPLETED',
            endTime: new Date(),
            scorerName: scorerName || match.scorerName,
            winner: winner || undefined,
          };
          
          // Update current match if it's the one being updated
          if (state.currentMatch?.id === matchId) {
            set({ currentMatch: updatedMatch });
          }
          
          return updatedMatch;
        }
        return match;
      })
    }));
    return true;
  },
  
  resetMatches: () => {
    set({ matches: [], currentMatch: null });
  },
  
  updateMatch: (match: StandaloneMatch) => {
    set(state => {
      const updatedMatches = state.matches.map(m => m.id === match.id ? match : m);
      const updatedCurrentMatch = match.id === state.currentMatch?.id ? match : state.currentMatch;
      return {
        matches: updatedMatches,
        currentMatch: updatedCurrentMatch
      };
    });
    return match;
  },
  
  updateCourtNumber: (matchId: string, courtNumber: number) => {
    set(state => ({
      matches: state.matches.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            courtNumber: courtNumber,
          };
        }
        return match;
      }),
      currentMatch: state.currentMatch?.id === matchId ? { ...state.currentMatch, courtNumber: courtNumber } : state.currentMatch,
    }));
  },
  
  deleteMatch: (matchId: string) => {
    set(state => ({
      matches: state.matches.filter(m => m.id !== matchId),
      currentMatch: state.currentMatch?.id === matchId ? null : state.currentMatch
    }));
  },
  
  saveMatch: async () => {
    // Simulate saving to a database
    try {
      const match = get().currentMatch;
      if (!match) return false;
      
      console.log("Saving match:", match);
      
      // In a real implementation, this would call an API
      // For now, we'll just update the match in our store
      get().updateMatch({
        ...match,
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error("Error saving match:", error);
      return false;
    }
  }
}));
