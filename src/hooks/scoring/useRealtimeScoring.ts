
import { useEffect, useState } from 'react';
import { Match } from '@/types/tournament';
import { useTournament } from '@/contexts/TournamentContext';
import { realtimeTournamentService } from '@/services/realtime/RealtimeTournamentService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to provide real-time scoring capabilities for tournament matches
 */
export const useRealtimeScoring = (initialMatch: Match | null) => {
  const [match, setMatch] = useState<Match | null>(initialMatch);
  const { updateTournament, currentTournament } = useTournament();
  const { toast } = useToast();
  const [isConflict, setIsConflict] = useState(false);

  // Subscribe to real-time updates for this match
  useEffect(() => {
    if (!match || !match.id) return;

    // Subscribe to individual match updates
    const unsubscribe = realtimeTournamentService.subscribeMatch(match.id, (updatedMatch) => {
      // Check if our local match is older than the received one
      const ourUpdateTime = match.updatedAt ? new Date(match.updatedAt) : new Date(0);
      const theirUpdateTime = updatedMatch.updatedAt ? new Date(updatedMatch.updatedAt) : new Date(0);
      
      if (theirUpdateTime > ourUpdateTime) {
        // If someone else updated the match more recently
        setMatch(updatedMatch);
        
        // If we have unsaved changes, notify the user of a conflict
        if (isConflict) {
          toast({
            title: "Match Updated",
            description: "Another scorekeeper has updated this match. Your view has been refreshed.",
            variant: "default",
          });
        }
        
        setIsConflict(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [match, isConflict, toast]);

  // Update match with new data and publish to real-time service
  const updateMatchData = (updatedMatch: Match) => {
    // Update the match in our state
    setMatch(updatedMatch);

    // Update the match in the tournament
    if (currentTournament) {
      const updatedMatches = currentTournament.matches.map(m => 
        m.id === updatedMatch.id ? updatedMatch : m
      );
      
      const updatedTournament = {
        ...currentTournament,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      
      // Update context (which will publish to real-time service)
      updateTournament(updatedTournament);
    }
  };

  return {
    match,
    updateMatchData,
    isConflict,
  };
};
