import { useEffect, useState } from 'react';
import { subscribeToMatches } from '@/lib/appwrite';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Match } from '@/types/tournament';

/**
 * Hook to listen for real-time scoring updates for a specific match
 */
export function useRealtimeScoring(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const { currentTournament } = useTournament();

  useEffect(() => {
    if (!subscribeToMatches || !currentTournament) {
      console.log('[DEBUG] Appwrite realtime not available, skipping real-time updates');
      return;
    }

    console.log(`[DEBUG] Setting up real-time listener for match ID: ${matchId}`);

    // Subscribe to match updates using Appwrite
    const unsubscribe = subscribeToMatches(
      currentTournament.id,
      (payload) => {
        console.log('[DEBUG] Match update payload:', payload);

        // Find the match in the updated tournament data
        if (payload.events.includes('databases.*.collections.*.documents.*')) {
          try {
            // Safely check if data property exists and parse it
            const newData = payload as Record<string, any>;
            if (newData.data) {
              const updatedTournamentData = typeof newData.data === 'string'
                ? JSON.parse(newData.data)
                : newData.data;

              const updatedMatch = updatedTournamentData.matches?.find((m: Match) => m.id === matchId);

              if (updatedMatch) {
                console.log(`[DEBUG] Match ${matchId} updated in real-time`);
                setMatch(updatedMatch);
              } else {
                console.log(`[DEBUG] Match ${matchId} not found in updated tournament data`);
              }
            }
          } catch (error) {
            console.error('Error parsing tournament data:', error);
          }
        }
      }
    );

    return () => {
      console.log(`[DEBUG] Removing real-time listener for match ID: ${matchId}`);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [matchId, currentTournament]);

  return match;
}
