import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
// Update import for useTournament
import { useTournament } from '@/contexts/tournament/useTournament';

/**
 * Hook to listen for real-time tournament updates and sync with local state
 */
export function useRealtimeTournamentUpdates(tournamentId: string | undefined) {
  const { updateTournament } = useTournament();

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

          if (payload.new) {
            try {
              // Parse the data field which contains the tournament details
              const updatedTournamentData = payload.new.data;

              if (updatedTournamentData) {
                // Convert dates back to Date objects
                const parsedTournament = {
                  ...updatedTournamentData,
                  createdAt: new Date(updatedTournamentData.createdAt),
                  updatedAt: new Date(updatedTournamentData.updatedAt),
                  startDate: new Date(updatedTournamentData.startDate),
                  // Ensure matches also have their dates parsed
                  matches: updatedTournamentData.matches ? updatedTournamentData.matches.map((match: any) => ({
                    ...match,
                    scheduledTime: new Date(match.scheduledTime)
                  })) : []
                };

                console.log('Parsed tournament data:', parsedTournament);

                // Update the tournament using the context's updateTournament function
                await updateTournament(parsedTournament);

                toast({
                  title: 'Tournament updated',
                  description: 'Real-time update received from Supabase.',
                });
              } else {
                console.warn('Received a Supabase update without tournament data.');
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
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Supabase channel error for tournament ID: ${tournamentId}`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`Supabase timed out while subscribing to tournament ID: ${tournamentId}`);
        }
      });

    return () => {
      console.log(`Unsubscribing from tournament updates for ID: ${tournamentId}`);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, updateTournament]);
}
