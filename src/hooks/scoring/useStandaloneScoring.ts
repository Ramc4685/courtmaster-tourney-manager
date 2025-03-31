
import { useState, useEffect } from 'react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { Match, StandaloneMatch, TournamentStage } from '@/types/tournament';
import { useToast } from '@/hooks/use-toast';

export const useStandaloneScoring = (matchId: string | null) => {
  const standaloneMatchStore = useStandaloneMatchStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);

  // Load standalone match
  useEffect(() => {
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    const loadMatch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await standaloneMatchStore.loadMatchById(matchId);
        if (!standaloneMatchStore.currentMatch) {
          setError('Match not found');
          setScoringMatch(null);
        } else {
          // Convert standalone match to scoring match format
          const converted = convertToScoringMatch(standaloneMatchStore.currentMatch);
          setScoringMatch(converted);
        }
      } catch (err) {
        setError('Failed to load match');
        setScoringMatch(null);
        console.error('Error loading standalone match:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatch();
  }, [matchId, standaloneMatchStore]);

  const saveMatch = async () => {
    if (!standaloneMatchStore.currentMatch) return false;
    
    try {
      // Ensure the standaloneMatchStore has a saveMatch method
      if (typeof standaloneMatchStore.saveMatch === 'function') {
        await standaloneMatchStore.saveMatch();
      } else {
        // Fallback to updateMatch if saveMatch doesn't exist
        await standaloneMatchStore.updateMatch(standaloneMatchStore.currentMatch);
      }
      
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
  };

  // Convert standalone match to regular match compatible with scoring components
  const convertToScoringMatch = (standaloneMatch: StandaloneMatch | null): Match | null => {
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
  };

  return {
    match: standaloneMatchStore.currentMatch,
    scoringMatch,
    isLoading,
    error,
    saveMatch,
    updateMatch: standaloneMatchStore.updateMatch
  };
};
