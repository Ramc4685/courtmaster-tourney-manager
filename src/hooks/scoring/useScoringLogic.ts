
import { useState, useCallback, useEffect, useRef } from "react";
import { Match, Court } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { getDefaultScoringSettings } from "@/utils/matchUtils";
import { isSetComplete, isMatchComplete } from "@/utils/matchUtils";

export const useScoringLogic = () => {
  console.log("[DEBUG] Initializing useScoringLogic hook");
  
  const { currentTournament, updateMatchScore, updateMatchStatus, completeMatch, updateTournament } = useTournament();
  const { toast } = useToast();
  
  // Prevent initialization logs from running every render
  const isInitialRender = useRef(true);
  const isUpdatingMatch = useRef(false);

  if (isInitialRender.current) {
    console.log("[DEBUG] Current tournament in scoring logic:", currentTournament?.id);
    isInitialRender.current = false;
  }
  
  // Get scoring settings from tournament
  const scoringSettings = currentTournament?.scoringSettings || getDefaultScoringSettings();
  
  // State management
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"courts" | "scoring">("courts");
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Safely update the selected match to prevent infinite loops
  const safeSetSelectedMatch = useCallback((match: Match | null) => {
    if (isUpdatingMatch.current) return;
    isUpdatingMatch.current = true;
    
    // Use setTimeout to break the potential update chain
    setTimeout(() => {
      setSelectedMatch(match);
      isUpdatingMatch.current = false;
    }, 0);
  }, []);
  
  // Handle selecting a match - wrapped in useCallback with stable dependencies
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
    const scores = latestMatch.scores || [];
    const setIndex = scores.length > 0 ? scores.length - 1 : 0;
    console.log(`[DEBUG] Setting current set to ${setIndex}`);
    
    safeSetSelectedMatch(latestMatch);
    setCurrentSet(setIndex);
    setActiveView("scoring");
  }, [currentTournament, safeSetSelectedMatch]);
  
  // Handle selecting a court - wrapped in useCallback with stable dependencies
  const handleSelectCourt = useCallback((court: Court) => {
    if (!court) return;
    
    console.log(`[DEBUG] Selecting court: #${court.number} (${court.name || 'Unnamed'})`);
    setSelectedCourt(court);
    if (court.currentMatch) {
      console.log(`[DEBUG] Court has active match, selecting match: ${court.currentMatch.id}`);
      handleSelectMatch(court.currentMatch);
    } else {
      console.log(`[DEBUG] Court has no active match.`);
    }
  }, [handleSelectMatch]);
  
  // Handle score changes - wrapped in useCallback with properly managed dependencies
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
    let scores = Array.isArray(latestMatch.scores) ? [...latestMatch.scores] : [];
    if (scores.length === 0) {
      console.log(`[DEBUG] No scores found, initializing with 0-0`);
      scores = [{ team1Score: 0, team2Score: 0 }];
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
        ? Math.min(scoringSettings.maxPoints + 10, team1Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, team1Score - 1);
      console.log(`[DEBUG] Updated team1 score: ${currentScore.team1Score} -> ${team1Score}`);
    } else {
      team2Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team2Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, team2Score - 1);
      console.log(`[DEBUG] Updated team2 score: ${currentScore.team2Score} -> ${team2Score}`);
    }
    
    // Update match score in tournament context
    console.log(`[DEBUG] Calling updateMatchScore: match=${selectedMatch.id}, set=${currentSet}, scores=${team1Score}-${team2Score}`);
    updateMatchScore(selectedMatch.id, currentSet, team1Score, team2Score);

    // Update our local selected match to reflect the new score immediately using a new object
    // Rather than directly modifying the existing scores array, create a new array
    const updatedScores = Array.isArray(selectedMatch.scores) ? [...selectedMatch.scores] : [];
    while (updatedScores.length <= currentSet) {
      updatedScores.push({ team1Score: 0, team2Score: 0 });
    }
    updatedScores[currentSet] = { team1Score, team2Score };
    
    // Create an entirely new match object to avoid mutation issues
    const updatedMatch = {
      ...selectedMatch,
      scores: updatedScores
    };
    
    // Use our safe setter with setTimeout to avoid update loops
    safeSetSelectedMatch(updatedMatch);

    // Check if this set is complete based on rules
    const setComplete = isSetComplete(team1Score, team2Score, scoringSettings);
    console.log(`[DEBUG] Is set complete? ${setComplete ? 'Yes' : 'No'}`);
    
    if (setComplete) {
      // Check if match is complete (e.g., best of 3 sets with 2 sets won)
      const matchComplete = isMatchComplete(updatedMatch, scoringSettings);
      console.log(`[DEBUG] Is match complete? ${matchComplete ? 'Yes' : 'No'}`);
      
      if (matchComplete) {
        console.log(`[DEBUG] Match is complete, showing complete match dialog`);
        // Break the rendering chain with setTimeout
        setTimeout(() => {
          setCompleteMatchDialogOpen(true);
        }, 0);
      } else {
        // Ask for confirmation to start a new set
        console.log(`[DEBUG] Set is complete but match is not, showing new set dialog`);
        // Break the rendering chain with setTimeout
        setTimeout(() => {
          setNewSetDialogOpen(true);
        }, 0);
      }
    }
  }, [currentTournament, selectedMatch, currentSet, scoringSettings, updateMatchScore, safeSetSelectedMatch]);
  
  // Start a match - wrapped in useCallback with stable dependencies
  const handleStartMatch = useCallback((match: Match) => {
    if (!match || !match.courtNumber) {
      console.warn(`[WARN] Cannot start match: No court assigned`);
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
  
  // Complete a match - wrapped in useCallback with stable dependencies
  const handleCompleteMatch = useCallback(() => {
    if (!selectedMatch) {
      console.error('[ERROR] Cannot complete match: No match selected.');
      return;
    }
    
    console.log(`[DEBUG] Completing match: ${selectedMatch.id}`);
    completeMatch(selectedMatch.id);
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
  }, [selectedMatch, completeMatch, toast, safeSetSelectedMatch]);
  
  // Create a new set - wrapped in useCallback with stable dependencies
  const handleNewSet = useCallback(() => {
    if (!selectedMatch) {
      console.error('[ERROR] Cannot create new set: No match selected.');
      return;
    }
    
    // Calculate the new set index
    const scores = Array.isArray(selectedMatch.scores) ? selectedMatch.scores : [];
    const newSetIndex = scores.length || 0;
    console.log(`[DEBUG] Creating new set ${newSetIndex + 1} for match ${selectedMatch.id}`);
    
    if (newSetIndex >= scoringSettings.maxSets) {
      console.warn(`[WARN] Maximum sets (${scoringSettings.maxSets}) reached for match ${selectedMatch.id}`);
      toast({
        title: "Maximum sets reached",
        description: `This match is limited to ${scoringSettings.maxSets} sets.`
      });
      return;
    }
    
    // Initialize a new set with 0-0 score
    console.log(`[DEBUG] Initializing new set ${newSetIndex} with score 0-0`);
    updateMatchScore(selectedMatch.id, newSetIndex, 0, 0);
    
    // First close the dialog, then update the match and set with timeouts
    setNewSetDialogOpen(false);
    
    // Use setTimeout to break the potential state update chain
    setTimeout(() => {
      // Update our local selected match to reflect the new set
      const updatedScores = Array.isArray(selectedMatch.scores) 
        ? [...selectedMatch.scores, { team1Score: 0, team2Score: 0 }]
        : [{ team1Score: 0, team2Score: 0 }];
      
      const updatedMatch = {
        ...selectedMatch,
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
  }, [selectedMatch, scoringSettings, updateMatchScore, toast, safeSetSelectedMatch]);
  
  // Update scoring settings - wrapped in useCallback with stable dependencies
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
    } else {
      console.warn('[WARN] Cannot save scoring settings: No current tournament.');
    }
  }, [currentTournament, updateTournament]);
  
  // Go back to courts view - wrapped in useCallback
  const handleBackToCourts = useCallback(() => {
    console.log(`[DEBUG] Navigating back to courts view`);
    setActiveView("courts");
  }, []);

  return {
    // State
    currentTournament,
    selectedMatch,
    selectedCourt,
    currentSet,
    settingsOpen,
    activeView,
    scoringSettings,
    newSetDialogOpen,
    completeMatchDialogOpen,
    
    // State setters
    setCurrentSet,
    setSettingsOpen,
    setNewSetDialogOpen,
    setCompleteMatchDialogOpen,
    setActiveView,
    setSelectedMatch: safeSetSelectedMatch,
    setSelectedCourt,
    
    // Actions
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
