
import { useState, useEffect } from "react";
import { Match, Court, Tournament, ScoringSettings } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { isSetComplete, isMatchComplete, getDefaultScoringSettings } from "@/utils/matchUtils";

export const useScoringLogic = () => {
  console.log("[DEBUG] Initializing useScoringLogic hook");
  
  const { 
    currentTournament, 
    updateMatchScore, 
    updateMatchStatus, 
    completeMatch, 
    updateTournament 
  } = useTournament();
  
  console.log("[DEBUG] Current tournament in scoring logic:", currentTournament?.id);
  
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"courts" | "scoring">("courts");
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Get scoring settings from tournament or use defaults
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(
    currentTournament?.scoringSettings || getDefaultScoringSettings()
  );
  
  // Update scoring settings when tournament changes
  useEffect(() => {
    if (currentTournament?.scoringSettings) {
      console.log('[DEBUG] Updating scoring settings from tournament:', currentTournament.scoringSettings);
      setScoringSettings(currentTournament.scoringSettings);
    }
  }, [currentTournament]);

  const handleSelectMatch = (match: Match) => {
    // Get the latest version of the match from the tournament
    if (!currentTournament) {
      console.error('[ERROR] Cannot select match: No current tournament selected.');
      return;
    }
    
    console.log(`[DEBUG] Selecting match: ${match.id} (${match.team1.name} vs ${match.team2.name})`);
    const latestMatch = currentTournament.matches.find(m => m.id === match.id) || match;
    setSelectedMatch(latestMatch);
    
    const setIndex = latestMatch.scores.length > 0 ? latestMatch.scores.length - 1 : 0;
    console.log(`[DEBUG] Setting current set to ${setIndex}`);
    setCurrentSet(setIndex);
    setActiveView("scoring");
  };

  const handleSelectCourt = (court: Court) => {
    console.log(`[DEBUG] Selecting court: #${court.number} (${court.name || 'Unnamed'})`);
    setSelectedCourt(court);
    if (court.currentMatch) {
      console.log(`[DEBUG] Court has active match, selecting match: ${court.currentMatch.id}`);
      handleSelectMatch(court.currentMatch);
    } else {
      console.log(`[DEBUG] Court has no active match.`);
    }
  };

  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
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
    
    let scores = [...latestMatch.scores];
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
    
    // Call the updateMatchScore with all required parameters
    console.log(`[DEBUG] Calling updateMatchScore: match=${selectedMatch.id}, set=${currentSet}, scores=${team1Score}-${team2Score}`);
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
    setSelectedMatch(updatedMatch);

    // Check if this set is complete based on rules
    const setComplete = isSetComplete(team1Score, team2Score, scoringSettings);
    console.log(`[DEBUG] Is set complete? ${setComplete ? 'Yes' : 'No'}`);
    
    if (setComplete) {
      // Check if match is complete (e.g., best of 3 sets with 2 sets won)
      const matchComplete = isMatchComplete(updatedMatch, scoringSettings);
      console.log(`[DEBUG] Is match complete? ${matchComplete ? 'Yes' : 'No'}`);
      
      if (matchComplete) {
        console.log(`[DEBUG] Match is complete, showing complete match dialog`);
        setCompleteMatchDialogOpen(true);
      } else {
        // Ask for confirmation to start a new set
        console.log(`[DEBUG] Set is complete but match is not, showing new set dialog`);
        setNewSetDialogOpen(true);
      }
    }
  };

  const handleStartMatch = (match: Match) => {
    if (!match.courtNumber) {
      console.warn(`[WARN] Cannot start match ${match.id}: No court assigned`);
      toast({
        title: "Court assignment required",
        description: "A match must be assigned to a court before it can start.",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`[DEBUG] Starting match: ${match.id} (${match.team1.name} vs ${match.team2.name})`);
    updateMatchStatus(match.id, "IN_PROGRESS");
    handleSelectMatch(match);
    toast({
      title: "Match started",
      description: "The match has been started and is now in progress."
    });
  };

  const handleCompleteMatch = () => {
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
    setSelectedMatch(null);
    setActiveView("courts");
    setCompleteMatchDialogOpen(false);
  };

  const handleNewSet = () => {
    if (!selectedMatch) {
      console.error('[ERROR] Cannot create new set: No match selected.');
      return;
    }
    
    const newSetIndex = selectedMatch.scores.length;
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
    
    // Update our local selected match to reflect the new set
    const updatedScores = [...selectedMatch.scores, { team1Score: 0, team2Score: 0 }];
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
  };
  
  const handleUpdateScoringSettings = (newSettings: ScoringSettings) => {
    console.log(`[DEBUG] Updating scoring settings:`, newSettings);
    // Update local state
    setScoringSettings(newSettings);
    
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
  };

  const handleBackToCourts = () => {
    console.log(`[DEBUG] Navigating back to courts view`);
    setActiveView("courts");
  };

  return {
    currentTournament,
    selectedMatch,
    selectedCourt,
    currentSet,
    settingsOpen,
    activeView,
    scoringSettings,
    newSetDialogOpen,
    completeMatchDialogOpen,
    setCurrentSet,
    setSettingsOpen,
    setNewSetDialogOpen,
    setCompleteMatchDialogOpen,
    handleSelectMatch,
    handleSelectCourt,
    handleScoreChange: handleScoreChange,
    handleStartMatch: handleStartMatch,
    handleCompleteMatch: handleCompleteMatch,
    handleNewSet: handleNewSet,
    handleUpdateScoringSettings: handleUpdateScoringSettings,
    handleBackToCourts: handleBackToCourts
  };
};
