
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tournament } from '@/types/tournament';

/**
 * Hook to handle real-time tournament updates using WebSockets or polling
 */
export const useRealtimeTournamentUpdates = (tournamentId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  const { tournaments, updateTournament } = useTournament();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Mock implementation using polling instead of WebSockets
    const pollInterval = 30000; // 30 seconds
    
    const startPolling = () => {
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up polling
      const pollId = window.setInterval(() => {
        console.log(`Polling for tournament ${tournamentId} updates...`);
        
        // In a real implementation, this would call an API
        // For now, we'll just simulate updates occasionally
        if (Math.random() > 0.7) { // 30% chance of an update
          const currentTournament = tournaments.find(t => t.id === tournamentId);
          if (currentTournament) {
            // Simulate receiving an updated tournament
            const updatedTournament: Tournament = {
              ...currentTournament,
              updatedAt: new Date()
            };
            
            // Fix the parameter issue - Pass id and data
            const { id, ...data } = updatedTournament;
            updateTournament(id, data);
            
            setLastUpdated(new Date());
            
            toast({
              title: "Tournament Updated",
              description: "Tournament data has been updated from the server.",
            });
          }
        }
      }, pollInterval);
      
      intervalRef.current = pollId;
      setIsConnected(true);
    };
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };
    
    if (tournamentId) {
      startPolling();
      
      return () => {
        stopPolling();
      };
    }
  }, [tournamentId, toast, tournaments, updateTournament]);
  
  return {
    isConnected,
    lastUpdated
  };
};
