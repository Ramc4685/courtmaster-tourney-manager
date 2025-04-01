
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { Match, StandaloneMatch, TournamentStage } from '@/types/tournament';
import { useToast } from '@/hooks/use-toast';

export const useStandaloneScoring = (matchId: string | null) => {
  const standaloneMatchStore = useStandaloneMatchStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const prevMatchIdRef = useRef<string | null>(null);
  const initialLoadCompleted = useRef(false);

  // Convert standalone match to regular match compatible with scoring components
  const convertToScoringMatch = useCallback((standaloneMatch: StandaloneMatch | null): Match | null => {
    if (!standaloneMatch) return null;
    
    // Ensure scores is always an array
    const scores = standaloneMatch.scores || [];
    
    return {
      ...standaloneMatch,
      tournamentId: 'standalone',
      division: 'INITIAL',
      stage: 'INITIAL_ROUND' as TournamentStage,
      category: standaloneMatch.category || { id: 'default', name: 'Default', type: 'MENS_SINGLES' },
      scores: scores
    } as Match;
  }, []);

  // Load standalone match only when matchId changes
  useEffect(() => {
    // Skip if no matchId provided
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    // Skip if this matchId was already loaded (prevents infinite loops)
    if (prevMatchIdRef.current === matchId && initialLoadCompleted.current) {
      return;
    }

    const loadMatch = async () => {
      console.log(`Loading standalone match with ID: ${matchId}`);
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await standaloneMatchStore.loadMatchById(matchId);
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
      } catch (err) {
        console.error('Error loading standalone match:', err);
        setError('Failed to load match');
        setScoringMatch(null);
      } finally {
        setIsLoading(false);
        // Update the previous matchId for comparison in future renders
        prevMatchIdRef.current = matchId;
        initialLoadCompleted.current = true;
      }
    };

    loadMatch();
  }, [matchId, standaloneMatchStore, convertToScoringMatch]);

  // Update scoringMatch when currentMatch changes in the store
  // But ONLY after initial load is complete and only when it's a real change
  useEffect(() => {
    // Skip this effect during initial load to prevent cycles
    if (!initialLoadCompleted.current) return;
    
    // Only update if there's a currentMatch and it's actually different
    if (standaloneMatchStore.currentMatch && 
        (!scoringMatch || 
         JSON.stringify(standaloneMatchStore.currentMatch.scores) !== 
         JSON.stringify(scoringMatch?.scores))) {
      const converted = convertToScoringMatch(standaloneMatchStore.currentMatch);
      setScoringMatch(converted);
    }
  }, [standaloneMatchStore.currentMatch, convertToScoringMatch, scoringMatch]);

  const saveMatch = useCallback(async () => {
    if (!standaloneMatchStore.currentMatch) return false;
    
    try {
      // Ensure the standaloneMatchStore has a saveMatch method
      await standaloneMatchStore.saveMatch();
      
      toast({
        title: "Match saved",
        description: "Your match has been saved successfully."
      });
      
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
    updateMatch: standaloneMatchStore.updateMatch
  };
};
