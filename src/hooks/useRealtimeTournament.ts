
import { useState, useEffect } from 'react';
import { Tournament, Match } from '@/types/tournament';
import { realtimeTournamentService } from '@/services/realtime/RealtimeTournamentService';
import { tournamentService } from '@/services/tournament/TournamentService';

export const useRealtimeTournament = (tournamentId?: string) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [inProgressMatches, setInProgressMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // First load the tournament data
    const loadTournament = async () => {
      try {
        // In a real app, this would fetch from your backend API
        // For now, we're using local storage
        const tournaments = await tournamentService.getTournaments();
        const foundTournament = tournaments.find(t => t.id === tournamentId);
        
        if (foundTournament) {
          setTournament(foundTournament);
          
          // Get initial in-progress matches
          const initialInProgressMatches = foundTournament.matches.filter(
            m => m.status === "IN_PROGRESS"
          );
          setInProgressMatches(initialInProgressMatches);
        } else {
          setError(new Error('Tournament not found'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();

    // Subscribe to real-time updates
    const unsubscribeTournament = realtimeTournamentService.subscribeTournament(
      tournamentId,
      (updatedTournament) => {
        setTournament(updatedTournament);
      }
    );

    const unsubscribeMatches = realtimeTournamentService.subscribeInProgressMatches(
      tournamentId,
      (matches) => {
        setInProgressMatches(matches);
      }
    );

    // Cleanup subscriptions
    return () => {
      unsubscribeTournament();
      unsubscribeMatches();
    };
  }, [tournamentId]);

  return {
    tournament,
    inProgressMatches,
    isLoading,
    error,
  };
};
