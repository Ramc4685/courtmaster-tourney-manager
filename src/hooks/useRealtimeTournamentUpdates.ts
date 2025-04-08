import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tournament, Match, MatchStatus, Court } from '@/types/tournament';

interface UpdatesConfig {
  onMatchUpdate?: (match: Match) => void;
  onCourtUpdate?: (court: Court) => void;
  onTournamentUpdate?: (tournament: Tournament) => void;
  updateInterval?: number;
}

function useRealtimeTournamentUpdatesInternal(tournament: Tournament, config: UpdatesConfig) {
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<Date>(new Date());

  useEffect(() => {
    const pollForUpdates = async () => {
      try {
        const hasUpdates = tournament.updatedAt > lastUpdateRef.current;

        if (hasUpdates) {
          tournament.matches.forEach(match => {
            if (match.updatedAt && match.updatedAt > lastUpdateRef.current) {
              config.onMatchUpdate?.(match);
            }
          });

          tournament.courts.forEach(court => {
            if (court.updatedAt && court.updatedAt > lastUpdateRef.current) {
              config.onCourtUpdate?.(court);
            }
          });

          config.onTournamentUpdate?.(tournament);
          lastUpdateRef.current = new Date();
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    };

    updateIntervalRef.current = setInterval(pollForUpdates, config.updateInterval || 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [tournament, config]);
}


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
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);


  useEffect(() => {
    if (tournamentId) {
      const foundTournament = tournaments.find(t => t.id === tournamentId);
      setCurrentTournament(foundTournament || null);

      if (foundTournament) {
        const inProgress = foundTournament.matches.filter(
          match => match.status === "IN_PROGRESS" as MatchStatus
        );
        setInProgressMatches(inProgress);
      }
    }
  }, [tournamentId, tournaments]);

  useEffect(() => {
    if (currentTournament) {
      const config: UpdatesConfig = {
        onTournamentUpdate: (updatedTournament: Tournament) => {
          updateTournament(updatedTournament.id, updatedTournament);
          setLastUpdated(new Date());
          setCurrentTournament(updatedTournament);
          const inProgress = updatedTournament.matches.filter(
            match => match.status === "IN_PROGRESS" as MatchStatus
          );
          setInProgressMatches(inProgress);
          toast({
            title: "Tournament Updated",
            description: "Tournament data has been updated from the server.",
          });
        },
        onMatchUpdate: (updatedMatch: Match) => {
          //Handle individual match updates
          console.log("Match updated:", updatedMatch);
        },
        onCourtUpdate: (updatedCourt: Court) => {
          // Handle individual court updates
          console.log("Court updated:", updatedCourt);
        },
        updateInterval: 30000, // 30 seconds
      };
      useRealtimeTournamentUpdatesInternal(currentTournament, config);
      setIsConnected(true);
      setIsSubscribed(true);

      return () => {
        setIsConnected(false);
        setIsSubscribed(false);
      };
    }
  }, [currentTournament, toast, updateTournament]);

  return {
    isConnected,
    lastUpdated,
    currentTournament,
    inProgressMatches,
    isSubscribed
  };
};