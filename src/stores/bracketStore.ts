import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tournament, Match, Team } from '@/types/tournament';
import { BracketManager } from '@/tournament/progression/BracketManager';

interface BracketState {
  bracketHistory: {
    tournamentId: string;
    timestamp: Date;
    matches: Match[];
  }[];
  currentBracket: {
    tournamentId: string;
    matches: Match[];
  } | null;
  bracketManager: BracketManager;
  
  // Actions
  saveBracketState: (tournament: Tournament) => void;
  restoreBracketState: (tournamentId: string) => Match[] | null;
  updateBracketProgression: (tournament: Tournament, match: Match) => Tournament;
  clearBracketHistory: (tournamentId: string) => void;
  generateNextRound: (tournament: Tournament, currentRound: number) => Match[];
}

const useBracketStore = create<BracketState>()(
  persist(
    (set, get) => ({
      bracketHistory: [],
      currentBracket: null,
      bracketManager: new BracketManager(),

      saveBracketState: (tournament: Tournament) => {
        const timestamp = new Date();
        set((state) => ({
          bracketHistory: [
            ...state.bracketHistory,
            {
              tournamentId: tournament.id,
              timestamp,
              matches: tournament.matches
            }
          ].slice(-10), // Keep last 10 states
          currentBracket: {
            tournamentId: tournament.id,
            matches: tournament.matches
          }
        }));
      },

      restoreBracketState: (tournamentId: string) => {
        const state = get();
        if (state.currentBracket?.tournamentId === tournamentId) {
          return state.currentBracket.matches;
        }
        return null;
      },

      updateBracketProgression: (tournament: Tournament, match: Match) => {
        const updatedTournament = get().bracketManager.updateProgression(tournament, match);
        get().saveBracketState(updatedTournament);
        return updatedTournament;
      },

      clearBracketHistory: (tournamentId: string) => {
        set((state) => ({
          bracketHistory: state.bracketHistory.filter(
            (history) => history.tournamentId !== tournamentId
          ),
          currentBracket: state.currentBracket?.tournamentId === tournamentId
            ? null
            : state.currentBracket
        }));
      },

      generateNextRound: (tournament: Tournament, currentRound: number) => {
        const nextRoundMatches = get().bracketManager.generateNextRound(tournament, currentRound);
        if (nextRoundMatches.length > 0) {
          get().saveBracketState({
            ...tournament,
            matches: [...tournament.matches, ...nextRoundMatches]
          });
        }
        return nextRoundMatches;
      }
    }),
    {
      name: 'tournament-bracket-storage',
      partialize: (state) => ({
        bracketHistory: state.bracketHistory,
        currentBracket: state.currentBracket
      })
    }
  )
); 