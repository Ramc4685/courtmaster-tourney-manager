
import { create } from "zustand";
import { ScoringState } from "./types";
import { createScoringActions } from "./actions";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

export const useScoringStore = create<ScoringState>((set, get) => {
  return {
    // Initial state
    selectedMatch: null,
    selectedCourt: null,
    currentSet: 0,
    settingsOpen: false,
    activeView: "courts",
    newSetDialogOpen: false,
    completeMatchDialogOpen: false,
    scoringSettings: getDefaultScoringSettings(),
    
    // Basic setters
    setSelectedMatch: (match) => set({ selectedMatch: match }),
    setSelectedCourt: (court) => set({ selectedCourt: court }),
    setCurrentSet: (setIndex) => set({ currentSet: setIndex }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setActiveView: (view) => set({ activeView: view }),
    setNewSetDialogOpen: (open) => set({ newSetDialogOpen: open }),
    setCompleteMatchDialogOpen: (open) => set({ completeMatchDialogOpen: open }),
    setScoringSettings: (settings) => set({ scoringSettings: settings }),
    
    // Standalone match scoring methods
    handleStandaloneScoreChange: (team, increment, standaloneStore) => {
      const { selectedMatch, currentSet, scoringSettings } = get();
      if (!selectedMatch || !standaloneStore.currentMatch) {
        console.error('[ERROR] Cannot update score: No match selected.');
        return;
      }
      
      let scores = [...selectedMatch.scores];
      if (scores.length === 0) {
        scores = [{ team1Score: 0, team2Score: 0 }];
      }
      
      const currentScore = scores[currentSet] || { team1Score: 0, team2Score: 0 };
      let team1Score = currentScore.team1Score;
      let team2Score = currentScore.team2Score;
      
      if (team === "team1") {
        team1Score = increment 
          ? Math.min(scoringSettings.maxPoints + 10, team1Score + 1)
          : Math.max(0, team1Score - 1);
      } else {
        team2Score = increment 
          ? Math.min(scoringSettings.maxPoints + 10, team2Score + 1)
          : Math.max(0, team2Score - 1);
      }
      
      // Update match score in the standalone store
      standaloneStore.updateMatchScore(selectedMatch.id, currentSet, team1Score, team2Score);
      
      // Update local state
      const updatedScores = [...selectedMatch.scores];
      if (updatedScores.length <= currentSet) {
        while (updatedScores.length <= currentSet) {
          updatedScores.push({ team1Score: 0, team2Score: 0 });
        }
      }
      updatedScores[currentSet] = { team1Score, team2Score };
      
      const updatedMatch = {
        ...selectedMatch,
        scores: updatedScores
      };
      set({ selectedMatch: updatedMatch });
      
      // Check for set or match completion logic would be handled by the scorer component
    },
    
    handleStandaloneStartMatch: (matchId, standaloneStore) => {
      standaloneStore.updateMatchStatus(matchId, "IN_PROGRESS");
      
      // Select the match
      const match = standaloneStore.matches.find(m => m.id === matchId);
      if (match) {
        set({ 
          selectedMatch: match,
          activeView: "scoring",
          currentSet: match.scores.length > 0 ? match.scores.length - 1 : 0
        });
      }
    },
    
    handleStandaloneCompleteMatch: (standaloneStore) => {
      const { selectedMatch } = get();
      if (!selectedMatch) {
        console.error('[ERROR] Cannot complete match: No match selected.');
        return;
      }
      
      standaloneStore.completeMatch(selectedMatch.id);
      
      set({ 
        selectedMatch: null,
        activeView: "courts",
        completeMatchDialogOpen: false
      });
    },
    
    handleStandaloneNewSet: (standaloneStore) => {
      const { selectedMatch, currentSet, scoringSettings } = get();
      if (!selectedMatch) {
        console.error('[ERROR] Cannot create new set: No match selected.');
        return;
      }
      
      const newSetIndex = selectedMatch.scores.length;
      
      if (newSetIndex >= scoringSettings.maxSets) {
        console.warn(`[WARN] Maximum sets (${scoringSettings.maxSets}) reached`);
        return;
      }
      
      // Initialize the new set with 0-0 score
      standaloneStore.updateMatchScore(selectedMatch.id, newSetIndex, 0, 0);
      
      // Update our local state to reflect the new set
      const updatedScores = [...selectedMatch.scores, { team1Score: 0, team2Score: 0 }];
      const updatedMatch = {
        ...selectedMatch,
        scores: updatedScores
      };
      
      set({ 
        selectedMatch: updatedMatch,
        currentSet: newSetIndex,
        newSetDialogOpen: false
      });
    },
    
    // Business logic actions imported from actions.ts
    ...createScoringActions(set, get)
  };
});
