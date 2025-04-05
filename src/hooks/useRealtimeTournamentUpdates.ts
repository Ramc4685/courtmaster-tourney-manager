
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
// Update import for useTournament
import { useTournament } from '@/contexts/tournament/useTournament';
import { Match, Tournament } from '@/types/tournament';

/**
 * Hook to listen for real-time tournament updates and sync with local state
 */
export function useRealtimeTournamentUpdates(tournamentId: string | undefined) {
  const { updateTournament } = useTournament();
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [inProgressMatches, setInProgressMatches] = useState<Match[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!tournamentId || !supabase) {
      console.log('Skipping Supabase setup: missing tournament ID or Supabase client');
      return;
    }

    console.log(`Setting up Supabase listener for tournament ID: ${tournamentId}`);

    const channel = supabase
      .channel(`tournament_updates_${tournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
        async (payload) => {
          console.log('Received Supabase payload:', payload);

          if (payload.new && typeof payload.new === 'object') {
            try {
              // Safely check if data property exists and handle it
              const newData = payload.new as Record<string, any>;
              
              if (newData.data) {
                // Parse the data field which contains the tournament details
                const tournamentData = typeof newData.data === 'string'
                  ? JSON.parse(newData.data)
                  : newData.data;

                if (tournamentData) {
                  // Convert dates back to Date objects
                  const parsedTournament = {
                    ...tournamentData,
                    createdAt: new Date(tournamentData.createdAt),
                    updatedAt: new Date(tournamentData.updatedAt),
                    startDate: new Date(tournamentData.startDate),
                    // Ensure matches also have their dates parsed
                    matches: tournamentData.matches ? tournamentData.matches.map((match: any) => ({
                      ...match,
                      scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : null
                    })) : []
                  };

                  console.log('Parsed tournament data:', parsedTournament);

                  // Update the tournament using the context's updateTournament function
                  await updateTournament(parsedTournament);
                  
                  // Also set in our local state
                  setCurrentTournament(parsedTournament);
                  
                  // Update in-progress matches
                  const inProgress = parsedTournament.matches.filter(
                    (m: Match) => m.status === "IN_PROGRESS"
                  );
                  setInProgressMatches(inProgress);

                  toast({
                    title: 'Tournament updated',
                    description: 'Real-time update received from Supabase.',
                  });
                } else {
                  console.warn('Received a Supabase update without tournament data.');
                }
              }
            } catch (error) {
              console.error('Error processing real-time update:', error);
              toast({
                title: 'Update failed',
                description: 'Failed to process real-time update.',
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to tournament updates for ID: ${tournamentId}`);
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Supabase channel error for tournament ID: ${tournamentId}`);
          setIsSubscribed(false);
        } else if (status === 'TIMED_OUT') {
          console.warn(`Supabase timed out while subscribing to tournament ID: ${tournamentId}`);
          setIsSubscribed(false);
        }
      });

    return () => {
      console.log(`Unsubscribing from tournament updates for ID: ${tournamentId}`);
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [tournamentId, updateTournament]);

  return { currentTournament, inProgressMatches, isSubscribed };
}
