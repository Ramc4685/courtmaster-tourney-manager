import React, { useState, useEffect, useCallback } from 'react';
import { Match, MatchScores, ScoreSet, MatchStatus, NotificationType } from "@/types/entities"; // Added NotificationType
import { matchService, profileService, teamService, notificationService } from "@/services/api"; // Added notificationService
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Undo, Redo, Check, CircleDot } from 'lucide-react'; // Added CircleDot for server indicator
import { supabase } from "@/lib/supabase";
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useScoringStore } from '@/stores/scoringStore';
import { Tournament } from '@/types/tournament'; // Import Tournament type for settings
import { calculateMatchWinner, calculateSetWinner, isMatchComplete, isSetComplete } from '@/utils/scoringRules'; // Import scoring logic utils

interface ScoringInterfaceProps {
  matchId: string;
  tournament: Tournament; // Pass the full tournament object for settings
  onMatchComplete?: (match: Match) => void;
}

// Helper to get initial scores if null
const getInitialScores = (): MatchScores => ({
  currentSet: 1,
  sets: [{ set: 1, team1: 0, team2: 0, completed: false }],
  // Add server tracking if needed by rules
  // servingTeam: 1, 
});

export const ScoringInterface: React.FC<ScoringInterfaceProps> = ({ 
  matchId,
  tournament,
  onMatchComplete 
}) => {
  // --- Use Zustand Store --- 
  const {
    activeMatchData: match,
    isLoading,
    error,
    setActiveMatch,
    updateScoreAndStatus, // Use combined action
    setLoading,
    setError,
    addScoreHistory, // For undo/redo
    undoScore, // For undo/redo
    redoScore, // For undo/redo
  } = useScoringStore();
  
  // Local state for participant names
  const [participant1Name, setParticipant1Name] = useState('Player 1 / Team 1');
  const [participant2Name, setParticipant2Name] = useState('Player 2 / Team 2');
  const { toast } = useToast();

  // --- Fetch Initial Match Data & Participant Names ---
  const fetchMatchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      console.log(`[ScoringInterface] Fetching match data for ${matchId}`);
      const fetchedMatch = await matchService.getMatch(matchId);
      setActiveMatch(fetchedMatch); // Set initial data in the store
      
      // Fetch participant names
      try {
        if (fetchedMatch.player1_id) {
          const p1Profile = await profileService.getProfile(fetchedMatch.player1_id);
          setParticipant1Name(p1Profile?.display_name || p1Profile?.full_name || 'Player 1');
        } else if (fetchedMatch.team1_id) {
          const team1 = await teamService.getTeam(fetchedMatch.team1_id);
          setParticipant1Name(team1?.name || 'Team 1');
        }
        if (fetchedMatch.player2_id) {
          const p2Profile = await profileService.getProfile(fetchedMatch.player2_id);
          setParticipant2Name(p2Profile?.display_name || p2Profile?.full_name || 'Player 2');
        } else if (fetchedMatch.team2_id) {
          const team2 = await teamService.getTeam(fetchedMatch.team2_id);
          setParticipant2Name(team2?.name || 'Team 2');
        }
      } catch (nameError) {
         console.error("[ScoringInterface] Error fetching participant names:", nameError);
         // Keep default names if fetching fails
      }

    } catch (err) {
      console.error("[ScoringInterface] Failed to fetch match data:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load match data';
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [matchId, toast, setActiveMatch, setLoading, setError]);

  useEffect(() => {
    // Fetch data only if the store doesn't have it or if ID changed
    if (!match || match.id !== matchId) {
        console.log(`[ScoringInterface] Initializing for match ${matchId}`);
        fetchMatchData(); 
    }

    // --- Realtime Subscription ---
    const handleMatchUpdate = (payload: RealtimePostgresChangesPayload<Match>) => {
      if (payload.eventType === 'UPDATE' && payload.new.id === matchId) {
        console.log(`[ScoringInterface] Realtime update for current match ${matchId}, updating store...`);
        // Check if the update is different from the current store state to avoid loops
        const currentStoreMatch = useScoringStore.getState().activeMatchData;
        if (JSON.stringify(payload.new) !== JSON.stringify(currentStoreMatch)) {
             setActiveMatch(payload.new as Match);
        } else {
             console.log(`[ScoringInterface] Realtime update identical to current state, skipping store update.`);
        }
      }
    };

    const channel = supabase
      .channel(`public:matches:id=eq.${matchId}`)
      .on<Match>('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
          handleMatchUpdate
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
            console.log(`[ScoringInterface] Subscribed to match ${matchId} updates!`);
            // Refetch data upon successful subscription if needed to ensure consistency
            if (!match || match.id !== matchId) fetchMatchData(false);
         } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`[ScoringInterface] Match ${matchId} subscription error:`, status, err);
            setError('Realtime connection error for match scores.');
         }
      });

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log(`[ScoringInterface] Unsubscribed from match ${matchId} updates`);
      }
    };

  }, [matchId, match, fetchMatchData, setActiveMatch, setError]);

  // --- Online/Offline Handling ---
  useEffect(() => {
    const handleOnline = () => {
      console.log('[ScoringInterface] App is back online. Refetching match data.');
      toast({ title: "Back Online", description: "Refreshing match data..." });
      fetchMatchData(false); // Refetch without showing loader
    };
    
    const handleOffline = () => {
      console.log('[ScoringInterface] App is offline.');
      toast({ variant: "destructive", title: "Offline", description: "You are currently offline. Score updates may be delayed." });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchMatchData, toast]);

  // --- Scoring Logic --- 
  const handleScore = async (teamIndex: 1 | 2) => {
    if (!match || !tournament?.scoring) return; // Check for tournament.scoring

    const currentScores = match.scores ? JSON.parse(JSON.stringify(match.scores)) : getInitialScores();
    const scoringSettings = tournament.scoring; // Use the correct path

    // Check if match/set is already completed
    if (match.status === MatchStatus.COMPLETED || currentScores.sets.find(s => s.set === currentScores.currentSet)?.completed) {
        toast({ variant: "default", title: "Info", description: "Match or current set already completed." });
        return;
    }

    // Add current state to history before modification
    addScoreHistory(currentScores);

    let updatedScores = currentScores;
    let setIndex = updatedScores.sets.findIndex(s => s.set === updatedScores.currentSet);
    if (setIndex === -1) {
        updatedScores.sets.push({ set: updatedScores.currentSet, team1: 0, team2: 0, completed: false });
        setIndex = updatedScores.sets.length - 1;
    }
    
    // Increment score
    if (teamIndex === 1) {
      updatedScores.sets[setIndex].team1 += 1;
    } else {
      updatedScores.sets[setIndex].team2 += 1;
    }

    // Check for set completion
    const setWinner = calculateSetWinner(updatedScores.sets[setIndex], scoringSettings);
    if (setWinner) {
      updatedScores.sets[setIndex].completed = true;
      updatedScores.sets[setIndex].winner = setWinner;
      console.log(`[ScoringInterface] Set ${updatedScores.currentSet} completed. Winner: Team ${setWinner}`);
      
      // Check for match completion
      const matchWinner = calculateMatchWinner(updatedScores.sets, scoringSettings);
      if (matchWinner) {
        console.log(`[ScoringInterface] Match completed. Winner: Team ${matchWinner}`);
        const newMatchStatus = MatchStatus.COMPLETED;
        const winnerId = matchWinner === 1 ? (match.player1_id || match.team1_id) : (match.player2_id || match.team2_id);
        const loserId = matchWinner === 1 ? (match.player2_id || match.team2_id) : (match.player1_id || match.team1_id);
        
        // Optimistic UI Update via Store
        updateScoreAndStatus(updatedScores, newMatchStatus, winnerId, loserId);
        
        // Asynchronous Backend Update
        try {
          const updatedMatch = await matchService.updateMatch(match.id, { scores: updatedScores, status: newMatchStatus, winner_id: winnerId, loser_id: loserId });
          if (onMatchComplete) onMatchComplete(updatedMatch);

          // --- Send Notifications ---
          try {
            // Fetch participant user IDs (assuming player IDs are user IDs)
            // TODO: Handle team logic - fetch team members if team IDs are used
            const winnerUserId = matchWinner === 1 ? match.player1_id : match.player2_id;
            const loserUserId = matchWinner === 1 ? match.player2_id : match.player1_id;
            const winnerName = matchWinner === 1 ? participant1Name : participant2Name;
            const loserName = matchWinner === 1 ? participant2Name : participant1Name;

            if (winnerUserId) {
              await notificationService.createNotification({
                user_id: winnerUserId,
                title: `Match Won in ${tournament.name}! 🎉`,
                message: `Congratulations! You won your match against ${loserName}. Final score details available.`, // TODO: Add score details?
                type: NotificationType.MATCH_RESULT,
                related_entity_id: match.id,
                related_entity_type: "match",
              });
            }
            if (loserUserId) {
              await notificationService.createNotification({
                user_id: loserUserId,
                title: `Match Result in ${tournament.name}`,
                message: `Match completed against ${winnerName}. Check the results for details.`, // TODO: Add score details?
                type: NotificationType.MATCH_RESULT,
                related_entity_id: match.id,
                related_entity_type: "match",
              });
            }
            console.log(`[ScoringInterface] Match completion notifications sent for match ${match.id}`);
          } catch (notificationError) {
            console.error("[ScoringInterface] Failed to send match completion notifications:", notificationError);
            // Don't block UI for notification errors, just log it
            toast({ variant: "default", title: "Notification Error", description: "Could not send match result notifications." });
          }
          // --- End Send Notifications ---

        } catch (err) {
          console.error("[ScoringInterface] Failed to update final match score/status:", err);
          toast({ variant: "destructive", title: "Error", description: "Could not save final match result. Please try again." });
          // Consider reverting store state here if needed
        }
        return; // Stop further processing if match is complete
      } else {
        // Match not complete, start next set
        updatedScores.currentSet += 1;
        // Ensure the next set exists in the array
        if (!updatedScores.sets.find(s => s.set === updatedScores.currentSet)) {
             updatedScores.sets.push({ set: updatedScores.currentSet, team1: 0, team2: 0, completed: false });
        }
      }
    }

    // --- Optimistic UI Update via Store (if match not completed) --- 
    updateScoreAndStatus(updatedScores, match.status); // Update score in store, keep status
    
    // --- Asynchronous Backend Update --- 
    try {
      await matchService.updateMatch(match.id, { scores: updatedScores });
    } catch (err) {
      console.error("[ScoringInterface] Failed to update score:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not save score update. Attempting to undo." });
      // Attempt to revert store state on error using undo
      undoScore(); 
    }
  };

  const handleUndo = () => {
      const success = undoScore();
      if (success) {
          // TODO: Send undone state to backend? Or rely on next score update?
          // For simplicity, we might just let the next score update overwrite.
          toast({ title: "Undo Successful", description: "Last score action reverted." });
      } else {
          toast({ variant: "default", title: "Undo Failed", description: "No previous score state available." });
      }
  }
  
  const handleRedo = () => {
      const success = redoScore();
       if (success) {
          // TODO: Send redone state to backend?
          toast({ title: "Redo Successful", description: "Last undone action restored." });
      } else {
          toast({ variant: "default", title: "Redo Failed", description: "No future score state available." });
      }
  }

  // --- Render Logic --- 
  if (isLoading && !match) return <div>Loading scoring interface...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!match || !tournament?.settings?.scoring) return <div>Match data or tournament scoring settings not found.</div>;

  const scores = match.scores || getInitialScores();
  const currentSetData = scores.sets.find(s => s.set === scores.currentSet) || scores.sets[scores.sets.length - 1];
  const isCurrentSetComplete = currentSetData?.completed || false;
  const isMatchOver = match.status === MatchStatus.COMPLETED;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Scoring Match: {match.round_name || `R${match.round_number}`}-{match.match_number}</CardTitle>
        <CardDescription>
           {tournament.name} - {match.category_name || 'Default Category'}
        </CardDescription>
        <div className="text-sm text-muted-foreground pt-2">
           {participant1Name} vs {participant2Name}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */} 
        <div className="flex justify-around items-center text-center p-4 border rounded-lg relative">
          {/* Team 1 Score */} 
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground truncate px-2">{participant1Name}</div>
            <div className="text-6xl font-bold my-2">{currentSetData?.team1 ?? 0}</div>
            {/* TODO: Display game scores if applicable */} 
            {/* TODO: Server Indicator */} 
            {/* {scores.servingTeam === 1 && <CircleDot className="h-4 w-4 absolute top-2 left-2 text-primary" />} */} 
          </div>
          {/* Set Separator/Info */} 
          <div className="text-center px-2">
            <div className="text-xs font-semibold text-muted-foreground">SET</div>
            <div className="text-4xl font-bold">{scores.currentSet}</div>
          </div>
          {/* Team 2 Score */} 
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground truncate px-2">{participant2Name}</div>
            <div className="text-6xl font-bold my-2">{currentSetData?.team2 ?? 0}</div>
             {/* TODO: Display game scores if applicable */} 
             {/* TODO: Server Indicator */} 
             {/* {scores.servingTeam === 2 && <CircleDot className="h-4 w-4 absolute top-2 right-2 text-primary" />} */} 
          </div>
        </div>

        {/* Previous Set Scores */} 
        {scores.sets.length > 0 && scores.sets.some(s => s.completed) && (
          <div className="text-center text-xs text-muted-foreground space-x-2">
            <span>Set Scores:</span>
            {scores.sets.filter(s => s.set !== scores.currentSet || s.completed).map(s => (
              <span key={s.set} className={s.completed ? 'font-semibold' : ''}>{s.team1}-{s.team2}</span>
            ))}
          </div>
        )}

        {/* Match Winner Display */} 
        {isMatchOver && (
            <div className="text-center font-bold text-lg text-green-600 p-4 border border-green-600 rounded-lg">
                Match Complete! Winner: {match.winner_id === (match.player1_id || match.team1_id) ? participant1Name : participant2Name}
            </div>
        )}

        {/* Scoring Buttons */} 
        {!isMatchOver && (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 text-xl" 
              onClick={() => handleScore(1)} 
              disabled={isLoading || isCurrentSetComplete} // Disable if loading or set complete
            >
              Point<br/>{participant1Name}
            </Button>
            <Button 
              variant="outline" 
              className="h-24 text-xl" 
              onClick={() => handleScore(2)} 
              disabled={isLoading || isCurrentSetComplete} // Disable if loading or set complete
            >
               Point<br/>{participant2Name}
            </Button>
          </div>
        )}

         {/* Control Buttons */} 
         <div className="flex justify-center gap-4 pt-4">
           <Button variant="outline" size="icon" onClick={handleUndo} disabled={isLoading || isMatchOver}>
             <Undo className="h-4 w-4" />
           </Button>
           <Button variant="outline" size="icon" onClick={handleRedo} disabled={isLoading || isMatchOver}>
             <Redo className="h-4 w-4" />
           </Button>
           {/* TODO: Button to manually complete match? */} 
           {!isMatchOver && (
             <Button variant="secondary" disabled>Options</Button> // Placeholder for future options
           )}
         </div>

      </CardContent>
    </Card>
  );
};
