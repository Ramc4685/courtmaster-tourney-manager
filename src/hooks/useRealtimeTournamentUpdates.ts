
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tournament, Match, MatchStatus } from '@/types/tournament';

/**
 * Hook to handle real-time tournament updates using WebSockets or polling
 */
export const useRealtimeTournamentUpdates = (tournamentId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [inProgressMatches, setInProgressMatches] = useState<Match[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();
  const { tournaments, updateTournament } = useTournament();
  const intervalRef = useRef<number | null>(null);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    // Find the tournament when the ID changes
    if (tournamentId) {
      const foundTournament = tournaments.find(t => t.id === tournamentId);
      setCurrentTournament(foundTournament || null);
      
      if (foundTournament) {
        // Filter matches that are in progress
        const inProgress = foundTournament.matches.filter(
          match => match.status === "IN_PROGRESS" as MatchStatus
        );
        setInProgressMatches(inProgress);
      }
    }
  }, [tournamentId, tournaments]);

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
            updateTournament(updatedTournament.id, {
              updatedAt: new Date()
            });
            
            setLastUpdated(new Date());
            setCurrentTournament(updatedTournament);
            
            // Update in-progress matches
            const inProgress = updatedTournament.matches.filter(
              match => match.status === "IN_PROGRESS" as MatchStatus
            );
            setInProgressMatches(inProgress);
            
            toast({
              title: "Tournament Updated",
              description: "Tournament data has been updated from the server.",
            });
          }
        }
      }, pollInterval);
      
      intervalRef.current = pollId;
      setIsConnected(true);
      setIsSubscribed(true);
    };
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
      setIsSubscribed(false);
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
    lastUpdated,
    currentTournament,
    inProgressMatches,
    isSubscribed
  };
};
