import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, ScorerType, StandaloneMatch, MatchStatus } from '@/types/tournament';
import { useTournament } from '@/contexts/TournamentContext';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { useToast } from '@/hooks/use-toast';
import { getDefaultScoringSettings, isSetComplete, isMatchComplete } from '@/utils/matchUtils';
import { getCurrentUserId } from '@/utils/auditUtils';

interface UnifiedScoringOptions {
  scorerType: ScorerType;
  matchId?: string;
  scorerName?: string; // New optional parameter for scorer's name
}

/**
 * A unified hook that provides scoring functionality for both tournament and standalone matches
 */
export const useUnifiedScoring = ({ scorerType, matchId, scorerName }: UnifiedScoringOptions) => {
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
  const [actualScorerName, setActualScorerName] = useState(scorerName || getCurrentUserId()); // Initialize with provided name or user ID
  
  // Use refs to track state between renders without causing re-renders
  const matchIdRef = useRef<string | undefined>(matchId);
  const initialLoadCompletedRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const matchRef = useRef<Match | null>(null);
  const scoringSettingsRef = useRef(scoringSettings);
  const scorerTypeRef = useRef(scorerType); // Use ref for scorer type to prevent dependency changes
  const scorerNameRef = useRef(scorerName || getCurrentUserId()); // Store scorer name in ref

  // Update scoringSettingsRef when scoringSettings changes
  useEffect(() => {
    scoringSettingsRef.current = scoringSettings;
  }, [scoringSettings]);

  useEffect(() => {
    // Update scorer name ref when props change
    if (scorerName) {
      scorerNameRef.current = scorerName;
      setActualScorerName(scorerName);
    }
  }, [scorerName]);

  // Load match data based on scorer type - with stabilized dependencies
  useEffect(() => {
    // Skip if the matchId or scorer type hasn't changed and initial load is completed
    if (matchId === matchIdRef.current && 
        scorerType === scorerTypeRef.current && 
        initialLoadCompletedRef.current) {
      return;
    }
    
    // Update the refs to the current values
    matchIdRef.current = matchId;
    scorerTypeRef.current = scorerType;
    
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
            matchRef.current = convertedMatch; // Update ref first
            setMatch(convertedMatch); // Then update state
            
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
              matchRef.current = tournamentMatch; // Update ref first
              setMatch(tournamentMatch); // Then update state
              
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
  // Remove dependency on scorerType and matchId to avoid loops, use refs instead
  }, [tournament, standaloneStore]); 

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
      let team1Score = currentScore.team1Score || 0;
      let team2Score = currentScore.team2Score || 0;
      
      // Apply strict badminton scoring rules (same logic for standalone and tournament)
      // Get the current settings from the ref for consistency
      const currentSettings = scoringSettingsRef.current;
      const maxPoints = currentSettings.maxPoints || 21;
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
      
      // Update match in standalone store - include scorer name
      standaloneStore.updateMatchScore(
        currentMatch.id, 
        currentSet, 
        team1Score, 
        team2Score, 
        scorerNameRef.current // Pass scorer name to store
      );
        
      // Update local state (immutably)
      const updatedScores = [...scores];
      updatedScores[currentSet] = { team1Score, team2Score };
      
      const updatedMatch = { 
        ...currentMatch, 
        scores: updatedScores,
        scorerName: scorerNameRef.current // Include scorer name in match
      } as Match;
      
      // Update both the ref and the state (in this order)
      matchRef.current = updatedMatch;
      setMatch(updatedMatch);
      
      // Check if this set or match is complete based on scoring settings
      const setComplete = isSetComplete(team1Score, team2Score, currentSettings);
      if (setComplete) {
        console.log(`Set complete: ${team1Score}-${team2Score}`);
        
        // Check if match is complete
        const matchComplete = isMatchComplete(updatedMatch, currentSettings);
        
        if (matchComplete) {
          console.log('Match complete based on scoring rules');
          setTimeout(() => {
            setCompleteMatchDialogOpen(true);
          }, 0);
        } else if (updatedMatch.scores.length < currentSettings.maxSets) {
          console.log('Set complete but match is not, prompting for new set');
          setTimeout(() => {
            setNewSetDialogOpen(true);
          }, 0);
        }
      }
    } finally {
      // Reset flag after a short delay to prevent rapid consecutive updates
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
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
      
      // Apply strict badminton scoring rules (same logic for standalone and tournament)
      const currentSettings = scoringSettingsRef.current;
      const maxPoints = currentSettings.maxPoints || 21;
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
      
      // Update in tournament context - include scorer name
      tournament.updateMatchScore(
        currentMatch.id, 
        currentSet, 
        team1Score, 
        team2Score,
        scorerNameRef.current // Pass scorer name to tournament context
      );
      
      // Update our local state immediately
      const updatedScores = [...scores];
      updatedScores[currentSet] = { team1Score, team2Score };
      
      const updatedMatch = { 
        ...currentMatch, 
        scores: updatedScores,
        scorerName: scorerNameRef.current // Include scorer name in match
      } as Match;
      
      // Update both the ref and the state (in this order)
      matchRef.current = updatedMatch;
      setMatch(updatedMatch);
      
      // Check if this set or match is complete based on scoring settings
      const setComplete = isSetComplete(team1Score, team2Score, currentSettings);
      if (setComplete) {
        console.log(`Set complete: ${team1Score}-${team2Score}`);
        
        // Check if match is complete
        const matchComplete = isMatchComplete(updatedMatch, currentSettings);
        
        if (matchComplete) {
          console.log('Match complete based on scoring rules');
          setTimeout(() => {
            setCompleteMatchDialogOpen(true);
          }, 0);
        } else if (updatedMatch.scores.length < currentSettings.maxSets) {
          console.log('Set complete but match is not, prompting for new set');
          setTimeout(() => {
            setNewSetDialogOpen(true);
          }, 0);
        }
      }
    } finally {
      // Reset flag after a short delay to prevent rapid consecutive updates
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [currentSet, tournament]);

  // Route score change to the appropriate handler based on scorer type
  const handleScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    // Use the current scorerType from ref to ensure stability
    const currentScorerType = scorerTypeRef.current;
    
    if (currentScorerType === 'STANDALONE') {
      handleStandaloneScoreChange(team, increment);
    } else {
      handleTournamentScoreChange(team, increment);
    }
  }, [handleStandaloneScoreChange, handleTournamentScoreChange]);

  // Create a new set
  const handleNewSet = useCallback(() => {
    const currentMatch = matchRef.current;
    if (!currentMatch) return false;
    
    // Prevent multiple updates at once
    if (isUpdatingRef.current) return false;
    isUpdatingRef.current = true;
    
    try {
      const newSetIndex = currentMatch.scores.length;
      const currentScorerType = scorerTypeRef.current; // Use ref for stability
      
      if (currentScorerType === 'STANDALONE') {
        // Initialize the new set with 0-0 score
        standaloneStore.updateMatchScore(currentMatch.id, newSetIndex, 0, 0);
        
        // Update local state
        const updatedScores = [...currentMatch.scores, { team1Score: 0, team2Score: 0 }];
        
        // Use proper typing for the match
        const updatedMatch = { 
          ...currentMatch, 
          scores: updatedScores
        } as Match;
        
        // Update ref first, then state
        matchRef.current = updatedMatch;
        setMatch(updatedMatch);
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
          
          // Update ref first, then state
          matchRef.current = updatedMatch;
          setMatch(updatedMatch);
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
      }, 50);
    }
  }, [standaloneStore, tournament, toast]);

  // Complete the match
  const handleCompleteMatch = useCallback(() => {
    const currentMatch = matchRef.current;
    if (!currentMatch) return false;
    
    // Prevent multiple updates at once
    if (isUpdatingRef.current) return false;
    isUpdatingRef.current = true;
    
    try {
      const currentScorerType = scorerTypeRef.current; // Use ref for stability
      
      if (currentScorerType === 'STANDALONE') {
        // Pass scorer name to complete match
        standaloneStore.completeMatch(currentMatch.id, scorerNameRef.current);
        
        // Update local match status with proper typing and end time
        const updatedMatch = { 
          ...currentMatch, 
          status: 'COMPLETED' as MatchStatus,
          endTime: new Date(), // Add end time
          scorerName: scorerNameRef.current // Include scorer name
        } as Match;
        
        // Update ref first, then state
        matchRef.current = updatedMatch;
        setMatch(updatedMatch);
      } else {
        if (tournament.currentTournament) {
          // Pass scorer name to complete match
          tournament.completeMatch(currentMatch.id, scorerNameRef.current);
          
          // Also update our local state
          const updatedMatch = { 
            ...currentMatch, 
            status: 'COMPLETED' as MatchStatus,
            endTime: new Date(), // Add end time
            scorerName: scorerNameRef.current // Include scorer name
          } as Match;
          
          // Update ref first, then state
          matchRef.current = updatedMatch;
          setMatch(updatedMatch);
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
      }, 50);
    }
  }, [standaloneStore, tournament, toast]);

  // Save standalone match
  const saveMatch = useCallback(async () => {
    const currentScorerType = scorerTypeRef.current; // Use ref for stability
    
    if (currentScorerType !== 'STANDALONE' || !standaloneStore.currentMatch) return false;
    
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
  }, [standaloneStore, toast]);

  // Update court number
  const updateCourtNumber = useCallback((courtNumber: number) => {
    const currentMatch = matchRef.current;
    if (!currentMatch) return;
    
    const currentScorerType = scorerTypeRef.current;
    console.log(`Updating court number to ${courtNumber} for ${currentScorerType} match`);
    
    if (currentScorerType === 'STANDALONE') {
      standaloneStore.updateCourtNumber(currentMatch.id, courtNumber);
      
      // Update local state
      const updatedMatch = { 
        ...currentMatch, 
        courtNumber 
      };
      
      // Update ref and state
      matchRef.current = updatedMatch;
      setMatch(updatedMatch);
      
      toast({
        title: "Court updated",
        description: `Match assigned to court #${courtNumber}`
      });
    } else {
      if (tournament.currentTournament) {
        // Find match in tournament
        const tournamentMatch = tournament.currentTournament.matches.find(m => m.id === currentMatch.id);
        if (tournamentMatch) {
          // Create an updated match with the new court number
          const updatedMatch = {
            ...tournamentMatch,
            courtNumber
          };
        
          // Use full match update logic instead of calling updateMatch directly
          // This might involve updating the match in the tournament context
          // For now, just update our local state since we can't modify the context interface
          matchRef.current = updatedMatch;
          setMatch(updatedMatch);
        
          toast({
            title: "Court updated",
            description: `Match assigned to court #${courtNumber}`
          });
        }
      }
    }
  }, [standaloneStore, tournament, toast]);

  // Update scoring settings
  const handleUpdateScoringSettings = useCallback((newSettings: any) => {
    // Update both the state and the ref
    scoringSettingsRef.current = newSettings;
    setScoringSettings(newSettings);
    
    const currentScorerType = scorerTypeRef.current; // Use ref for stability
    
    if (currentScorerType === 'TOURNAMENT' && tournament.currentTournament) {
      const updatedTournament = {
        ...tournament.currentTournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      // Call tournament context update but don't wait for it
      tournament.updateTournament(updatedTournament);
    }
  }, [tournament]);

  // Function to update scorer name
  const updateScorerName = useCallback((name: string) => {
    scorerNameRef.current = name;
    setActualScorerName(name);
  }, []);

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
    isStandalone: scorerTypeRef.current === 'STANDALONE', // Use ref for stability
    isPending: tournament.isPending,
    scorerName: actualScorerName,
    updateScorerName,
    updateCourtNumber // New function to update court number
  };
};
