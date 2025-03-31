
import { useState, useCallback } from "react";
import { Match, Court } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { getDefaultScoringSettings } from "@/utils/matchUtils";
import { useScoringState } from "./useScoringState";
import { useScoringActions } from "./useScoringActions";

export const useScoringLogic = () => {
  console.log("[DEBUG] Initializing useScoringLogic hook");
  
  const { currentTournament } = useTournament();
  
  console.log("[DEBUG] Current tournament in scoring logic:", currentTournament?.id);
  
  // Get scoring settings from tournament
  const scoringSettings = currentTournament?.scoringSettings || getDefaultScoringSettings();
  
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
  
  // Court selection handler - memoize to prevent recreation on every render
  const handleSelectCourt = useCallback((court: Court) => {
    state.setSelectedCourt(court);
    if (court.currentMatch) {
      actions.handleSelectMatch(court.currentMatch);
    }
  }, [actions, state]);
  
  // Go back to courts view - also memoized
  const handleBackToCourts = useCallback(() => {
    state.setActiveView("courts");
  }, [state]);

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
