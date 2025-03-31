
import { useState, useEffect } from 'react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { Match, StandaloneMatch } from '@/types/tournament';
import { useToast } from '@/hooks/use-toast';

export const useStandaloneScoring = (matchId: string | null) => {
  const standaloneMatchStore = useStandaloneMatchStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch (err) {
        setError('Failed to load match');
        console.error('Error loading standalone match:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatch();
  }, [matchId]);

  const saveMatch = async () => {
    if (!standaloneMatchStore.currentMatch) return;
    
    try {
      await standaloneMatchStore.updateMatch(standaloneMatchStore.currentMatch);
      
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
    
    return {
      ...standaloneMatch,
      tournamentId: 'standalone',
      division: 'INITIAL',
      stage: 'FINAL'
    } as Match;
  };

  return {
    match: standaloneMatchStore.currentMatch,
    scoringMatch: convertToScoringMatch(standaloneMatchStore.currentMatch),
    isLoading,
    error,
    saveMatch,
    updateMatch: standaloneMatchStore.updateMatch
  };
};
