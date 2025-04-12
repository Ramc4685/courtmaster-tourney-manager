import React, { useState, useEffect, useCallback } from 'react';
import { Match, MatchScores, ScoreSet, MatchStatus } from '@/types/entities';
import { matchService, profileService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Undo, Redo, Check } from 'lucide-react'; // Icons for future use
import { supabase } from "@/lib/supabase"; // Import supabase client
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'; // Import types
import { useScoringStore } from '@/stores/scoringStore'; // Import the new store

interface ScoringInterfaceProps {
  matchId: string;
  tournamentId: string; // Needed for context, fetching participants etc.
  onMatchComplete?: (match: Match) => void;
}

// Helper to get initial scores if null
const getInitialScores = (): MatchScores => ({
  currentSet: 1,
  sets: [{ set: 1, team1: 0, team2: 0, completed: false }],
});

export const ScoringInterface: React.FC<ScoringInterfaceProps> = ({ 
  matchId,
  tournamentId,
  onMatchComplete 
}) => {
  // --- Use Zustand Store --- 
  const {
    activeMatchData: match, // Get match data from store
    isLoading,
    error,
    setActiveMatch,
    updateScore,
    setLoading,
    setError
  } = useScoringStore();
  
  // Local state for participant names (fetching logic still needed)
  const [participant1Name, setParticipant1Name] = useState('Player 1 / Team 1');
  const [participant2Name, setParticipant2Name] = useState('Player 2 / Team 2');
  const { toast } = useToast();

  // --- Fetch Initial Match Data & Participant Names ---
  const fetchMatchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const fetchedMatch = await matchService.getMatch(matchId);
      setActiveMatch(fetchedMatch); // Set initial data in the store
      
      // TODO: Fetch actual participant names based on player/team IDs
      // This requires fetching profiles or teams
      if (fetchedMatch.player1_id) {
         // const p1Profile = await profileService.getProfile(fetchedMatch.player1_id);
         // setParticipant1Name(p1Profile.display_name || p1Profile.full_name || 'Player 1');
      } else if (fetchedMatch.team1_id) {
         // const team1 = await teamService.getTeam(fetchedMatch.team1_id);
         // setParticipant1Name(team1.name || 'Team 1');
      }
      if (fetchedMatch.player2_id) {
         // const p2Profile = await profileService.getProfile(fetchedMatch.player2_id);
         // setParticipant2Name(p2Profile.display_name || p2Profile.full_name || 'Player 2');
      } else if (fetchedMatch.team2_id) {
        // const team2 = await teamService.getTeam(fetchedMatch.team2_id);
        // setParticipant2Name(team2.name || 'Team 2');
      }

    } catch (err) {
      console.error("Failed to fetch match data:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load match data';
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [matchId, toast, setActiveMatch, setLoading, setError]); // Add store setters to deps

  useEffect(() => {
    // Fetch data only if the store doesn't have it or if ID changed
    if (!match || match.id !== matchId) {
        console.log(`Fetching initial data for match ${matchId}`);
        fetchMatchData(); 
    }

    // --- Realtime Subscription ---
    const handleMatchUpdate = (payload: RealtimePostgresChangesPayload<Match>) => {
      if (payload.eventType === 'UPDATE' && payload.new.id === matchId) {
        console.log(`Realtime update for current match ${matchId}, updating store...`);
        // Directly update the store with the new data
        setActiveMatch(payload.new as Match);
      }
    };

    const channel = supabase
      .channel(`public:matches:id=eq.${matchId}`)
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
          handleMatchUpdate
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to match ${matchId} updates!`);
            // Optional: Refetch data upon successful subscription to ensure consistency
            if (!match || match.id !== matchId) fetchMatchData(false);
         } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Match ${matchId} subscription error:`, status, err);
            setError('Realtime connection error for match scores.');
         }
      });

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log(`Unsubscribed from match ${matchId} updates`);
      }
      // Optionally clear the store when component unmounts?
      // setActiveMatch(null); 
    };

  }, [matchId, match, fetchMatchData, setActiveMatch, setError]); // Add match and store setters

  // --- Online/Offline Handling ---
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is back online. Refetching match data.');
      toast({ title: "Back Online", description: "Refreshing match data..." });
      fetchMatchData(false); // Refetch without showing loader
      // TODO: Trigger sync for any queued offline actions here
    };
    
    const handleOffline = () => {
      console.log('App is offline.');
      toast({ variant: "destructive", title: "Offline", description: "You are currently offline. Score updates may be delayed." });
      // TODO: Potentially switch to offline mode, queue updates
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
       handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchMatchData, toast]); // fetchMatchData is stable due to useCallback

  // --- Scoring Logic --- 
  const handleScore = async (teamIndex: 1 | 2) => {
    if (!match) return;

    const matchBeforeUpdate = match; // Reference to current store state for potential revert
    let updatedScores = match.scores ? JSON.parse(JSON.stringify(match.scores)) : getInitialScores();
    let setIndex = updatedScores.sets.findIndex(s => s.set === updatedScores.currentSet);
    if (setIndex === -1) {
        updatedScores.sets.push({ set: updatedScores.currentSet, team1: 0, team2: 0, completed: false });
        setIndex = updatedScores.sets.length - 1;
    }
    
    if (updatedScores.sets[setIndex].completed || match.status === 'completed') {
        toast({ variant: "default", title: "Info", description: "Match or set already completed." });
        return;
    }

    // --- TODO: Implement Actual Scoring Rules (Task 8.3) --- 
    if (teamIndex === 1) {
      updatedScores.sets[setIndex].team1 += 1;
    } else {
      updatedScores.sets[setIndex].team2 += 1;
    }
    let newMatchStatus = match.status;
    // TODO: Update status based on rules...
    // --- End Placeholder --- 

    // --- Optimistic UI Update via Store --- 
    updateScore(updatedScores); // Update score in store
    if(newMatchStatus !== match.status) {
        // If status changed, update the whole match object in store
        setActiveMatch({ ...match, scores: updatedScores, status: newMatchStatus });
    } 
    // --- End Optimistic Update --- 

    // --- Asynchronous Backend Update --- 
    try {
      await matchService.updateMatch(match.id, { scores: updatedScores, status: newMatchStatus });
    } catch (err) {
      console.error("Failed to update score:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not save score update. Reverting." });
      // Revert store state on error
      setActiveMatch(matchBeforeUpdate);
    }
    // --- End Backend Update --- 
  };

  // --- Render Logic --- 
  if (isLoading && !match) return <div>Loading scoring interface...</div>; // Show loading only if no data yet
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!match) return <div>Match not found or not active.</div>;

  // Use match data from the store for rendering
  const scores = match.scores || getInitialScores();
  const currentSetData = scores.sets.find(s => s.set === scores.currentSet) || scores.sets[scores.sets.length - 1];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Scoring Match: {match.round_number}-{match.match_number}</CardTitle>
        {/* TODO: Add Division Name */} 
        <div className="text-sm text-muted-foreground pt-2">
           {participant1Name} vs {participant2Name}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */} 
        <div className="flex justify-around items-center text-center p-4 border rounded-lg">
          {/* Team 1 Score */} 
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground truncate px-2">{participant1Name}</div>
            <div className="text-6xl font-bold my-2">{currentSetData?.team1 ?? 0}</div>
            {/* TODO: Display game scores if applicable */}
          </div>
          {/* Set Separator/Info */}
          <div className="text-center px-2">
            <div className="text-xs font-semibold text-muted-foreground">SET</div>
            <div className="text-4xl font-bold">{scores.currentSet}</div>
            {/* TODO: Display server indicator */} 
          </div>
          {/* Team 2 Score */} 
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground truncate px-2">{participant2Name}</div>
            <div className="text-6xl font-bold my-2">{currentSetData?.team2 ?? 0}</div>
             {/* TODO: Display game scores if applicable */}
          </div>
        </div>

        {/* Previous Set Scores */} 
        {scores.sets.length > 1 && (
          <div className="text-center text-xs text-muted-foreground space-x-2">
            <span>Previous Sets:</span>
            {scores.sets.filter(s => s.completed).map(s => (
              <span key={s.set}>{s.team1}-{s.team2}</span>
            ))}
          </div>
        )}

        {/* Scoring Buttons */} 
        {match.status !== 'completed' && (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 text-xl" 
              onClick={() => handleScore(1)} 
              // disabled={isLoading || currentSetData?.completed}
            >
              Point<br/>{participant1Name}
            </Button>
            <Button 
              variant="outline" 
              className="h-24 text-xl" 
              onClick={() => handleScore(2)} 
              // disabled={isLoading || currentSetData?.completed}
            >
               Point<br/>{participant2Name}
            </Button>
          </div>
        )}

         {/* Control Buttons (Future) */} 
         <div className="flex justify-center gap-4 pt-4">
           <Button variant="outline" size="icon" disabled>
             <Undo className="h-4 w-4" />
           </Button>
           <Button variant="outline" size="icon" disabled>
             <Redo className="h-4 w-4" />
           </Button>
           {/* TODO: Button to manually complete match? */} 
           {match.status !== 'completed' && (
             <Button variant="destructive" disabled>End Match</Button>
           )}
         </div>

      </CardContent>
    </Card>
  );
}; 