
import { useEffect, useRef, useState } from "react";
import { useScoringState } from "./useScoringState";
import { useScoringActions } from "./useScoringActions";

export const useScoringLogic = () => {
  console.log("[DEBUG] Initializing useScoringLogic hook");
  
  // Prevent initialization logs from running every render
  const isInitialRender = useRef(true);
  const isProcessing = useRef(false);
  
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

  // Wrap state updates in refs to prevent infinite loops
  const safeSetCurrentSet = (set: number) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => {
      state.setCurrentSet(set);
      isProcessing.current = false;
    }, 0);
  };

  const safeSetSettingsOpen = (open: boolean) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => {
      state.setSettingsOpen(open);
      isProcessing.current = false;
    }, 0);
  };

  const safeSetNewSetDialogOpen = (open: boolean) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => {
      state.setNewSetDialogOpen(open);
      isProcessing.current = false;
    }, 0);
  };

  const safeSetCompleteMatchDialogOpen = (open: boolean) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => {
      state.setCompleteMatchDialogOpen(open);
      isProcessing.current = false;
    }, 0);
  };

  const safeSetActiveView = (view: "courts" | "scoring") => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => {
      state.setActiveView(view);
      isProcessing.current = false;
    }, 0);
  };

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
    
    // Safe state setters
    setCurrentSet: safeSetCurrentSet,
    setSettingsOpen: safeSetSettingsOpen,
    setNewSetDialogOpen: safeSetNewSetDialogOpen,
    setCompleteMatchDialogOpen: safeSetCompleteMatchDialogOpen,
    setActiveView: safeSetActiveView,
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
