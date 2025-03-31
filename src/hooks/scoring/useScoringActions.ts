
import { ScoringSettings, Match } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { isSetComplete, isMatchComplete } from "@/utils/matchUtils";
import { useCallback } from "react";

// This hook contains the actions for the scoring interface
export const useScoringActions = (
  selectedMatch: Match | null,
  currentSet: number,
  scoringSettings: ScoringSettings,
  setNewSetDialogOpen: (open: boolean) => void,
  setCompleteMatchDialogOpen: (open: boolean) => void,
  setActiveView: (view: "courts" | "scoring") => void,
  setCurrentSet: (set: number) => void,
  setSelectedMatch: (match: Match | null) => void
) => {
  console.log("[DEBUG] Initializing useScoringActions hook");
  
  const { 
    currentTournament, 
    updateMatchScore, 
    updateMatchStatus, 
    completeMatch, 
    updateTournament 
  } = useTournament();
  
  const { toast } = useToast();

  // Use useCallback to memoize functions to prevent re-creation on every render
  const handleSelectMatch = useCallback((match: Match | null) => {
    if (!match) {
      console.error('[ERROR] Cannot select match: Match is null or undefined');
      return;
    }
    
    console.log(`[DEBUG] Selecting match: ${match.id} (${match.team1?.name || 'Team 1'} vs ${match.team2?.name || 'Team 2'})`);
    
    // Get the latest version of the match from the tournament
    if (currentTournament) {
      const latestMatch = currentTournament.matches.find(m => m.id === match.id) || match;
      setSelectedMatch(latestMatch);
      const setIndex = latestMatch.scores && latestMatch.scores.length > 0 ? latestMatch.scores.length - 1 : 0;
      setCurrentSet(setIndex);
    } else {
      // For standalone matches or when tournament isn't available
      console.log("[DEBUG] No current tournament, using provided match directly");
      setSelectedMatch(match);
      const setIndex = match.scores && match.scores.length > 0 ? match.scores.length - 1 : 0;
      setCurrentSet(setIndex);
    }
    
    setActiveView("scoring");
  }, [currentTournament, setActiveView, setCurrentSet, setSelectedMatch]);

  const handleScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    if (!selectedMatch) {
      console.error('[ERROR] Cannot update score: No match selected');
      return;
    }

    // Make sure scores is always an array
    const scores = Array.isArray(selectedMatch.scores) ? [...selectedMatch.scores] : [];
    
    // Initialize with empty score if needed
    if (scores.length === 0) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Ensure we have a valid current set
    const safeCurrentSet = Math.min(currentSet, scores.length - 1);
    
    // Get current score or create default
    const currentScore = scores[safeCurrentSet] || { team1Score: 0, team2Score: 0 };
    let team1Score = currentScore.team1Score || 0;
    let team2Score = currentScore.team2Score || 0;
    
    if (team === "team1") {
      team1Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team1Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team2Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, team2Score - 1);
    }
    
    // Call the updateMatchScore with all required parameters if in tournament context
    if (currentTournament && selectedMatch.tournamentId !== 'standalone') {
      updateMatchScore(selectedMatch.id, safeCurrentSet, team1Score, team2Score);
    }

    // Update our local selected match to reflect the new score immediately
    const updatedScores = [...scores];
    if (updatedScores.length <= safeCurrentSet) {
      while (updatedScores.length <= safeCurrentSet) {
        updatedScores.push({ team1Score: 0, team2Score: 0 });
      }
    }
    updatedScores[safeCurrentSet] = { team1Score, team2Score };
    
    const updatedMatch = {
      ...selectedMatch,
      scores: updatedScores
    };
    setSelectedMatch(updatedMatch);

    // Check if this set is complete based on badminton rules
    if (isSetComplete(team1Score, team2Score, scoringSettings)) {
      // Check if match is complete (e.g., best of 3 sets with 2 sets won)
      if (isMatchComplete(updatedMatch, scoringSettings)) {
        setCompleteMatchDialogOpen(true);
      } else {
        // Ask for confirmation to start a new set
        setNewSetDialogOpen(true);
      }
    }
  }, [currentSet, currentTournament, scoringSettings, selectedMatch, setCompleteMatchDialogOpen, setNewSetDialogOpen, setSelectedMatch, updateMatchScore]);

  const handleStartMatch = useCallback((match: Match) => {
    if (!match.courtNumber) {
      toast({
        title: "Court assignment required",
        description: "A match must be assigned to a court before it can start.",
        variant: "destructive"
      });
      return;
    }
    
    updateMatchStatus(match.id, "IN_PROGRESS");
    handleSelectMatch(match);
    toast({
      title: "Match started",
      description: "The match has been started and is now in progress."
    });
  }, [handleSelectMatch, toast, updateMatchStatus]);

  const handleCompleteMatch = useCallback(() => {
    if (!selectedMatch) return;
    completeMatch(selectedMatch.id);
    toast({
      title: "Match completed",
      description: "The match has been marked as complete."
    });
    setSelectedMatch(null);
    setActiveView("courts");
    setCompleteMatchDialogOpen(false);
  }, [completeMatch, selectedMatch, setActiveView, setCompleteMatchDialogOpen, setSelectedMatch, toast]);

  const handleNewSet = useCallback(() => {
    if (!selectedMatch) return;
    const newSetIndex = (selectedMatch.scores || []).length;
    
    if (newSetIndex >= scoringSettings.maxSets) {
      toast({
        title: "Maximum sets reached",
        description: `This match is limited to ${scoringSettings.maxSets} sets.`
      });
      return;
    }
    
    // Initialize a new set with 0-0 score
    updateMatchScore(selectedMatch.id, newSetIndex, 0, 0);
    
    // Update our local selected match to reflect the new set
    const updatedScores = [...(selectedMatch.scores || []), { team1Score: 0, team2Score: 0 }];
    const updatedMatch = {
      ...selectedMatch,
      scores: updatedScores
    };
    setSelectedMatch(updatedMatch);
    
    setCurrentSet(newSetIndex);
    setNewSetDialogOpen(false);
    
    toast({
      title: "New set started",
      description: `Set ${newSetIndex + 1} has been started.`
    });
  }, [scoringSettings.maxSets, selectedMatch, setCurrentSet, setNewSetDialogOpen, setSelectedMatch, toast, updateMatchScore]);
  
  const handleUpdateScoringSettings = useCallback((newSettings: ScoringSettings) => {
    // Update tournament settings
    if (currentTournament) {
      const updatedTournament = {
        ...currentTournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      updateTournament(updatedTournament);
    }
  }, [currentTournament, updateTournament]);

  return {
    handleSelectMatch,
    handleScoreChange,
    handleStartMatch: useCallback((match: Match) => {
      if (!match.courtNumber) {
        toast({
          title: "Court assignment required",
          description: "A match must be assigned to a court before it can start.",
          variant: "destructive"
        });
        return;
      }
      
      if (currentTournament) {
        updateMatchStatus(match.id, "IN_PROGRESS");
      }
      
      handleSelectMatch(match);
      
      toast({
        title: "Match started",
        description: "The match has been started and is now in progress."
      });
    }, [currentTournament, handleSelectMatch, toast, updateMatchStatus]),
    
    handleCompleteMatch: useCallback(() => {
      if (!selectedMatch) return;
      
      if (currentTournament && selectedMatch.tournamentId !== 'standalone') {
        completeMatch(selectedMatch.id);
      }
      
      toast({
        title: "Match completed",
        description: "The match has been marked as complete."
      });
      
      setSelectedMatch(null);
      setActiveView("courts");
      setCompleteMatchDialogOpen(false);
    }, [completeMatch, currentTournament, selectedMatch, setActiveView, setCompleteMatchDialogOpen, setSelectedMatch, toast]),
    
    handleNewSet: useCallback(() => {
      if (!selectedMatch) return;
      
      const scores = Array.isArray(selectedMatch.scores) ? selectedMatch.scores : [];
      const newSetIndex = scores.length;
      
      if (newSetIndex >= scoringSettings.maxSets) {
        toast({
          title: "Maximum sets reached",
          description: `This match is limited to ${scoringSettings.maxSets} sets.`
        });
        return;
      }
      
      // Initialize a new set with 0-0 score
      if (currentTournament && selectedMatch.tournamentId !== 'standalone') {
        updateMatchScore(selectedMatch.id, newSetIndex, 0, 0);
      }
      
      // Update our local selected match to reflect the new set
      const updatedScores = [...(selectedMatch.scores || []), { team1Score: 0, team2Score: 0 }];
      const updatedMatch = {
        ...selectedMatch,
        scores: updatedScores
      };
      setSelectedMatch(updatedMatch);
      
      setCurrentSet(newSetIndex);
      setNewSetDialogOpen(false);
      
      toast({
        title: "New set started",
        description: `Set ${newSetIndex + 1} has been started.`
      });
    }, [currentTournament, scoringSettings, selectedMatch, setCurrentSet, setNewSetDialogOpen, setSelectedMatch, toast, updateMatchScore]),
    
    handleUpdateScoringSettings: useCallback((newSettings: ScoringSettings) => {
      // Update tournament settings
      if (currentTournament) {
        const updatedTournament = {
          ...currentTournament,
          scoringSettings: newSettings,
          updatedAt: new Date()
        };
        updateTournament(updatedTournament);
      }
    }, [currentTournament, updateTournament])
  };
};
