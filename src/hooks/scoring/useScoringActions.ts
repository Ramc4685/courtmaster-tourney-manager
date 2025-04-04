
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
    
    console.log(`[DEBUG] Selecting match: ${match.id} (${match.team1.name} vs ${match.team2.name})`);
    const latestMatch = currentTournament.matches.find(m => m.id === match.id) || match;
    
    // Set the current set to the last set with scores, or 0 if no sets
    const scores = Array.isArray(latestMatch.scores) ? latestMatch.scores : [];
    const setIndex = scores.length > 0 ? scores.length - 1 : 0;
    console.log(`[DEBUG] Setting current set to ${setIndex}`);
    
    safeSetSelectedMatch(latestMatch);
    setCurrentSet(setIndex);
    setActiveView("scoring");
  }, [currentTournament, safeSetSelectedMatch, setCurrentSet, setActiveView]);
  
  // Handle selecting a court
  const handleSelectCourt = useCallback((court: Court) => {
    if (!court) return;
    
    console.log(`[DEBUG] Selecting court: #${court.number} (${court.name || 'Unnamed'})`);
    state.setSelectedCourt(court);
    if (court.currentMatch) {
      console.log(`[DEBUG] Court has active match, selecting match: ${court.currentMatch.id}`);
      handleSelectMatch(court.currentMatch);
    } else {
      console.log(`[DEBUG] Court has no active match.`);
    }
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

    console.log(`[DEBUG] Updating score for ${team} (${increment ? 'increment' : 'decrement'}) for set ${currentSet}`);
    
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
    console.log(`[DEBUG] Calling updateMatchScore: match=${selectedMatch.id}, set=${currentSet}, scores=${team1Score}-${team2Score}`);
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
        }, 0);
      } else {
        // Ask for confirmation to start a new set
        setTimeout(() => {
          setNewSetDialogOpen(true);
        }, 0);
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
  
  // Start a match
  const handleStartMatch = useCallback((match: Match) => {
    if (!match || !match.courtNumber) {
      toast({
        title: "Court assignment required",
        description: "A match must be assigned to a court before it can start.",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`[DEBUG] Starting match: ${match.id} (${match.team1.name} vs ${match.team2.name})`);
    updateMatchStatus(match.id, "IN_PROGRESS");
    
    // Break the potential update chain
    setTimeout(() => {
      handleSelectMatch(match);
    }, 0);
    
    toast({
      title: "Match started",
      description: "The match has been started and is now in progress."
    });
  }, [toast, updateMatchStatus, handleSelectMatch]);
  
  // Complete a match
  const handleCompleteMatch = useCallback(() => {
    if (!selectedMatchRef.current) {
      console.error('[ERROR] Cannot complete match: No match selected.');
      return;
    }
    
    console.log(`[DEBUG] Completing match: ${selectedMatchRef.current.id}`);
    completeMatch(selectedMatchRef.current.id);
    toast({
      title: "Match completed",
      description: "The match has been marked as complete."
    });
    
    // Clear selected match and return to courts view with setTimeout to break update chain
    setTimeout(() => {
      safeSetSelectedMatch(null);
      setActiveView("courts");
      setCompleteMatchDialogOpen(false);
    }, 0);
  }, [
    selectedMatchRef,
    completeMatch,
    toast,
    safeSetSelectedMatch,
    setActiveView,
    setCompleteMatchDialogOpen
  ]);
  
  // Create a new set
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
    console.log(`[DEBUG] Initializing new set ${newSetIndex} with score 0-0`);
    updateMatchScore(selectedMatchRef.current.id, newSetIndex, 0, 0);
    
    // First close the dialog, then update the match and set with timeouts
    setNewSetDialogOpen(false);
    
    // Use setTimeout to break the potential state update chain
    setTimeout(() => {
      // Update our local selected match to reflect the new set
      const updatedScores = Array.isArray(selectedMatchRef.current?.scores) 
        ? [...selectedMatchRef.current.scores, { team1Score: 0, team2Score: 0 }]
        : [{ team1Score: 0, team2Score: 0 }];
      
      const updatedMatch = {
        ...selectedMatchRef.current,
        scores: updatedScores
      };
      
      safeSetSelectedMatch(updatedMatch);
      
      // Use another setTimeout to ensure this happens after match update
      setTimeout(() => {
        setCurrentSet(newSetIndex);
        
        toast({
          title: "New set started",
          description: `Set ${newSetIndex + 1} has been started.`
        });
      }, 0);
    }, 0);
  }, [
    selectedMatchRef,
    scoringSettings,
    updateMatchScore,
    toast,
    safeSetSelectedMatch,
    setNewSetDialogOpen,
    setCurrentSet
  ]);
  
  // Update scoring settings
  const handleUpdateScoringSettings = useCallback((newSettings) => {
    console.log(`[DEBUG] Updating scoring settings:`, newSettings);
    
    // Update tournament settings
    if (currentTournament) {
      console.log(`[DEBUG] Saving scoring settings to tournament ${currentTournament.id}`);
      const updatedTournament = {
        ...currentTournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      updateTournament(updatedTournament);
    }
  }, [currentTournament, updateTournament]);
  
  // Go back to courts view
  const handleBackToCourts = useCallback(() => {
    console.log(`[DEBUG] Navigating back to courts view`);
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
