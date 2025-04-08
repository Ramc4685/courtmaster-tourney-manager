import { useEffect, useRef, useState, useCallback } from "react";
import { useScoringState } from "./useScoringState";
import { useScoringActions } from "./useScoringActions";
import { useParams } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/useTournament";
import { Match } from "@/types/tournament";

export const useScoringLogic = () => {
  console.log("[DEBUG] Initializing useScoringLogic hook");
  
  // Get route params to support direct navigation to a match
  const { matchId } = useParams<{ matchId: string }>();
  const { currentTournament } = useTournament();
  
  // Prevent initialization logs from running every render
  const isInitialRender = useRef(true);
  const isProcessing = useRef(false);
  
  // Get state management
  const state = useScoringState();

  // Match-specific handlers
  const onScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    if (!state.selectedMatch) return;
    state.handleScoreChange(team, increment);
  }, [state]);

  const onNewSet = useCallback(() => {
    if (!state.selectedMatch) return;
    state.handleNewSet();
  }, [state]);

  const onCompleteMatch = useCallback(() => {
    if (!state.selectedMatch) return;
    state.handleCompleteMatch();
  }, [state]);
  
  // Get actions with the proper dependencies
  const actions = useScoringActions({
    match: state.selectedMatch,
    currentSet: state.currentSet,
    scoringSettings: state.scoringSettings,
    onScoreChange,
    onNewSet,
    onCompleteMatch
  });
  
  // If we have a matchId param, select that match when the component loads
  useEffect(() => {
    if (matchId && currentTournament?.matches) {
      console.log("[DEBUG] Found matchId in URL params:", matchId);
      const match = currentTournament.matches.find(m => m.id === matchId);
      
      if (match) {
        console.log("[DEBUG] Found match, selecting it:", match.id);
        setTimeout(() => {
          state.handleSelectMatch(match);
        }, 100);
      } else {
        console.log("[DEBUG] Match not found with ID:", matchId);
      }
    }
  }, [matchId, currentTournament, state]);
  
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

  // Combine the state and actions into a single API
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
    
    // From state
    setSelectedMatch: state.setSelectedMatch,
    setSelectedCourt: state.setSelectedCourt,
    
    // Action handlers
    handleSelectMatch: state.handleSelectMatch,
    handleSelectCourt: state.handleSelectCourt,
    handleScoreChange: state.handleScoreChange,
    handleStartMatch: state.handleStartMatch,
    handleNewSet: state.handleNewSet,
    handleCompleteMatch: state.handleCompleteMatch,
    
    // Score increment/decrement handlers from useScoringActions
    handleIncrementScore: actions.handleIncrementScore,
    handleDecrementScore: actions.handleDecrementScore,
    isSetFinished: actions.isSetFinished,
    isMatchFinished: actions.isMatchFinished,
    
    // Other handlers from state
    handleUpdateScoringSettings: state.handleUpdateScoringSettings,
    handleBackToCourts: state.handleBackToCourts
  };
};
