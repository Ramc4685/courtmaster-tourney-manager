
import { useState, useEffect } from 'react';
import { Tournament, Match } from '@/types/tournament';
import { useTournament } from '@/contexts/TournamentContext';
import { realtimeTournamentService } from '@/services/realtime/RealtimeTournamentService';
import { useToast } from '@/hooks/use-toast';

/**
 * A hook that combines the TournamentContext with real-time updates.
 * This allows components to receive live updates when other users modify the tournament.
 */
export const useRealtimeTournamentUpdates = (tournamentId?: string) => {
  const { currentTournament, updateTournament } = useTournament();
  const [inProgressMatches, setInProgressMatches] = useState<Match[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!tournamentId || !currentTournament || tournamentId !== currentTournament.id) return;

    let unsubscribeTournament: (() => void) | null = null;
    let unsubscribeMatches: (() => void) | null = null;

    const setupSubscriptions = () => {
      // Subscribe to tournament updates
      unsubscribeTournament = realtimeTournamentService.subscribeTournament(
        tournamentId,
        (updatedTournament) => {
          // Only update if it's newer than current
          if (currentTournament && new Date(updatedTournament.updatedAt) > new Date(currentTournament.updatedAt)) {
            updateTournament(updatedTournament);
            toast({
              title: "Tournament Updated",
              description: "The tournament data has been updated with the latest changes.",
              variant: "default",
            });
          }
        }
      );

      // Subscribe to in-progress matches
      unsubscribeMatches = realtimeTournamentService.subscribeInProgressMatches(
        tournamentId,
        (matches) => {
          setInProgressMatches(matches);
        }
      );

      setIsSubscribed(true);
    };

    setupSubscriptions();

    // Publish initial state to real-time service
    if (currentTournament) {
      realtimeTournamentService.publishTournamentUpdate(currentTournament);
    }

    // Cleanup subscriptions
    return () => {
      if (unsubscribeTournament) unsubscribeTournament();
      if (unsubscribeMatches) unsubscribeMatches();
      setIsSubscribed(false);
    };
  }, [tournamentId, currentTournament, updateTournament, toast]);

  // Function to publish updates to other clients
  const publishTournamentUpdate = (tournament: Tournament) => {
    realtimeTournamentService.publishTournamentUpdate(tournament);
  };

  return {
    currentTournament,
    inProgressMatches,
    isSubscribed,
    publishTournamentUpdate,
  };
};
