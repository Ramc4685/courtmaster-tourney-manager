import { useState, useEffect, useCallback, useRef } from 'react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { Match, StandaloneMatch } from '@/types/tournament';
import { useToast } from '@/hooks/use-toast';

export const useStandaloneScoring = (matchId: string | null) => {
  const standaloneMatchStore = useStandaloneMatchStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const initialLoadCompleted = useRef(false);
  const updatingStoreRef = useRef(false);
  
  // Convert standalone match to regular match compatible with scoring components
  const convertToScoringMatch = useCallback((standaloneMatch: StandaloneMatch | null): Match | null => {
    if (!standaloneMatch) return null;
    
    // Ensure scores is always an array
    const scores = standaloneMatch.scores || [];
    
    // Using type assertion to convert StandaloneMatch to Match
    return {
      ...standaloneMatch,
      tournamentId: 'standalone',
      division: 'SINGLES' as any,
      stage: 'INITIAL_ROUND' as any,
      category: standaloneMatch.category || { 
        id: 'default', 
        name: 'Default', 
        type: standaloneMatch.team1.players.length > 1 ? 'MENS_DOUBLES' : 'MENS_SINGLES' 
      },
      scores: scores
    } as Match;
  }, []);

  // Load standalone match only when matchId changes and only once
  useEffect(() => {
    // Skip if no matchId provided
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    // Skip if this matchId was already loaded
    if (initialLoadCompleted.current) {
      return;
    }

    const loadMatch = async () => {
      console.log(`Loading standalone match with ID: ${matchId}`);
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current match from the store first to avoid unnecessary loads
        const currentMatch = standaloneMatchStore.currentMatch;
        
        // If the current match is already the one we want, use it
        if (currentMatch && currentMatch.id === matchId) {
          console.log("Using current match from store");
          const converted = convertToScoringMatch(currentMatch);
          setScoringMatch(converted);
        } else {
          // Otherwise, load the match from the store
          console.log("Loading match from store");
          const result = standaloneMatchStore.loadMatchById(matchId);
          
          if (!result) {
            console.log("Match not found after loading");
            setError('Match not found');
            setScoringMatch(null);
          } else {
            console.log("Successfully loaded match");
            // Convert standalone match to scoring match format
            const converted = convertToScoringMatch(result);
            setScoringMatch(converted);
          }
        }
      } catch (err) {
        console.error('Error loading standalone match:', err);
        setError('Failed to load match');
        setScoringMatch(null);
      } finally {
        setIsLoading(false);
        // Mark that we've completed the initial load
        initialLoadCompleted.current = true;
      }
    };

    loadMatch();
  }, [matchId, standaloneMatchStore, convertToScoringMatch]);

  // Update scoringMatch when currentMatch changes in the store
  // But ONLY after initial load is complete and only when necessary
  useEffect(() => {
    // Skip this effect during initial load to prevent cycles
    if (!initialLoadCompleted.current || updatingStoreRef.current) return;
    
    const storeMatch = standaloneMatchStore.currentMatch;
    
    // Only update if there's a currentMatch and it's actually different
    if (storeMatch) {
      // Skip if we don't have a current scoring match
      if (!scoringMatch) {
        const converted = convertToScoringMatch(storeMatch);
        setScoringMatch(converted);
        return;
      }
      
      // Check if scores are actually different by comparing string representations
      const storeScoresJson = JSON.stringify(storeMatch.scores || []);
      const currentScoresJson = JSON.stringify(scoringMatch?.scores || []);
      
      if (storeScoresJson !== currentScoresJson) {
        console.log("Store match changed, updating scoring match");
        const converted = convertToScoringMatch(storeMatch);
        setScoringMatch(converted);
      }
    }
  }, [standaloneMatchStore.currentMatch, convertToScoringMatch, scoringMatch]);

  // Update match score in the store
  const updateMatchScore = useCallback((
    setIndex: number,
    team1Score: number,
    team2Score: number
  ) => {
    if (!standaloneMatchStore.currentMatch) return;
    
    try {
      updatingStoreRef.current = true;
      standaloneMatchStore.updateMatchScore(
        standaloneMatchStore.currentMatch.id,
        setIndex,
        team1Score,
        team2Score
      );
      
      // Also update local state to avoid waiting for store update
      if (scoringMatch) {
        const updatedScores = [...scoringMatch.scores];
        // Ensure we have enough sets
        while (updatedScores.length <= setIndex) {
          updatedScores.push({ team1Score: 0, team2Score: 0 });
        }
        updatedScores[setIndex] = { team1Score, team2Score };
        
        const updatedMatch = {
          ...scoringMatch,
          scores: updatedScores
        };
        setScoringMatch(updatedMatch as Match);
      }
    } finally {
      // Reset flag after a short delay to allow state to settle
      setTimeout(() => {
        updatingStoreRef.current = false;
      }, 50);
    }
  }, [standaloneMatchStore, scoringMatch]);

  const handleScoreChange = useCallback((
    team: "team1" | "team2", 
    increment: boolean, 
    currentSet: number
  ) => {
    if (!scoringMatch) return;
    
    // Get current score
    const scores = [...(scoringMatch.scores || [])];
    if (scores.length === 0) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Make sure we have a score entry for this set
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    const currentScore = scores[currentSet];
    let team1Score = currentScore.team1Score;
    let team2Score = currentScore.team2Score;
    
    // Update the appropriate team's score
    if (team === "team1") {
      team1Score = increment 
        ? Math.min(999, team1Score + 1) // Using a high number as max
        : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment 
        ? Math.min(999, team2Score + 1)
        : Math.max(0, team2Score - 1);
    }
    
    // Update match score
    updateMatchScore(currentSet, team1Score, team2Score);
  }, [scoringMatch, updateMatchScore]);

  // Create a new set for the match
  const handleNewSet = useCallback(() => {
    if (!standaloneMatchStore.currentMatch) return false;
    if (!scoringMatch) return false;
    
    const newSetIndex = scoringMatch.scores.length;
    
    try {
      updatingStoreRef.current = true;
      // Initialize the new set with 0-0 score
      standaloneMatchStore.updateMatchScore(
        standaloneMatchStore.currentMatch.id, 
        newSetIndex, 
        0, 
        0
      );
      
      // Update local state
      const updatedScores = [...scoringMatch.scores, { team1Score: 0, team2Score: 0 }];
      const updatedMatch = {
        ...scoringMatch,
        scores: updatedScores
      };
      
      setScoringMatch(updatedMatch as Match);
      return true;
    } catch (err) {
      console.error('Error creating new set:', err);
      return false;
    } finally {
      // Reset flag after a short delay
      setTimeout(() => {
        updatingStoreRef.current = false;
      }, 50);
    }
  }, [standaloneMatchStore, scoringMatch]);

  // Complete the match
  const handleCompleteMatch = useCallback(async () => {
    if (!standaloneMatchStore.currentMatch) return false;
    
    try {
      await standaloneMatchStore.completeMatch(standaloneMatchStore.currentMatch.id);
      
      toast({
        title: "Match completed",
        description: "The match has been marked as complete."
      });
      
      return true;
    } catch (err) {
      console.error('Error completing match:', err);
      
      toast({
        title: "Error completing match",
        description: "There was a problem completing your match.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [standaloneMatchStore, toast]);

  const saveMatch = useCallback(async () => {
    if (!standaloneMatchStore.currentMatch) return false;
    
    try {
      // Use the saveMatch method if it exists, otherwise just resolve
      if (standaloneMatchStore.saveMatch) {
        const result = await standaloneMatchStore.saveMatch();
        
        toast({
          title: "Match saved",
          description: "Your match has been saved successfully."
        });
        
        return result;
      }
      
      return true;
    } catch (err) {
      console.error('Error saving match:', err);
      
      toast({
        title: "Error saving match",
        description: "There was a problem saving your match.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [standaloneMatchStore, toast]);

  return {
    match: standaloneMatchStore.currentMatch,
    scoringMatch,
    isLoading,
    error,
    saveMatch,
    updateMatch: standaloneMatchStore.updateMatch,
    handleScoreChange: (team: "team1" | "team2", increment: boolean, currentSet: number) => {
      if (!scoringMatch) return;
      
      // Get current score
      const scores = [...(scoringMatch.scores || [])];
      if (scores.length === 0) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }
      
      // Make sure we have a score entry for this set
      while (scores.length <= currentSet) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }
      
      const currentScore = scores[currentSet];
      let team1Score = currentScore.team1Score;
      let team2Score = currentScore.team2Score;
      
      // Update the appropriate team's score
      if (team === "team1") {
        team1Score = increment 
          ? Math.min(999, team1Score + 1) // Using a high number as max
          : Math.max(0, team1Score - 1);
      } else {
        team2Score = increment 
          ? Math.min(999, team2Score + 1)
          : Math.max(0, team2Score - 1);
      }
      
      // Update match score
      updateMatchScore(currentSet, team1Score, team2Score);
    },
    handleNewSet: () => {
      if (!standaloneMatchStore.currentMatch) return false;
      if (!scoringMatch) return false;
      
      const newSetIndex = scoringMatch.scores.length;
      
      try {
        updatingStoreRef.current = true;
        // Initialize the new set with 0-0 score
        standaloneMatchStore.updateMatchScore(
          standaloneMatchStore.currentMatch.id, 
          newSetIndex, 
          0, 
          0
        );
        
        // Update local state
        const updatedScores = [...scoringMatch.scores, { team1Score: 0, team2Score: 0 }];
        const updatedMatch = {
          ...scoringMatch,
          scores: updatedScores
        };
        
        setScoringMatch(updatedMatch as Match);
        return true;
      } catch (err) {
        console.error('Error creating new set:', err);
        return false;
      } finally {
        // Reset flag after a short delay
        setTimeout(() => {
          updatingStoreRef.current = false;
        }, 50);
      }
    },
    handleCompleteMatch: async () => {
      if (!standaloneMatchStore.currentMatch) return false;
      
      try {
        await standaloneMatchStore.completeMatch(standaloneMatchStore.currentMatch.id);
        
        toast({
          title: "Match completed",
          description: "The match has been marked as complete."
        });
        
        return true;
      } catch (err) {
        console.error('Error completing match:', err);
        
        toast({
          title: "Error completing match",
          description: "There was a problem completing your match.",
          variant: "destructive"
        });
        
        return false;
      }
    }
  };
};
