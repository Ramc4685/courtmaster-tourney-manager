
import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, ScorerType, StandaloneMatch, MatchStatus } from '@/types/tournament';
import { useTournament } from '@/contexts/TournamentContext';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { useToast } from '@/hooks/use-toast';
import { getDefaultScoringSettings, isSetComplete, isMatchComplete } from '@/utils/matchUtils';

interface UnifiedScoringOptions {
  scorerType: ScorerType;
  matchId?: string;
}

/**
 * A unified hook that provides scoring functionality for both tournament and standalone matches
 */
export const useUnifiedScoring = ({ scorerType, matchId }: UnifiedScoringOptions) => {
  const { toast } = useToast();
  const tournament = useTournament();
  const standaloneStore = useStandaloneMatchStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  const [scoringSettings, setScoringSettings] = useState(getDefaultScoringSettings());
  
  // Use refs to track state between renders without causing re-renders
  const matchIdRef = useRef<string | undefined>(matchId);
  const initialLoadCompletedRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const matchRef = useRef<Match | null>(null);
  const scoringSettingsRef = useRef(scoringSettings);

  // Update scoringSettingsRef when scoringSettings changes
  useEffect(() => {
    scoringSettingsRef.current = scoringSettings;
  }, [scoringSettings]);

  // Load match data based on scorer type
  useEffect(() => {
    // Skip if the matchId hasn't changed and initial load is completed
    if (matchId === matchIdRef.current && initialLoadCompletedRef.current) {
      return;
    }
    
    // Update the ref to the current matchId
    matchIdRef.current = matchId;
    
    // Skip if no matchId provided
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    const loadMatchData = async () => {
      console.log(`Loading ${scorerType} match with ID: ${matchId}`);
      setIsLoading(true);
      setError(null);

      try {
        if (scorerType === 'STANDALONE') {
          // Load standalone match
          const result = await standaloneStore.loadMatchById(matchId);
          if (!result) {
            setError('Standalone match not found');
            setMatch(null);
            matchRef.current = null;
          } else {
            // Convert to standard Match format for compatibility
            const convertedMatch: Match = {
              ...result,
              tournamentId: 'standalone',
              division: 'INITIAL',
              stage: 'INITIAL_ROUND',
              category: result.category || { id: 'default', name: 'Default', type: 'MENS_SINGLES' },
              scores: result.scores || [],
              status: result.status as MatchStatus
            } as Match;
            
            // Update state safely without causing infinite loops
            setMatch(convertedMatch);
            matchRef.current = convertedMatch;
            
            // Set current set to the latest set
            if (convertedMatch.scores.length > 0) {
              setCurrentSet(convertedMatch.scores.length - 1);
            }
            
            // For standalone matches, always use standard badminton scoring
            setScoringSettings(getDefaultScoringSettings());
          }
        } else {
          // Load tournament match
          if (!tournament.currentTournament) {
            setError('No tournament selected');
            setMatch(null);
            matchRef.current = null;
          } else {
            const tournamentMatch = tournament.currentTournament.matches.find(m => m.id === matchId);
            if (!tournamentMatch) {
              setError('Tournament match not found');
              setMatch(null);
              matchRef.current = null;
            } else {
              // Update state safely
              setMatch(tournamentMatch);
              matchRef.current = tournamentMatch;
              
              // Set current set
              if (tournamentMatch.scores.length > 0) {
                setCurrentSet(tournamentMatch.scores.length - 1);
              }
              
              // Use tournament scoring settings if available
              if (tournament.currentTournament.scoringSettings) {
                setScoringSettings(tournament.currentTournament.scoringSettings);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading match:', err);
        setError('Failed to load match');
        setMatch(null);
        matchRef.current = null;
      } finally {
        setIsLoading(false);
        initialLoadCompletedRef.current = true;
      }
    };

    loadMatchData();
  }, [matchId, scorerType, tournament, standaloneStore]);

  // Handle score change for standalone matches
  const handleStandaloneScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    // Use the ref to get current match to avoid stale state issues
    const currentMatch = matchRef.current;
    if (!currentMatch) return;
    
    // Prevent multiple updates at once
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    try {
      // Create a copy of scores to work with
      const scores = [...(currentMatch.scores || [])];
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
      
      // Apply strict badminton scoring rules
      // Get the absolute maximum score possible (maxTwoPointLeadScore from settings)
      const currentSettings = scoringSettingsRef.current;
      const absoluteMaxScore = currentSettings.maxTwoPointLeadScore || 30; 
      
      // Update the appropriate team's score with respect to scoring rules
      if (team === "team1") {
        team1Score = increment 
          ? Math.min(absoluteMaxScore, team1Score + 1) // Never exceed absolute maximum
          : Math.max(0, team1Score - 1);
      } else {
        team2Score = increment 
          ? Math.min(absoluteMaxScore, team2Score + 1) // Never exceed absolute maximum
          : Math.max(0, team2Score - 1);
      }
      
      // Update match in standalone store
      standaloneStore.updateMatchScore(currentMatch.id, currentSet, team1Score, team2Score);
        
      // Update local state (immutably)
      const updatedScores = [...scores];
      updatedScores[currentSet] = { team1Score, team2Score };
      
      // Use Match type to ensure compatibility
      const updatedMatch = { 
        ...currentMatch, 
        scores: updatedScores
      } as Match;
      
      // Update both the state and the ref
      setMatch(updatedMatch);
      matchRef.current = updatedMatch;
      
      // Check if this set or match is complete based on scoring settings
      const setComplete = isSetComplete(team1Score, team2Score, currentSettings);
      if (setComplete) {
        console.log(`Set complete: ${team1Score}-${team2Score}`);
        
        // Check if match is complete
        const matchComplete = isMatchComplete(updatedMatch, currentSettings);
        
        if (matchComplete) {
          console.log('Match complete based on scoring rules');
          setCompleteMatchDialogOpen(true);
        } else if (updatedMatch.scores.length < currentSettings.maxSets) {
          console.log('Set complete but match is not, prompting for new set');
          setNewSetDialogOpen(true);
        }
      }
    } finally {
      // Reset flag after a short delay to prevent rapid consecutive updates
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [currentSet, standaloneStore]);

  // Handle score change for tournament matches
  const handleTournamentScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    const currentMatch = matchRef.current;
    if (!currentMatch || !tournament.currentTournament) return;
    
    // Prevent multiple updates at once
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    try {
      // Create a copy of scores to work with
      const scores = [...(currentMatch.scores || [])];
      if (scores.length === 0) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }
      
      // Make sure we have a score entry for this set
      while (scores.length <= currentSet) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }
      
      const currentScore = scores[currentSet];
      let team1Score = currentScore.team1Score || 0;
      let team2Score = currentScore.team2Score || 0;
      
      // Apply strict badminton scoring rules
      const currentSettings = scoringSettingsRef.current;
      const absoluteMaxScore = currentSettings.maxTwoPointLeadScore || 30;
      
      if (team === "team1") {
        team1Score = increment 
          ? Math.min(absoluteMaxScore, team1Score + 1) // Never exceed absolute maximum
          : Math.max(0, team1Score - 1);
      } else {
        team2Score = increment 
          ? Math.min(absoluteMaxScore, team2Score + 1) // Never exceed absolute maximum
          : Math.max(0, team2Score - 1);
      }
      
      // Update in tournament context
      tournament.updateMatchScore(currentMatch.id, currentSet, team1Score, team2Score);
      
      // Update our local state to match
      const updatedScores = [...scores];
      updatedScores[currentSet] = { team1Score, team2Score };
      
      const updatedMatch = { 
        ...currentMatch, 
        scores: updatedScores
      } as Match;
      
      setMatch(updatedMatch);
      matchRef.current = updatedMatch;
      
      // Check if this set or match is complete based on scoring settings
      const setComplete = isSetComplete(team1Score, team2Score, currentSettings);
      if (setComplete) {
        console.log(`Set complete: ${team1Score}-${team2Score}`);
        
        // Check if match is complete
        const matchComplete = isMatchComplete(updatedMatch, currentSettings);
        
        if (matchComplete) {
          console.log('Match complete based on scoring rules');
          setCompleteMatchDialogOpen(true);
        } else if (updatedMatch.scores.length < currentSettings.maxSets) {
          console.log('Set complete but match is not, prompting for new set');
          setNewSetDialogOpen(true);
        }
      }
    } finally {
      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [currentSet, tournament]);

  // Route score change to the appropriate handler based on scorer type
  const handleScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    if (scorerType === 'STANDALONE') {
      handleStandaloneScoreChange(team, increment);
    } else {
      handleTournamentScoreChange(team, increment);
    }
  }, [scorerType, handleStandaloneScoreChange, handleTournamentScoreChange]);

  // Create a new set
  const handleNewSet = useCallback(() => {
    const currentMatch = matchRef.current;
    if (!currentMatch) return false;
    
    // Prevent multiple updates at once
    if (isUpdatingRef.current) return false;
    isUpdatingRef.current = true;
    
    try {
      const newSetIndex = currentMatch.scores.length;
      
      if (scorerType === 'STANDALONE') {
        // Initialize the new set with 0-0 score
        standaloneStore.updateMatchScore(currentMatch.id, newSetIndex, 0, 0);
        
        // Update local state
        const updatedScores = [...currentMatch.scores, { team1Score: 0, team2Score: 0 }];
        
        // Use proper typing for the match
        const updatedMatch = { 
          ...currentMatch, 
          scores: updatedScores
        } as Match;
        
        setMatch(updatedMatch);
        matchRef.current = updatedMatch;
        setCurrentSet(newSetIndex);
      } else {
        if (tournament.currentTournament) {
          tournament.updateMatchScore(currentMatch.id, newSetIndex, 0, 0);
          
          // Also update our local state
          const updatedScores = [...currentMatch.scores, { team1Score: 0, team2Score: 0 }];
          const updatedMatch = { 
            ...currentMatch, 
            scores: updatedScores
          } as Match;
          
          setMatch(updatedMatch);
          matchRef.current = updatedMatch;
          setCurrentSet(newSetIndex);
        }
      }
      
      setNewSetDialogOpen(false);
      
      toast({
        title: "New set started",
        description: `Set ${newSetIndex + 1} has been started.`
      });
      
      return true;
    } finally {
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [scorerType, standaloneStore, tournament, toast]);

  // Complete the match
  const handleCompleteMatch = useCallback(() => {
    const currentMatch = matchRef.current;
    if (!currentMatch) return false;
    
    // Prevent multiple updates at once
    if (isUpdatingRef.current) return false;
    isUpdatingRef.current = true;
    
    try {
      if (scorerType === 'STANDALONE') {
        standaloneStore.completeMatch(currentMatch.id);
        
        // Update local match status with proper typing
        const updatedMatch = { 
          ...currentMatch, 
          status: 'COMPLETED' as MatchStatus // Explicitly cast to MatchStatus
        } as Match;
        
        setMatch(updatedMatch);
        matchRef.current = updatedMatch;
      } else {
        if (tournament.currentTournament) {
          tournament.completeMatch(currentMatch.id);
          
          // Also update our local state
          const updatedMatch = { 
            ...currentMatch, 
            status: 'COMPLETED' as MatchStatus
          } as Match;
          
          setMatch(updatedMatch);
          matchRef.current = updatedMatch;
        }
      }
      
      setCompleteMatchDialogOpen(false);
      
      toast({
        title: "Match completed",
        description: "The match has been marked as complete."
      });
      
      return true;
    } finally {
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 10);
    }
  }, [scorerType, standaloneStore, tournament, toast]);

  // Save standalone match
  const saveMatch = useCallback(async () => {
    if (scorerType !== 'STANDALONE' || !standaloneStore.currentMatch) return false;
    
    try {
      await standaloneStore.saveMatch();
      
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
  }, [scorerType, standaloneStore, toast]);

  // Update scoring settings
  const handleUpdateScoringSettings = useCallback((newSettings: any) => {
    setScoringSettings(newSettings);
    scoringSettingsRef.current = newSettings;
    
    if (scorerType === 'TOURNAMENT' && tournament.currentTournament) {
      const updatedTournament = {
        ...tournament.currentTournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      tournament.updateTournament(updatedTournament);
    }
  }, [scorerType, tournament]);

  return {
    isLoading,
    error,
    match,
    currentSet,
    setCurrentSet,
    settingsOpen,
    setSettingsOpen,
    scoringSettings,
    handleUpdateScoringSettings,
    newSetDialogOpen,
    setNewSetDialogOpen,
    completeMatchDialogOpen,
    setCompleteMatchDialogOpen,
    handleScoreChange,
    handleNewSet,
    handleCompleteMatch,
    saveMatch,
    isStandalone: scorerType === 'STANDALONE',
    isPending: tournament.isPending
  };
};
