
import { useEffect, useRef } from "react";
import { useScoringState } from "./useScoringState";
import { useScoringActions } from "./useScoringActions";

export const useScoringLogic = () => {
  console.log("[DEBUG] Initializing useScoringLogic hook");
  
  // Prevent initialization logs from running every render
  const isInitialRender = useRef(true);
  
  // Get state management
  const state = useScoringState();
  
  // Get actions
  const actions = useScoringActions(state);
  
  // Initial logging (only once)
  useEffect(() => {
    if (isInitialRender.current) {
      console.log("[DEBUG] Current tournament in scoring logic:", state.currentTournament?.id);
      isInitialRender.current = false;
    }
  }, [state.currentTournament]);

  return {
    // State
    currentTournament: state.currentTournament,
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
    setActiveView: state.setActiveView,
    setSelectedMatch: state.safeSetSelectedMatch,
    setSelectedCourt: state.setSelectedCourt,
    
    // Actions
    handleSelectMatch: actions.handleSelectMatch,
    handleSelectCourt: actions.handleSelectCourt,
    handleScoreChange: actions.handleScoreChange,
    handleStartMatch: actions.handleStartMatch,
    handleCompleteMatch: actions.handleCompleteMatch,
    handleNewSet: actions.handleNewSet,
    handleUpdateScoringSettings: actions.handleUpdateScoringSettings,
    handleBackToCourts: actions.handleBackToCourts
  };
};
