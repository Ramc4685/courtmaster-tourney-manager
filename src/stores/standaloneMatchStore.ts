import { create } from 'zustand';
import { generateId } from '@/utils/tournamentUtils';
import { getDefaultScoringSettings, isSetComplete, determineMatchWinnerAndLoser, countSetsWon } from '@/utils/matchUtils';
import { StandaloneMatch, MatchStatus, MatchScore } from '@/types/tournament';
import { getCurrentUserId } from '@/utils/auditUtils';

interface StandaloneMatchState {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  addMatch: (team1Name: string, team2Name: string) => void;
  loadMatchById: (matchId: string) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => boolean;
  resetMatches: () => void;
  updateMatch: (match: StandaloneMatch) => void;
  updateCourtNumber: (matchId: string, courtNumber: number) => void;
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
      startTime: new Date(),
      endTime: null,
      scorerName: 'Anonymous Scorer',
      courtNumber: undefined,
    };
    set(state => ({ matches: [...state.matches, newMatch] }));
    console.log("Match added:", newMatch);
  },
  loadMatchById: (matchId: string) => {
    const match = get().matches.find(m => m.id === matchId);
    if (match) {
      set({ currentMatch: match });
      console.log("Match loaded:", match);
    } else {
      console.log("Match not found:", matchId);
    }
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
    const result = determineMatchWinnerAndLoser(match, scoringSettings);
    
    if (!result) return false;
    
    set(state => ({
      matches: state.matches.map(match => {
        if (match.id === matchId) {
          const updatedMatch: StandaloneMatch = {
            ...match,
            status: 'COMPLETED',
            endTime: new Date(),
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
    return true;
  },
  resetMatches: () => {
    set({ matches: [], currentMatch: null });
  },
  updateMatch: (match: StandaloneMatch) => {
    set(state => ({
      matches: state.matches.map(m => m.id === match.id ? match : m),
      currentMatch: match.id === state.currentMatch?.id ? match : state.currentMatch
    }));
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
}));
