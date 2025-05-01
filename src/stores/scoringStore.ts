// Stores related to scoring logic

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Match, MatchScores, MatchStatus } from "@/types/entities";

interface ScoringState {
  activeMatchId: string | null;
  activeMatchData: Match | null;
  scoreHistory: MatchScores[]; // History for undo
  redoHistory: MatchScores[]; // History for redo
  isLoading: boolean;
  error: string | null;

  setActiveMatch: (match: Match | null) => void;
  updateScoreAndStatus: (
    newScores: MatchScores,
    newStatus: MatchStatus,
    winnerId?: string | null,
    loserId?: string | null
  ) => void;
  addScoreHistory: (scores: MatchScores) => void;
  undoScore: () => boolean; // Returns true if undo was successful
  redoScore: () => boolean; // Returns true if redo was successful
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const MAX_HISTORY_LENGTH = 20; // Limit undo/redo history

export const useScoringStore = create<ScoringState>()(
  persist(
    (set, get) => ({
      activeMatchId: null,
      activeMatchData: null,
      scoreHistory: [],
      redoHistory: [],
      isLoading: false,
      error: null,

      setActiveMatch: (match) => {
        console.log("[ScoringStore] Setting active match:", match?.id);
        set({
          activeMatchId: match?.id || null,
          activeMatchData: match,
          isLoading: false,
          error: null,
          scoreHistory: match?.scores ? [match.scores] : [], // Initialize history with current score
          redoHistory: [], // Clear redo history on new match
        });
      },

      updateScoreAndStatus: (newScores, newStatus, winnerId, loserId) => {
        set((state) => {
          if (!state.activeMatchData) return {};
          console.log("[ScoringStore] Updating score and status:", newScores, newStatus);
          return {
            activeMatchData: {
              ...state.activeMatchData,
              scores: newScores,
              status: newStatus,
              winner_id: winnerId !== undefined ? winnerId : state.activeMatchData.winner_id,
              loser_id: loserId !== undefined ? loserId : state.activeMatchData.loser_id,
            },
            // Clear redo history whenever a new score is applied
            redoHistory: [], 
          };
        });
      },

      addScoreHistory: (scores) => {
        set((state) => {
          const newHistory = [scores, ...state.scoreHistory].slice(0, MAX_HISTORY_LENGTH);
          console.log("[ScoringStore] Adding score to history. New length:", newHistory.length);
          return { scoreHistory: newHistory };
        });
      },

      undoScore: () => {
        let success = false;
        set((state) => {
          if (!state.activeMatchData || state.scoreHistory.length < 2) {
            console.log("[ScoringStore] Undo failed: Not enough history.");
            return {}; // Need at least the current state and one previous state
          }

          const currentState = state.scoreHistory[0]; // Current score state before undo
          const previousState = state.scoreHistory[1]; // State to revert to
          const remainingHistory = state.scoreHistory.slice(1); // Remove current state from history
          const newRedoHistory = [currentState, ...state.redoHistory].slice(0, MAX_HISTORY_LENGTH);

          console.log("[ScoringStore] Undoing score. Reverting to:", previousState);
          success = true;
          return {
            activeMatchData: {
              ...state.activeMatchData,
              scores: previousState,
              // TODO: Revert status if it changed? This might be complex.
              // For now, just revert scores. Status might need manual correction or recalculation.
              status: state.activeMatchData.status === MatchStatus.COMPLETED ? MatchStatus.IN_PROGRESS : state.activeMatchData.status, // Revert completed status
              winner_id: state.activeMatchData.status === MatchStatus.COMPLETED ? null : state.activeMatchData.winner_id,
              loser_id: state.activeMatchData.status === MatchStatus.COMPLETED ? null : state.activeMatchData.loser_id,
            },
            scoreHistory: remainingHistory,
            redoHistory: newRedoHistory,
          };
        });
        return success;
      },

      redoScore: () => {
        let success = false;
        set((state) => {
          if (!state.activeMatchData || state.redoHistory.length === 0) {
            console.log("[ScoringStore] Redo failed: No redo history.");
            return {};
          }

          const nextState = state.redoHistory[0]; // State to restore
          const remainingRedoHistory = state.redoHistory.slice(1);
          const newScoreHistory = [nextState, ...state.scoreHistory].slice(0, MAX_HISTORY_LENGTH);

          console.log("[ScoringStore] Redoing score. Restoring to:", nextState);
          success = true;
          // TODO: Recalculate status based on the redone score?
          // For now, just restore scores. Status might need recalculation.
          return {
            activeMatchData: {
              ...state.activeMatchData,
              scores: nextState,
              // Status might need recalculation here based on nextState
            },
            scoreHistory: newScoreHistory,
            redoHistory: remainingRedoHistory,
          };
        });
        return success;
      },

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "courtmaster-scoring-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeMatchId: state.activeMatchId,
        activeMatchData: state.activeMatchData,
        scoreHistory: state.scoreHistory, // Persist history
        redoHistory: state.redoHistory,   // Persist redo history
      }),
      // Custom merge function to handle potential hydration issues if needed
      // merge: (persistedState, currentState) => { ... }
    }
  )
);

