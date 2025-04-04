import { useState, useEffect, useCallback } from 'react';
import { Match, StandaloneMatch, MatchStatus } from '@/types/tournament';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { useToast } from '@/hooks/use-toast';

export const useUnifiedScoring = (matchId?: string) => {
  const [match, setMatch] = useState<StandaloneMatch | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scorerName, setScorerName] = useState('Anonymous Scorer');
  
  const standaloneMatchStore = useStandaloneMatchStore();
  const { toast } = useToast();
  
  // Load match data
  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    
    try {
      const loadedMatch = standaloneMatchStore.loadMatchById(matchId);
      
      if (loadedMatch) {
        setMatch(loadedMatch);
        
        // Set current set to the last set
        if (loadedMatch.scores && loadedMatch.scores.length > 0) {
          setCurrentSet(loadedMatch.scores.length - 1);
        }
        
        // Set scorer name if available
        if (loadedMatch.scorerName) {
          setScorerName(loadedMatch.scorerName);
        }
        
        setError(null);
      } else {
        setError('Match not found');
      }
    } catch (err) {
      console.error('Error loading match:', err);
      setError('Failed to load match data');
    } finally {
      setLoading(false);
    }
  }, [matchId, standaloneMatchStore]);
  
  // Update match score
  const updateMatchScore = useCallback((
    matchId: string,
    setIndex: number,
    team1Score: number,
    team2Score: number,
    scorerName?: string
  ) => {
    try {
      standaloneMatchStore.updateMatchScore(matchId, setIndex, team1Score, team2Score, scorerName);
      
      // Update local state
      const updatedMatch = standaloneMatchStore.loadMatchById(matchId);
      if (updatedMatch) {
        setMatch(updatedMatch);
      }
      
      return true;
    } catch (err) {
      console.error('Error updating match score:', err);
      toast({
        title: 'Error',
        description: 'Failed to update match score',
        variant: 'destructive',
      });
      return false;
    }
  }, [standaloneMatchStore, toast]);
  
  // Handle score change
  const handleScoreChange = useCallback((team: 'team1' | 'team2', increment: boolean) => {
    if (!match) return;
    
    const scores = [...match.scores];
    
    // Ensure we have enough entries in the scores array
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Get current scores for this set
    let { team1Score, team2Score } = scores[currentSet];
    
    // Update the appropriate score
    if (team === 'team1') {
      team1Score = increment ? team1Score + 1 : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment ? team2Score + 1 : Math.max(0, team2Score - 1);
    }
    
    // Update the score in the store
    updateMatchScore(match.id, currentSet, team1Score, team2Score, scorerName);
  }, [match, currentSet, scorerName, updateMatchScore]);
  
  // Start a new set
  const startNewSet = useCallback(() => {
    if (!match) return;
    
    const newSetIndex = match.scores.length;
    updateMatchScore(match.id, newSetIndex, 0, 0, scorerName);
    setCurrentSet(newSetIndex);
    
    toast({
      title: 'New set started',
      description: `Set ${newSetIndex + 1} has been started.`,
    });
  }, [match, scorerName, updateMatchScore, toast]);
  
  // Complete match
  const completeMatch = useCallback(() => {
    if (!match) return;
    
    try {
      const success = standaloneMatchStore.completeMatch(match.id, scorerName);
      
      if (success) {
        // Refresh match data
        const updatedMatch = standaloneMatchStore.loadMatchById(match.id);
        if (updatedMatch) {
          setMatch(updatedMatch);
        }
        
        toast({
          title: 'Match completed',
          description: 'The match has been marked as completed.',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to complete the match.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      console.error('Error completing match:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    }
  }, [match, scorerName, standaloneMatchStore, toast]);
  
  // Update court number
  const updateCourtNumber = useCallback((matchId: string, courtNumber: number) => {
    try {
      standaloneMatchStore.updateCourtNumber(matchId, courtNumber);
      
      // Update local state
      const updatedMatch = standaloneMatchStore.loadMatchById(matchId);
      if (updatedMatch) {
        setMatch(updatedMatch);
      }
      
      toast({
        title: 'Court updated',
        description: `Match assigned to Court ${courtNumber}.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error updating court number:', err);
      toast({
        title: 'Error',
        description: 'Failed to update court assignment',
        variant: 'destructive',
      });
      return false;
    }
  }, [standaloneMatchStore, toast]);
  
  // Update scorer name
  const updateScorerName = useCallback((name: string) => {
    setScorerName(name);
    
    // Also update the match with the scorer name
    if (match) {
      const updatedMatch = {
        ...match,
        scorerName: name,
        updatedAt: new Date()
      };
      standaloneMatchStore.updateMatch(updatedMatch);
    }
  }, [match, standaloneMatchStore]);
  
  // Start match
  const startMatch = useCallback(() => {
    if (!match) return false;
    
    try {
      const updatedMatch = {
        ...match,
        status: 'IN_PROGRESS' as MatchStatus,
        updatedAt: new Date()
      };
      
      standaloneMatchStore.updateMatch(updatedMatch);
      setMatch(updatedMatch);
      
      toast({
        title: 'Match started',
        description: 'The match is now in progress.',
      });
      
      return true;
    } catch (err) {
      console.error('Error starting match:', err);
      toast({
        title: 'Error',
        description: 'Failed to start the match.',
        variant: 'destructive',
      });
      return false;
    }
  }, [match, standaloneMatchStore, toast]);
  
  return {
    match,
    currentSet,
    setCurrentSet,
    loading,
    error,
    scorerName,
    setScorerName: updateScorerName,
    handleScoreChange,
    startNewSet,
    completeMatch,
    updateCourtNumber,
    startMatch,
    updateMatchScore
  };
};
