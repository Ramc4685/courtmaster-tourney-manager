import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Update import for useTournament
import { useTournament } from '@/contexts/tournament/useTournament';
import { Match } from '@/types/tournament';

/**
 * Hook to listen for real-time scoring updates for a specific match
 */
export function useRealtimeScoring(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const { currentTournament } = useTournament();

  useEffect(() => {
    if (!supabase || !currentTournament) {
      console.log('[DEBUG] Supabase client not available, skipping real-time updates');
      return;
    }

    console.log(`[DEBUG] Setting up real-time listener for match ID: ${matchId}`);

    const channel = supabase
      .channel(`match_updates_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${currentTournament.id}`,
        },
        (payload) => {
          console.log('[DEBUG] Received payload:', payload);
          if (payload.new) {
            try {
              const updatedTournamentData = JSON.parse(payload.new.data);
              const updatedMatch = updatedTournamentData.matches.find((m: Match) => m.id === matchId);

              if (updatedMatch) {
                console.log(`[DEBUG] Match ${matchId} updated in real-time`);
                setMatch(updatedMatch);
              } else {
                console.log(`[DEBUG] Match ${matchId} not found in updated tournament data`);
              }
            } catch (error) {
              console.error('Error parsing tournament data:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[DEBUG] Successfully subscribed to channel: match_updates_${matchId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[ERROR] Channel error for match_updates_${matchId}`);
        } else if (status === 'CLOSED') {
          console.warn(`[WARN] Channel closed for match_updates_${matchId}`);
        }
      });

    return () => {
      console.log(`[DEBUG] Removing real-time listener for match ID: ${matchId}`);
      supabase.removeChannel(channel);
    };
  }, [matchId, currentTournament]);

  return match;
}

