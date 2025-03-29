
import { ScoringSettings, Match } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { isSetComplete, isMatchComplete } from "@/utils/matchUtils";

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

  const handleSelectMatch = (match: Match) => {
    // Get the latest version of the match from the tournament
    if (!currentTournament) return;
    
    const latestMatch = currentTournament.matches.find(m => m.id === match.id) || match;
    setSelectedMatch(latestMatch);
    setCurrentSet(latestMatch.scores.length > 0 ? latestMatch.scores.length - 1 : 0);
    setActiveView("scoring");
  };

  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
    if (!selectedMatch || !currentTournament) return;

    // Make sure we have the latest match from context
    const latestMatch = currentTournament.matches.find(m => m.id === selectedMatch.id);
    if (!latestMatch) return;

    let scores = [...latestMatch.scores];
    if (scores.length === 0) {
      scores = [{ team1Score: 0, team2Score: 0 }];
    }
    
    const currentScore = scores[currentSet] || { team1Score: 0, team2Score: 0 };
    let team1Score = currentScore.team1Score;
    let team2Score = currentScore.team2Score;
    
    if (team === "team1") {
      team1Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team1Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment 
        ? Math.min(scoringSettings.maxPoints + 10, team2Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, team2Score - 1);
    }
    
    // Call the updateMatchScore with all required parameters
    updateMatchScore(selectedMatch.id, currentSet, team1Score, team2Score);

    // Update our local selected match to reflect the new score immediately
    const updatedScores = [...selectedMatch.scores];
    if (updatedScores.length <= currentSet) {
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
  };

  const handleStartMatch = (match: Match) => {
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
  };

  const handleCompleteMatch = () => {
    if (!selectedMatch) return;
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
    if (!selectedMatch) return;
    const newSetIndex = selectedMatch.scores.length;
    
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
    // Update tournament settings
    if (currentTournament) {
      const updatedTournament = {
        ...currentTournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      updateTournament(updatedTournament);
    }
  };

  return {
    handleSelectMatch,
    handleScoreChange,
    handleStartMatch,
    handleCompleteMatch,
    handleNewSet,
    handleUpdateScoringSettings
  };
};
