import { Match, Court, Tournament } from '@/types/tournament';
import { ScoringSettings } from '@/types/scoring'; 
import { ScoringState, ScoringStore } from './types';
import { getDefaultScoringSettings, isSetComplete, isMatchComplete } from '@/utils/matchUtils';

export const actions = (set: ScoringStore['set'], get: ScoringStore['get']) => ({
  initializeScoring: async (matchId: string): Promise<Match | null> => {
    // Fetch the current tournament
    const tournament = get().currentTournament;

    if (!tournament) {
      console.error("No tournament loaded");
      return null;
    }

    // Find the match within the tournament
    const match = tournament.matches.find(match => match.id === matchId);

    if (!match) {
      console.error(`Match with id ${matchId} not found in the tournament`);
      return null;
    }

    // Set the selected match and default scoring settings
    set({
      selectedMatch: match,
      scoringSettings: tournament.scoringSettings || getDefaultScoringSettings(),
      currentSet: 0,
      settingsOpen: false,
      newSetDialogOpen: false,
      completeMatchDialogOpen: false,
      activeView: "scoring"
    });

    return match;
  },

  handleSelectCourt: (court: Court) => {
    set({ selectedCourt: court });
  },

  handleSelectMatch: (match: Match) => {
    set({ 
      selectedMatch: match,
      currentSet: 0,
      activeView: "scoring"
    });
  },

  handleScoreChange: (team: "team1" | "team2", increment: boolean) => {
    set((state) => {
      if (!state.selectedMatch) return state;

      const currentSet = state.currentSet;
      const scores = [...(state.selectedMatch.scores || [])];

      // Ensure the set exists
      while (scores.length <= currentSet) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }

      let { team1Score, team2Score } = scores[currentSet];

      // Update the score based on the team and increment
      if (team === "team1") {
        team1Score = increment ? team1Score + 1 : Math.max(0, team1Score - 1);
      } else {
        team2Score = increment ? team2Score + 1 : Math.max(0, team2Score - 1);
      }

      // Update the score in the array
      scores[currentSet] = { team1Score, team2Score };

      // Return the updated state
      return {
        ...state,
        selectedMatch: {
          ...state.selectedMatch,
          scores: scores,
        },
      };
    });
  },

  handleNewSet: () => {
    set((state) => {
      if (!state.selectedMatch || !state.scoringSettings) return state;

      const newSetIndex = state.selectedMatch.scores ? state.selectedMatch.scores.length : 0;

      if (newSetIndex >= state.scoringSettings.maxSets) {
        alert("Maximum sets reached");
        return state;
      }

      return {
        ...state,
        selectedMatch: {
          ...state.selectedMatch,
          scores: [...(state.selectedMatch.scores || []), { team1Score: 0, team2Score: 0 }],
        },
        currentSet: newSetIndex,
      };
    });
  },

  handleCompleteMatch: () => {
    set((state) => {
      if (!state.selectedMatch || !state.scoringSettings) return state;

      const team1Sets = state.selectedMatch.scores?.filter(
        (score) => score.team1Score > score.team2Score && isSetComplete(score.team1Score, score.team2Score, state.scoringSettings!)
      ).length || 0;
      const team2Sets = state.selectedMatch.scores?.filter(
        (score) => score.team2Score > score.team1Score && isSetComplete(score.team1Score, score.team2Score, state.scoringSettings!)
      ).length || 0;

      const setsToWin = state.scoringSettings.setsToWin || Math.ceil(state.scoringSettings.maxSets / 2);

      let winner: "team1" | "team2" | null = null;
      if (team1Sets >= setsToWin) {
        winner = "team1";
      } else if (team2Sets >= setsToWin) {
        winner = "team2";
      }

      return {
        ...state,
        matchComplete: true,
        winner: winner,
      };
    });
  },

  setActiveView: (view: ScoringState['activeView']) => {
    set({ activeView: view });
  },

  setCurrentTournament: (tournament: Tournament) => {
    set({ currentTournament: tournament });
  },
});
