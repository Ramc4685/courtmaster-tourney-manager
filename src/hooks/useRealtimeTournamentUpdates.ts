
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
    console.log(`[DEBUG] useRealtimeTournamentUpdates: Initializing with tournamentId=${tournamentId || 'undefined'}`);
    console.log(`[DEBUG] useRealtimeTournamentUpdates: Current tournament ID=${currentTournament?.id || 'null'}`);
    
    if (!tournamentId) {
      console.log(`[DEBUG] useRealtimeTournamentUpdates: No tournamentId provided, skipping subscriptions`);
      return;
    }
    
    if (!currentTournament) {
      console.log(`[DEBUG] useRealtimeTournamentUpdates: No current tournament available, skipping subscriptions`);
      return;
    }
    
    if (tournamentId !== currentTournament.id) {
      console.log(`[DEBUG] useRealtimeTournamentUpdates: Tournament ID mismatch, skipping subscriptions`);
      console.log(`[DEBUG] useRealtimeTournamentUpdates: Provided ID=${tournamentId}, Current ID=${currentTournament.id}`);
      return;
    }

    let unsubscribeTournament: (() => void) | null = null;
    let unsubscribeMatches: (() => void) | null = null;

    const setupSubscriptions = () => {
      console.log(`[DEBUG] useRealtimeTournamentUpdates: Setting up realtime subscriptions for tournament ${tournamentId}`);
      
      // Subscribe to tournament updates
      unsubscribeTournament = realtimeTournamentService.subscribeTournament(
        tournamentId,
        (updatedTournament) => {
          console.log(`[DEBUG] useRealtimeTournamentUpdates: Received tournament update for ${updatedTournament.id}`);
          console.log(`[DEBUG] useRealtimeTournamentUpdates: Update timestamp=${new Date(updatedTournament.updatedAt).toISOString()}`);
          console.log(`[DEBUG] useRealtimeTournamentUpdates: Current timestamp=${currentTournament ? new Date(currentTournament.updatedAt).toISOString() : 'null'}`);
          
          // Only update if it's newer than current
          if (currentTournament && new Date(updatedTournament.updatedAt) > new Date(currentTournament.updatedAt)) {
            console.log(`[DEBUG] useRealtimeTournamentUpdates: Updating tournament with newer data`);
            updateTournament(updatedTournament);
            toast({
              title: "Tournament Updated",
              description: "The tournament data has been updated with the latest changes.",
              variant: "default",
            });
          } else {
            console.log(`[DEBUG] useRealtimeTournamentUpdates: Ignoring tournament update (not newer than current data)`);
          }
        }
      );

      // Subscribe to in-progress matches
      unsubscribeMatches = realtimeTournamentService.subscribeInProgressMatches(
        tournamentId,
        (matches) => {
          console.log(`[DEBUG] useRealtimeTournamentUpdates: Received in-progress matches update. Count: ${matches.length}`);
          setInProgressMatches(matches);
        }
      );

      setIsSubscribed(true);
      console.log(`[DEBUG] useRealtimeTournamentUpdates: Subscriptions established successfully`);
    };

    setupSubscriptions();

    // Publish initial state to real-time service
    if (currentTournament) {
      console.log(`[DEBUG] useRealtimeTournamentUpdates: Publishing initial tournament state to realtime service`);
      realtimeTournamentService.publishTournamentUpdate(currentTournament);
    }

    // Cleanup subscriptions
    return () => {
      console.log(`[DEBUG] useRealtimeTournamentUpdates: Cleaning up subscriptions`);
      if (unsubscribeTournament) {
        console.log(`[DEBUG] useRealtimeTournamentUpdates: Unsubscribing from tournament updates`);
        unsubscribeTournament();
      }
      if (unsubscribeMatches) {
        console.log(`[DEBUG] useRealtimeTournamentUpdates: Unsubscribing from in-progress matches updates`);
        unsubscribeMatches();
      }
      setIsSubscribed(false);
    };
  }, [tournamentId, currentTournament, updateTournament, toast]);

  // Function to publish updates to other clients
  const publishTournamentUpdate = (tournament: Tournament) => {
    console.log(`[DEBUG] useRealtimeTournamentUpdates: Manually publishing tournament update for ${tournament.id}`);
    realtimeTournamentService.publishTournamentUpdate(tournament);
  };

  return {
    currentTournament,
    inProgressMatches,
    isSubscribed,
    publishTournamentUpdate,
  };
};
