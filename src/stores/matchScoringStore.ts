import { create } from 'zustand';
import { MatchScore, ScoreAuditLog } from '@/types/scoring';

interface MatchScoringState {
  currentSet: number;
  scores: MatchScore[];
  matchComplete: boolean;
  winner: 'team1' | 'team2' | null;
  setCurrentSet: (set: number) => void;
  updateScore: (score: MatchScore, auditLog: ScoreAuditLog) => void;
  completeSet: (winner: 'team1' | 'team2') => void;
  resetMatch: () => void;
}

export const useMatchScoringStore = create<MatchScoringState>((set, get) => ({
  currentSet: 1,
  scores: [],
  matchComplete: false,
  winner: null,

  setCurrentSet: (set: number) => {
    set({ currentSet: set });
  },

  updateScore: (score: MatchScore, auditLog: ScoreAuditLog) => {
    const { scores, currentSet } = get();
    const updatedScores = [...scores];
    updatedScores[currentSet - 1] = {
      ...score,
      auditLogs: [...(score.auditLogs || []), auditLog]
    };
    set({ scores: updatedScores });
  },

  completeSet: (winner: 'team1' | 'team2') => {
    const { scores } = get();
    const team1Sets = scores.filter((s: MatchScore) => s.winner === 'team1').length;
    const team2Sets = scores.filter((s: MatchScore) => s.winner === 'team2').length;

    if (winner === 'team1' && team1Sets + 1 >= 2) {
      set({ matchComplete: true, winner: 'team1' });
    } else if (winner === 'team2' && team2Sets + 1 >= 2) {
      set({ matchComplete: true, winner: 'team2' });
    } else {
      set((state) => ({ currentSet: state.currentSet + 1 }));
    }
  },

  resetMatch: () => {
    set({
      currentSet: 1,
      scores: [],
      matchComplete: false,
      winner: null
    });
  }
})); 