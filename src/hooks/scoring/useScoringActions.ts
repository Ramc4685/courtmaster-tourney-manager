import { useCallback } from "react";
import { Match, Court } from "@/types/tournament";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useToast } from "@/hooks/use-toast";
import { isSetComplete, isMatchComplete } from "@/utils/matchUtils";

export const useScoringActions = (state: any) => {
  const {
    currentTournament,
    selectedMatch,
    selectedMatchRef,
    currentSet,
    scoringSettings,
    safeSetSelectedMatch,
    setCurrentSet,
    setActiveView,
    setNewSetDialogOpen,
    setCompleteMatchDialogOpen
  } = state;
  
  const { toast } = useToast();
  const { 
    updateMatchScore, 
    updateMatchStatus, 
    completeMatch, 
    updateTournament 
  } = useTournament();
  
  // To prevent infinite loops
  let isUpdatingState = false;
  
  // Safe setState wrapper to prevent infinite loops
  const safeSetState = (callback: () => void) => {
    if (isUpdatingState) return;
    isUpdatingState = true;
    
    // Break the rendering chain with setTimeout
    setTimeout(() => {
      callback();
      isUpdatingState = false;
    }, 0);
  };
  
  // Handle selecting a match
  const handleSelectMatch = useCallback((match: Match) => {
    if (!match) {
      console.error('[ERROR] Cannot select match: Match is null or undefined');
      return;
    }
    
    // Get the latest version of the match from the tournament
    if (!currentTournament) {
      console.error('[ERROR] Cannot select match: No current tournament selected.');
      return;
    }
    
    console.log(`[DEBUG] Selecting match: ${match.id}`);
    const latestMatch = currentTournament.matches.find(m => m.id === match.id) || match;
    
    // Set the current set to the last set with scores, or 0 if no sets
    const scores = Array.isArray(latestMatch.scores) ? latestMatch.scores : [];
    const setIndex = scores.length > 0 ? scores.length - 1 : 0;
    console.log(`[DEBUG] Setting current set to ${setIndex}`);
    
    safeSetState(() => {
      safeSetSelectedMatch(latestMatch);
      setCurrentSet(setIndex);
      setActiveView("scoring");
    });
  }, [currentTournament, safeSetSelectedMatch, setCurrentSet, setActiveView]);
  
  // Handle selecting a court
  const handleSelectCourt = useCallback((court: Court) => {
    if (!court) return;
    
    console.log(`[DEBUG] Selecting court: #${court.number}`);
    
    safeSetState(() => {
      state.setSelectedCourt(court);
      if (court.currentMatch) {
        console.log(`[DEBUG] Court has active match`);
        handleSelectMatch(court.currentMatch);
      }
    });
  }, [handleSelectMatch, state]);
  
  // Handle score changes
  const handleScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    if (!selectedMatch || !currentTournament) {
      console.error('[ERROR] Cannot update score: No match selected or no current tournament.');
      return;
    }

    // Make sure we have the latest match from context
    const latestMatch = currentTournament.matches.find(m => m.id === selectedMatch.id);
    if (!latestMatch) {
      console.error(`[ERROR] Match not found in current tournament: ${selectedMatch.id}`);
      return;
    }

    console.log(`[DEBUG] Updating score for ${team}`);
    
    // Ensure scores array is initialized - make a defensive copy
    const scores = Array.isArray(latestMatch.scores) ? [...latestMatch.scores] : [];
    if (scores.length === 0) {
      console.log(`[DEBUG] No scores found, initializing with 0-0`);
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Make sure the current set exists in scores
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Update the appropriate team's score
    const currentScore = scores[currentSet] || { team1Score: 0, team2Score: 0 };
    let team1Score = currentScore.team1Score || 0;
    let team2Score = currentScore.team2Score || 0;
    
    if (team === "team1") {
      team1Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team1Score + 1) 
        : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team2Score + 1) 
        : Math.max(0, team2Score - 1);
    }
    
    // Update match score in tournament context
    console.log(`[DEBUG] Calling updateMatchScore: scores=${team1Score}-${team2Score}`);
    updateMatchScore(selectedMatch.id, currentSet, team1Score, team2Score);

    // Update our local selected match with new scores
    // Create completely new array and objects to avoid reference issues
    const updatedScores = Array.isArray(selectedMatch.scores) ? [...selectedMatch.scores] : [];
    while (updatedScores.length <= currentSet) {
      updatedScores.push({ team1Score: 0, team2Score: 0 });
    }
    updatedScores[currentSet] = { team1Score, team2Score };
    
    // Create an entirely new match object to avoid reference issues
    const updatedMatch = {
      ...selectedMatch,
      scores: updatedScores
    };
    
    // Use safe setter to update match
    safeSetSelectedMatch(updatedMatch);

    // Check if this set is complete based on rules
    const setComplete = isSetComplete(team1Score, team2Score, scoringSettings);
    
    if (setComplete) {
      // Check if match is complete
      const matchComplete = isMatchComplete(updatedMatch, scoringSettings);
      
      if (matchComplete) {
        // Break the rendering chain with setTimeout
        setTimeout(() => {
          setCompleteMatchDialogOpen(true);
        }, 100);
      } else {
        // Ask for confirmation to start a new set
        setTimeout(() => {
          setNewSetDialogOpen(true);
        }, 100);
      }
    }
  }, [
    currentTournament, 
    selectedMatch, 
    currentSet, 
    scoringSettings, 
    updateMatchScore, 
    safeSetSelectedMatch,
    setCompleteMatchDialogOpen,
    setNewSetDialogOpen
  ]);
  
  // Rest of the actions (simplified)
  const handleStartMatch = useCallback((match: Match) => {
    if (!match || !match.courtNumber) {
      toast({
        title: "Court assignment required",
        description: "A match must be assigned to a court before it can start.",
        variant: "destructive"
      });
      return;
    }
    
    updateMatchStatus(match.id, "IN_PROGRESS");
    
    // Break the potential update chain
    setTimeout(() => {
      handleSelectMatch(match);
    }, 100);
  }, [toast, updateMatchStatus, handleSelectMatch]);
  
  const handleCompleteMatch = useCallback(() => {
    if (!selectedMatchRef.current) {
      console.error('[ERROR] Cannot complete match: No match selected.');
      return;
    }
    
    completeMatch(selectedMatchRef.current.id);
    toast({
      title: "Match completed",
      description: "The match has been marked as complete."
    });
    
    // Clear selected match and return to courts view with timeout
    setTimeout(() => {
      safeSetSelectedMatch(null);
      setActiveView("courts");
      setCompleteMatchDialogOpen(false);
    }, 100);
  }, [
    selectedMatchRef,
    completeMatch,
    toast,
    safeSetSelectedMatch,
    setActiveView,
    setCompleteMatchDialogOpen
  ]);
  
  const handleNewSet = useCallback(() => {
    if (!selectedMatchRef.current) {
      console.error('[ERROR] Cannot create new set: No match selected.');
      return;
    }
    
    // Calculate the new set index
    const scores = Array.isArray(selectedMatchRef.current.scores) ? selectedMatchRef.current.scores : [];
    const newSetIndex = scores.length || 0;
    
    if (newSetIndex >= scoringSettings.maxSets) {
      toast({
        title: "Maximum sets reached",
        description: `This match is limited to ${scoringSettings.maxSets} sets.`
      });
      return;
    }
    
    // Initialize a new set with 0-0 score
    updateMatchScore(selectedMatchRef.current.id, newSetIndex, 0, 0);
    
    // First close the dialog
    setNewSetDialogOpen(false);
    
    // Update our local selected match to reflect the new set
    setTimeout(() => {
      const updatedScores = Array.isArray(selectedMatchRef.current?.scores) 
        ? [...selectedMatchRef.current.scores, { team1Score: 0, team2Score: 0 }]
        : [{ team1Score: 0, team2Score: 0 }];
      
      const updatedMatch = {
        ...selectedMatchRef.current,
        scores: updatedScores
      };
      
      safeSetSelectedMatch(updatedMatch);
      
      setTimeout(() => {
        setCurrentSet(newSetIndex);
        
        toast({
          title: "New set started",
          description: `Set ${newSetIndex + 1} has been started.`
        });
      }, 50);
    }, 50);
  }, [
    selectedMatchRef,
    scoringSettings,
    updateMatchScore,
    toast,
    safeSetSelectedMatch,
    setNewSetDialogOpen,
    setCurrentSet
  ]);
  
  const handleUpdateScoringSettings = useCallback((newSettings) => {
    if (!currentTournament) return;
    
    const { id, ...rest } = currentTournament;
    const updatedTournament = {
      ...rest,
      scoringSettings: newSettings,
      updatedAt: new Date()
    };
    
    updateTournament(id, updatedTournament);
  }, [currentTournament, updateTournament]);
  
  const handleBackToCourts = useCallback(() => {
    setActiveView("courts");
  }, [setActiveView]);

  return {
    handleSelectMatch,
    handleSelectCourt,
    handleScoreChange,
    handleStartMatch,
    handleCompleteMatch,
    handleNewSet,
    handleUpdateScoringSettings,
    handleBackToCourts
  };
};
