
import { create } from "zustand";
import { Match, Court, Tournament, ScoringSettings } from "@/types/tournament";
import { useTournamentStore } from "./tournamentStore";
import { isSetComplete, isMatchComplete, getDefaultScoringSettings } from "@/utils/matchUtils";
import { useToast } from "@/hooks/use-toast";

interface ScoringState {
  // State
  selectedMatch: Match | null;
  selectedCourt: Court | null;
  currentSet: number;
  settingsOpen: boolean;
  activeView: "courts" | "scoring";
  newSetDialogOpen: boolean;
  completeMatchDialogOpen: boolean;
  scoringSettings: ScoringSettings;
  
  // Actions
  setSelectedMatch: (match: Match | null) => void;
  setSelectedCourt: (court: Court | null) => void;
  setCurrentSet: (set: number) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveView: (view: "courts" | "scoring") => void;
  setNewSetDialogOpen: (open: boolean) => void;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  setScoringSettings: (settings: ScoringSettings) => void;
  
  // Business logic
  handleSelectMatch: (match: Match) => void;
  handleSelectCourt: (court: Court) => void;
  handleScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  handleStartMatch: (match: Match) => void;
  handleCompleteMatch: () => void;
  handleNewSet: () => void;
  handleUpdateScoringSettings: (settings: ScoringSettings) => void;
  handleBackToCourts: () => void;
}

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
    setCurrentSet: (set) => set({ currentSet: set }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setActiveView: (view) => set({ activeView: view }),
    setNewSetDialogOpen: (open) => set({ newSetDialogOpen: open }),
    setCompleteMatchDialogOpen: (open) => set({ completeMatchDialogOpen: open }),
    setScoringSettings: (settings) => set({ scoringSettings: settings }),
    
    // Business logic
    handleSelectMatch: (match) => {
      console.log(`[DEBUG] Selecting match: ${match.id} (${match.team1.name} vs ${match.team2.name})`);
      
      // Get the latest version of the tournament to make sure we have updated match data
      const { currentTournament } = useTournamentStore.getState();
      if (!currentTournament) {
        console.error('[ERROR] Cannot select match: No current tournament selected.');
        return;
      }
      
      // Find the latest version of the match
      const latestMatch = currentTournament.matches.find(m => m.id === match.id) || match;
      
      // Set the current set index (default to the last set, or 0 if no sets)
      const setIndex = latestMatch.scores.length > 0 ? latestMatch.scores.length - 1 : 0;
      console.log(`[DEBUG] Setting current set to ${setIndex}`);
      
      set({ 
        selectedMatch: latestMatch, 
        currentSet: setIndex,
        activeView: "scoring"
      });
    },
    
    handleSelectCourt: (court) => {
      console.log(`[DEBUG] Selecting court: #${court.number} (${court.name || 'Unnamed'})`);
      
      set({ selectedCourt: court });
      
      if (court.currentMatch) {
        console.log(`[DEBUG] Court has active match, selecting match: ${court.currentMatch.id}`);
        get().handleSelectMatch(court.currentMatch);
      } else {
        console.log(`[DEBUG] Court has no active match.`);
      }
    },
    
    handleScoreChange: (team, increment) => {
      const { selectedMatch, currentSet, scoringSettings } = get();
      if (!selectedMatch) {
        console.error('[ERROR] Cannot update score: No match selected.');
        return;
      }
      
      // Get tournament operations from tournament store
      const { updateMatchScore } = useTournamentStore.getState();
      
      console.log(`[DEBUG] Updating score for ${team} (${increment ? 'increment' : 'decrement'}) for set ${currentSet}`);
      
      let scores = [...selectedMatch.scores];
      if (scores.length === 0) {
        console.log(`[DEBUG] No scores found, initializing with 0-0`);
        scores = [{ team1Score: 0, team2Score: 0 }];
      }
      
      const currentScore = scores[currentSet] || { team1Score: 0, team2Score: 0 };
      let team1Score = currentScore.team1Score;
      let team2Score = currentScore.team2Score;
      
      if (team === "team1") {
        team1Score = increment 
          ? Math.min(scoringSettings.maxPoints + 10, team1Score + 1) // Allow going beyond maxPoints for win by 2
          : Math.max(0, team1Score - 1);
        console.log(`[DEBUG] Updated team1 score: ${currentScore.team1Score} -> ${team1Score}`);
      } else {
        team2Score = increment 
          ? Math.min(scoringSettings.maxPoints + 10, team2Score + 1) // Allow going beyond maxPoints for win by 2
          : Math.max(0, team2Score - 1);
        console.log(`[DEBUG] Updated team2 score: ${currentScore.team2Score} -> ${team2Score}`);
      }
      
      // Call the updateMatchScore method from the tournament store
      updateMatchScore(selectedMatch.id, currentSet, team1Score, team2Score);
      
      // Update our local selected match to reflect the new score immediately
      const updatedScores = [...selectedMatch.scores];
      if (updatedScores.length <= currentSet) {
        console.log(`[DEBUG] Adding new set(s) to score array, current length=${updatedScores.length}, need index=${currentSet}`);
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
      
      // Check if set or match is complete based on rules
      const setComplete = isSetComplete(team1Score, team2Score, scoringSettings);
      if (setComplete) {
        const matchComplete = isMatchComplete(updatedMatch, scoringSettings);
        
        if (matchComplete) {
          set({ completeMatchDialogOpen: true });
        } else {
          set({ newSetDialogOpen: true });
        }
      }
    },
    
    handleStartMatch: (match) => {
      if (!match.courtNumber) {
        console.warn(`[WARN] Cannot start match ${match.id}: No court assigned`);
        const { toast } = useToast();
        toast({
          title: "Court assignment required",
          description: "A match must be assigned to a court before it can start.",
          variant: "destructive"
        });
        return;
      }
      
      // Get tournament operations from tournament store
      const { updateMatchStatus } = useTournamentStore.getState();
      
      console.log(`[DEBUG] Starting match: ${match.id} (${match.team1.name} vs ${match.team2.name})`);
      updateMatchStatus(match.id, "IN_PROGRESS");
      
      // Select the match to view scoring
      get().handleSelectMatch(match);
      
      const { toast } = useToast();
      toast({
        title: "Match started",
        description: "The match has been started and is now in progress."
      });
    },
    
    handleCompleteMatch: () => {
      const { selectedMatch } = get();
      if (!selectedMatch) {
        console.error('[ERROR] Cannot complete match: No match selected.');
        return;
      }
      
      // Get tournament operations from tournament store
      const { completeMatch } = useTournamentStore.getState();
      
      console.log(`[DEBUG] Completing match: ${selectedMatch.id}`);
      completeMatch(selectedMatch.id);
      
      const { toast } = useToast();
      toast({
        title: "Match completed",
        description: "The match has been marked as complete."
      });
      
      set({ 
        selectedMatch: null,
        activeView: "courts",
        completeMatchDialogOpen: false
      });
    },
    
    handleNewSet: () => {
      const { selectedMatch, scoringSettings } = get();
      if (!selectedMatch) {
        console.error('[ERROR] Cannot create new set: No match selected.');
        return;
      }
      
      // Get tournament operations from tournament store
      const { updateMatchScore } = useTournamentStore.getState();
      
      const newSetIndex = selectedMatch.scores.length;
      console.log(`[DEBUG] Creating new set ${newSetIndex + 1} for match ${selectedMatch.id}`);
      
      if (newSetIndex >= scoringSettings.maxSets) {
        console.warn(`[WARN] Maximum sets (${scoringSettings.maxSets}) reached`);
        const { toast } = useToast();
        toast({
          title: "Maximum sets reached",
          description: `This match is limited to ${scoringSettings.maxSets} sets.`
        });
        return;
      }
      
      // Initialize the new set with 0-0 score
      updateMatchScore(selectedMatch.id, newSetIndex, 0, 0);
      
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
      
      const { toast } = useToast();
      toast({
        title: "New set started",
        description: `Set ${newSetIndex + 1} has been started.`
      });
    },
    
    handleUpdateScoringSettings: (newSettings) => {
      console.log(`[DEBUG] Updating scoring settings:`, newSettings);
      set({ scoringSettings: newSettings });
      
      // Get tournament operations from tournament store
      const { currentTournament, updateTournament } = useTournamentStore.getState();
      
      if (currentTournament) {
        const updatedTournament = {
          ...currentTournament,
          scoringSettings: newSettings,
          updatedAt: new Date()
        };
        updateTournament(updatedTournament);
      }
    },
    
    handleBackToCourts: () => {
      set({ activeView: "courts" });
    }
  };
});
