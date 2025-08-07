import React, { useState, useEffect, useCallback } from 'react';
import { Match, MatchScores, ScoreSet, MatchStatus } from "@/types/entities"; 
import { NotificationType } from "@/types/tournament-enums"; 
import { matchService, profileService, notificationService } from "@/services/api"; 
import { realtime, COLLECTIONS } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { Undo, Redo, Check, CircleDot } from 'lucide-react'; 

import { useScoringStore } from '@/stores/scoringStore';
import { Tournament } from '@/types/tournament'; 
import { calculateMatchWinner, calculateSetWinner, isMatchComplete, isSetComplete } from '@/utils/scoringRules'; 

interface ScoringInterfaceProps {
  matchId: string;
  tournament: Tournament; 
  onMatchComplete?: (match: Match) => void;
}

const getInitialScores = (): MatchScores => ({
  current_set: 1,
  sets: [{ team1: 0, team2: 0, completed: false }],
});

export const ScoringInterface: React.FC<ScoringInterfaceProps> = ({ 
  matchId,
  tournament,
  onMatchComplete 
}) => {
  const {
    activeMatchData: match,
    isLoading,
    error,
    setActiveMatch,
    updateScoreAndStatus,
    setLoading,
    setError,
    addScoreHistory,
    undoScore,
    redoScore,
  } = useScoringStore();
  
  const [participant1Name, setParticipant1Name] = useState('Player 1 / Team 1');
  const [participant2Name, setParticipant2Name] = useState('Player 2 / Team 2');
  const { toast } = useToast();

  const fetchMatchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      console.log(`[ScoringInterface] Fetching match data for ${matchId}`);
      const fetchedMatch = await matchService.getMatch(matchId, {});
      setActiveMatch(fetchedMatch); 
      
      try {
        if (fetchedMatch.team1_player1) {
          const p1Profile = await profileService.getProfile(fetchedMatch.team1_player1);
          if (p1Profile) setParticipant1Name(p1Profile.full_name || p1Profile.display_name || 'Player 1');
        }
        if (fetchedMatch.team2_player1) {
          const p2Profile = await profileService.getProfile(fetchedMatch.team2_player1);
          if (p2Profile) setParticipant2Name(p2Profile.full_name || p2Profile.display_name || 'Player 2');
        }
        // Handle team names if needed
        if (fetchedMatch.team1Id) {
          // TODO: Fetch team name from team service
          setParticipant1Name(`Team ${fetchedMatch.team1Id.substring(0, 5)}`);
        }
        if (fetchedMatch.team2Id) {
          // TODO: Fetch team name from team service
          setParticipant2Name(`Team ${fetchedMatch.team2Id.substring(0, 5)}`);
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
    if (!match || match.id !== matchId) {
        console.log(`[ScoringInterface] Initializing for match ${matchId}`);
        fetchMatchData(); 
    }

    const handleMatchUpdate = (payload: any) => {
      if (payload.events && payload.events.includes('database.documents.update') && payload.payload.$id === matchId) {
        console.log(`[ScoringInterface] Realtime update for current match ${matchId}, updating store...`);
        const currentStoreMatch = useScoringStore.getState().activeMatchData;
        if (JSON.stringify(payload.payload) !== JSON.stringify(currentStoreMatch)) {
             setActiveMatch(payload.payload as Match);
        } else {
             console.log(`[ScoringInterface] Realtime update identical to current state, skipping store update.`);
        }
      }
    };

    const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
    const unsubscribe = realtime.subscribe(`databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTIONS.MATCHES}.documents.${matchId}`, (response) => {
      if (response.events && response.events.includes('database.documents.update')) {
        handleMatchUpdate(response);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log(`[ScoringInterface] Unsubscribed from match ${matchId} updates`);
      }
    };

  }, [matchId, match, fetchMatchData, setActiveMatch, setError]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[ScoringInterface] App is back online. Refetching match data.');
      toast({ title: "Back Online", description: "Refreshing match data..." });
      fetchMatchData(false); 
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

  const handleScore = async (teamIndex: 1 | 2) => {
    if (!match || !tournament?.scoring) return; 

    const currentScores = match.scores ? JSON.parse(JSON.stringify(match.scores)) : getInitialScores();
    const scoringSettings = tournament.scoring; 

    if (match.status === MatchStatus.COMPLETED || currentScores.sets[currentScores.current_set - 1]?.completed) {
        toast({ variant: "default", title: "Info", description: "Match or current set already completed." });
        return;
    }

    addScoreHistory(currentScores);

    let updatedScores = currentScores;
    const currentSetIndex = updatedScores.current_set - 1;
    
    // Increment score
    if (teamIndex === 1) {
      updatedScores.sets[currentSetIndex].team1 += 1;
    } else {
      updatedScores.sets[currentSetIndex].team2 += 1;
    }

    // Check for set completion
    const setWinner = calculateSetWinner(updatedScores.sets[currentSetIndex], scoringSettings);
    if (setWinner) {
      updatedScores.sets[currentSetIndex].completed = true;
      updatedScores.sets[currentSetIndex].winner = setWinner;
      console.log(`[ScoringInterface] Set ${updatedScores.current_set} completed. Winner: Team ${setWinner}`);
      
      // Check for match completion
      const matchWinner = calculateMatchWinner(updatedScores.sets, scoringSettings);
      if (matchWinner) {
        console.log(`[ScoringInterface] Match completed. Winner: Team ${matchWinner}`);
        const newMatchStatus = MatchStatus.COMPLETED;
        let winnerId: string | null = null;
        let loserId: string | null = null;
        
        if (matchWinner === 1) {
          winnerId = match.team1_player1 || match.team1Id || null;
          loserId = match.team2_player1 || match.team2Id || null;
        } else {
          winnerId = match.team2_player1 || match.team2Id || null;
          loserId = match.team1_player1 || match.team1Id || null;
        }
        
        // Optimistic UI Update via Store
        updateScoreAndStatus(updatedScores, newMatchStatus, winnerId, loserId);
        
        // Asynchronous Backend Update
        try {
          const updatedMatch = await matchService.updateMatch(match.id, { 
            scores: updatedScores, 
            status: newMatchStatus, 
            winner_id: winnerId, 
            loser_id: loserId 
          }, {});
          
          if (onMatchComplete) onMatchComplete(updatedMatch);

          // Check if we need to send notifications to players
          if (isMatchComplete(updatedMatch.scores)) {
            // Determine winner and loser IDs
            let winnerIds: string[] = [];
            let loserIds: string[] = [];
            
            if (match.team1_player1 && match.team2_player1) {
              // Singles match
              winnerIds = matchWinner === 1 ? [match.team1_player1] : [match.team2_player1];
              loserIds = matchWinner === 1 ? [match.team2_player1] : [match.team1_player1];
            } else if (match.team1Id && match.team2Id) {
              // Doubles match - need to get team members
              const winnerTeamId = matchWinner === 1 ? match.team1Id : match.team2Id;
              const loserTeamId = matchWinner === 1 ? match.team2Id : match.team1Id;
              
              // Get team members (simplified for now)
              // In a real app, you'd fetch these from your team service
              // winnerIds = await teamService.getTeamMemberIds(winnerTeamId);
              // loserIds = await teamService.getTeamMemberIds(loserTeamId);
            }
            
            // Send notifications
            for (const winnerId of winnerIds) {
              await notificationService.createNotification({
                user_id: winnerId,
                title: 'Match Result',
                message: `Congratulations! You won your match.`,
                type: NotificationType.SCORE_UPDATE,
                related_entity_id: match.id,
                related_entity_type: 'match'
              });
            }
            
            for (const loserId of loserIds) {
              await notificationService.createNotification({
                user_id: loserId,
                title: 'Match Result',
                message: `Your match has ended. Thank you for playing!`,
                type: NotificationType.SCORE_UPDATE,
                related_entity_id: match.id,
                related_entity_type: 'match'
              });
            }
          }
          console.log(`[ScoringInterface] Match completion notifications sent for match ${match.id}`);
        } catch (err) {
          console.error("[ScoringInterface] Failed to update match or send notifications:", err);
          toast({ 
            variant: "destructive", 
            title: "Error", 
            description: "Could not save match completion. Please try again." 
          });
          // Consider reverting store state here if needed
        }
        return; // Stop further processing if match is complete
      }
      
      // If set is complete but match is not, start next set
      if (setWinner) {
        updatedScores.current_set += 1;
        // Ensure the next set exists in the array
        if (updatedScores.sets.length < updatedScores.current_set) {
          updatedScores.sets.push({ team1: 0, team2: 0, completed: false });
        }
      }
    }

    // --- Optimistic UI Update via Store (if match not completed) --- 
    updateScoreAndStatus(updatedScores, match.status); // Update score in store, keep status
    
    // --- Asynchronous Backend Update --- 
    try {
      await matchService.updateMatch(match.id, { scores: updatedScores }, {});
    } catch (err) {
      console.error("[ScoringInterface] Failed to update score:", err);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Could not save score update. Attempting to undo." 
      });
      // Attempt to revert store state on error using undo
      undoScore(); 
    }
  };

  const handleUndo = () => {
    const success = undoScore();
    if (success) {
      // For simplicity, we might just let the next score update overwrite
      toast({ title: "Undo Successful", description: "Last score action reverted." });
    } else {
      toast({ variant: "default", title: "Undo Failed", description: "No previous score state available." });
    }
  };
  
  const handleRedo = () => {
    const success = redoScore();
    if (success) {
      toast({ title: "Redo Successful", description: "Last undone action restored." });
    } else {
      toast({ variant: "default", title: "Redo Failed", description: "No future score state available." });
    }
  };

  // --- Render Logic --- 
  if (isLoading && !match) return <div>Loading scoring interface...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!match || !tournament) return <div>Match data or tournament not found.</div>;

  const scores = match.scores || getInitialScores();
  const currentSetIndex = scores.current_set - 1;
  const currentSet = scores.sets[currentSetIndex] || scores.sets[scores.sets.length - 1];
  const isCurrentSetComplete = currentSet?.completed || false;
  const isMatchOver = match.status === MatchStatus.COMPLETED;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Scoring Match: {match.matchNumber ? `Match ${match.matchNumber}` : ''}</CardTitle>
        <CardDescription>
           {tournament.name} - {match.divisionId ? `Division ${match.divisionId}` : ''}
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
            <div className="text-6xl font-bold my-2">{currentSet?.team1 ?? 0}</div>
            {/* TODO: Display game scores if applicable */} 
            {/* TODO: Server Indicator */} 
            {match.servingTeam === 1 && <CircleDot className="h-4 w-4 absolute top-2 left-2 text-primary" />}
          </div>
          {/* Set Separator/Info */} 
          <div className="text-center px-2">
            <div className="text-xs font-semibold text-muted-foreground">SET</div>
            <div className="text-4xl font-bold">{scores.current_set}</div>
          </div>
          {/* Team 2 Score */} 
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground truncate px-2">{participant2Name}</div>
            <div className="text-6xl font-bold my-2">{currentSet?.team2 ?? 0}</div>
            {/* TODO: Display game scores if applicable */} 
            {/* TODO: Server Indicator */} 
            {match.servingTeam === 2 && <CircleDot className="h-4 w-4 absolute top-2 right-2 text-primary" />}
          </div>
        </div>

        {/* Previous Set Scores */} 
        {scores.sets.length > 0 && scores.sets.some(s => s.completed) && (
          <div className="text-center text-xs text-muted-foreground space-x-2">
            <span>Set Scores:</span>
            {scores.sets.filter((s, idx) => idx !== currentSetIndex || s.completed).map((s, idx) => (
              <span key={idx} className={s.completed ? 'font-semibold' : ''}>{s.team1}-{s.team2}</span>
            ))}
          </div>
        )}
        {/* Match Status */}
        {isMatchOver && (
          <div className="text-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
              Match Complete
            </Badge>
          </div>
        )}
        
        {/* Scoring Controls */}
        {!isMatchOver && (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="lg" 
              variant="default" 
              className="h-24 text-xl" 
              onClick={() => handleScore(1)}
              disabled={isCurrentSetComplete || isMatchOver}
            >
              Point for {participant1Name}
            </Button>
            <Button 
              size="lg" 
              variant="default" 
              className="h-24 text-xl" 
              onClick={() => handleScore(2)}
              disabled={isCurrentSetComplete || isMatchOver}
            >
              Point for {participant2Name}
            </Button>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUndo}
              disabled={isMatchOver}
            >
              <Undo className="h-4 w-4 mr-1" /> Undo
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRedo}
              disabled={isMatchOver}
            >
              <Redo className="h-4 w-4 mr-1" /> Redo
            </Button>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!isMatchOver}
            >
              <Check className="h-4 w-4 mr-1" /> Confirm
            </Button>
            {/* TODO: Button to manually complete match? */} 
            {!isMatchOver && (
              <Button variant="secondary" size="sm" disabled>Options</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoringInterface;
