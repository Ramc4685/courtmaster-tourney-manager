import React, { useState, useEffect, useCallback } from 'react';
import { UIMatch, MatchScores, ScoreSet, getParticipantNames, getCurrentScore, updateMatchScores } from '@/utils/adapters/matchAdapter';
import { MatchStatus } from "@/types/entities";
import { NotificationType } from "@/types/tournament-enums";
import { matchService, profileService, notificationService } from "@/services/api";
import { realtime, COLLECTIONS, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { Undo, Redo, Check, CircleDot, Plus, Minus, RotateCcw } from 'lucide-react';
import { useScoringStore } from '@/stores/scoringStore';
import { Tournament } from '@/types/tournament';
import { calculateMatchWinner, calculateSetWinner, isMatchComplete, isSetComplete } from '@/utils/scoringRules';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { cn } from '@/lib/utils';

interface MobileScoringInterfaceProps {
  matchId: string;
  tournament: Tournament;
  onMatchComplete?: (match: UIMatch) => void;
}

const getInitialScores = (): MatchScores => ({
  current_set: 1,
  sets: [{ team1: 0, team2: 0, completed: false }],
});

export const MobileScoringInterface: React.FC<MobileScoringInterfaceProps> = ({
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
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();
  const { isMobile, orientation } = useMobileOptimization();

  const fetchMatchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const fetchedMatch = await matchService.getMatch(matchId, {});
      setActiveMatch(fetchedMatch);

      try {
        // Determine match type: singles vs team
        const isSinglesMatch = fetchedMatch.team1_player1 && fetchedMatch.team2_player1;
        const isTeamMatch = fetchedMatch.team1Id && fetchedMatch.team2Id;

        if (isSinglesMatch) {
          // Singles match - prefer player profiles
          if (fetchedMatch.team1_player1) {
            const p1Profile = await profileService.getProfile(fetchedMatch.team1_player1);
            if (p1Profile) setParticipant1Name(p1Profile.full_name || p1Profile.display_name || 'Player 1');
          }
          if (fetchedMatch.team2_player1) {
            const p2Profile = await profileService.getProfile(fetchedMatch.team2_player1);
            if (p2Profile) setParticipant2Name(p2Profile.full_name || p2Profile.display_name || 'Player 2');
          }
        } else if (isTeamMatch) {
          // Team match - fetch team names (or use placeholder)
          if (fetchedMatch.team1Id) {
            setParticipant1Name(`Team ${fetchedMatch.team1Id.substring(0, 5)}`);
          }
          if (fetchedMatch.team2Id) {
            setParticipant2Name(`Team ${fetchedMatch.team2Id.substring(0, 5)}`);
          }
        }
      } catch (nameError) {
         console.error("[MobileScoringInterface] Error fetching participant names:", nameError);
      }
    } catch (err) {
      console.error("[MobileScoringInterface] Failed to fetch match data:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load match data';
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [matchId, toast, setActiveMatch, setLoading, setError]);

  useEffect(() => {
    if (!match || match.id !== matchId) {
      fetchMatchData();
    }

    const unsubscribe = realtime.subscribe(`databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTIONS.MATCHES}.documents.${matchId}`, (response) => {
      if (response.events && response.events.includes('database.documents.update')) {
        setActiveMatch(response.payload as UIMatch);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [matchId, match, fetchMatchData, setActiveMatch]);

  const handleScore = async (teamIndex: 1 | 2) => {
    if (!match) return;

    const scoringSettings = (tournament as any)?.scoringRules ?? tournament?.scoring ?? {
      pointsToWinSet: 21,
      setsToWinMatch: 2,
      maxSets: 3,
      mustWinByTwo: true,
      maxPointsPerSet: 30
    };

    const currentScores = match.scores ? JSON.parse(JSON.stringify(match.scores)) : getInitialScores();

    if (match.status === MatchStatus.COMPLETED || currentScores.sets[currentScores.current_set - 1]?.completed) {
      toast({ variant: "default", title: "Info", description: "Match or current set already completed." });
      return;
    }

    addScoreHistory(currentScores);

    const updatedScores = currentScores;
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

      // Check for match completion
      const matchWinner = calculateMatchWinner(updatedScores.sets, scoringSettings);
      if (matchWinner) {
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

        updateScoreAndStatus(updatedScores, newMatchStatus, winnerId, loserId);

        try {
          const updatedMatch = await matchService.updateMatch(match.id, {
            scores: updatedScores,
            status: newMatchStatus,
            winner_id: winnerId,
            loser_id: loserId
          }, {});

          if (onMatchComplete) onMatchComplete(updatedMatch);
        } catch (err) {
          console.error("[MobileScoringInterface] Failed to update match:", err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save match completion. Please try again."
          });
        }
        return;
      }

      // Start next set if match not complete
      if (setWinner) {
        updatedScores.current_set += 1;
        if (updatedScores.sets.length < updatedScores.current_set) {
          updatedScores.sets.push({ team1: 0, team2: 0, completed: false });
        }
      }
    }

    updateScoreAndStatus(updatedScores, match.status);

    try {
      await matchService.updateMatch(match.id, { scores: updatedScores }, {});
    } catch (err) {
      console.error("[MobileScoringInterface] Failed to update score:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save score update."
      });
      undoScore();
    }
  };

  const handleUndo = () => {
    const success = undoScore();
    if (success) {
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

  if (isLoading && !match) return <div className="flex items-center justify-center p-8">Loading scoring interface...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!match) return <div className="p-4">Match data not found.</div>;

  const scores = match.scores || getInitialScores();
  const currentSetIndex = scores.current_set - 1;
  const currentSet = scores.sets[currentSetIndex] || scores.sets[scores.sets.length - 1];
  const isCurrentSetComplete = currentSet?.completed || false;
  const isMatchOver = match.status === MatchStatus.COMPLETED;

  // Use different layouts for landscape vs portrait
  const isLandscape = orientation === 'landscape';

  return (
    <div className={cn("w-full h-screen flex flex-col bg-background", isLandscape && "flex-row")}>
      {/* Header */}
      <div className={cn("p-4 border-b bg-card", isLandscape && "w-80 border-r border-b-0")}>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">Match {match.matchNumber || ''}</h2>
          <p className="text-sm text-muted-foreground">{tournament.name}</p>
          <div className="text-xs text-muted-foreground">
            {participant1Name} vs {participant2Name}
          </div>
          {isMatchOver && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Match Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Score Display */}
      <div className={cn("flex-1 flex flex-col", isLandscape && "flex-row")}>
        <div className={cn("flex-1 grid grid-cols-3 gap-2 p-4", isLandscape && "grid-rows-3 grid-cols-1")}>
          {/* Team 1 Score */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4 relative">
            <div className="text-sm font-medium text-center mb-2 line-clamp-2">{participant1Name}</div>
            <div className="text-6xl font-bold text-center">{currentSet?.team1 ?? 0}</div>
            {match.servingTeam === 1 && <CircleDot className="h-4 w-4 absolute top-2 right-2 text-primary" />}
          </div>

          {/* Set Info */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-1">SET</div>
            <div className="text-4xl font-bold">{scores.current_set}</div>
            <div className="text-xs text-muted-foreground mt-1">
              of {scores.sets.length}
            </div>
          </div>

          {/* Team 2 Score */}
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-4 relative">
            <div className="text-sm font-medium text-center mb-2 line-clamp-2">{participant2Name}</div>
            <div className="text-6xl font-bold text-center">{currentSet?.team2 ?? 0}</div>
            {match.servingTeam === 2 && <CircleDot className="h-4 w-4 absolute top-2 right-2 text-primary" />}
          </div>
        </div>

        {/* Previous Sets Display */}
        {scores.sets.length > 0 && scores.sets.some(s => s.completed) && (
          <div className="px-4 pb-2">
            <div className="text-center text-xs text-muted-foreground space-x-2">
              <span>Set Scores:</span>
              {scores.sets.filter((s, idx) => idx !== currentSetIndex || s.completed).map((s, idx) => (
                <span key={idx} className={cn("px-2 py-1 rounded", s.completed && 'bg-muted font-semibold')}>
                  {s.team1}-{s.team2}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Optimized Controls */}
      <div className={cn("p-4 bg-card border-t space-y-4", isLandscape && "w-80 border-l border-t-0")}>
        {/* Score Buttons */}
        {!isMatchOver && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              variant="default"
              className="h-16 text-lg font-semibold touch-manipulation"
              onClick={() => handleScore(1)}
              disabled={isCurrentSetComplete || isMatchOver}
            >
              <Plus className="h-6 w-6 mr-2" />
              +1
            </Button>
            <Button
              size="lg"
              variant="default"
              className="h-16 text-lg font-semibold touch-manipulation"
              onClick={() => handleScore(2)}
              disabled={isCurrentSetComplete || isMatchOver}
            >
              <Plus className="h-6 w-6 mr-2" />
              +1
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={isMatchOver}
              className="touch-manipulation"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={isMatchOver}
              className="touch-manipulation"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!isMatchOver}
            className="touch-manipulation"
          >
            <Check className="h-4 w-4 mr-1" />
            Complete
          </Button>
        </div>

        {/* Gestures Help */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
          Tap + buttons to score. Swipe left/right for undo/redo.
        </div>
      </div>
    </div>
  );
};

export default MobileScoringInterface;