
import { useTournament } from "@/contexts/TournamentContext";
import { Court, Match } from "@/types/tournament";
import { useScoringState } from "./useScoringState";
import { useScoringActions } from "./useScoringActions";

export const useScoringLogic = () => {
  const { currentTournament } = useTournament();
  
  // Get scoring settings from tournament
  const scoringSettings = currentTournament?.scoringSettings;
  
  // Use the state hook
  const state = useScoringState(scoringSettings);
  
  // Use the actions hook
  const actions = useScoringActions(
    state.selectedMatch,
    state.currentSet,
    state.scoringSettings,
    state.setNewSetDialogOpen,
    state.setCompleteMatchDialogOpen,
    state.setActiveView,
    state.setCurrentSet,
    state.setSelectedMatch
  );
  
  // Court selection handler
  const handleSelectCourt = (court: Court) => {
    state.setSelectedCourt(court);
    if (court.currentMatch) {
      actions.handleSelectMatch(court.currentMatch);
    }
  };
  
  // Go back to courts view
  const handleBackToCourts = () => {
    state.setActiveView("courts");
  };

  return {
    // State
    currentTournament,
    selectedMatch: state.selectedMatch,
    selectedCourt: state.selectedCourt,
    currentSet: state.currentSet,
    settingsOpen: state.settingsOpen,
    activeView: state.activeView,
    scoringSettings: state.scoringSettings,
    newSetDialogOpen: state.newSetDialogOpen,
    completeMatchDialogOpen: state.completeMatchDialogOpen,
    
    // State setters
    setCurrentSet: state.setCurrentSet,
    setSettingsOpen: state.setSettingsOpen,
    setNewSetDialogOpen: state.setNewSetDialogOpen,
    setCompleteMatchDialogOpen: state.setCompleteMatchDialogOpen,
    
    // Actions
    handleSelectMatch: actions.handleSelectMatch,
    handleSelectCourt,
    handleScoreChange: actions.handleScoreChange,
    handleStartMatch: actions.handleStartMatch,
    handleCompleteMatch: actions.handleCompleteMatch,
    handleNewSet: actions.handleNewSet,
    handleUpdateScoringSettings: actions.handleUpdateScoringSettings,
    handleBackToCourts
  };
};
