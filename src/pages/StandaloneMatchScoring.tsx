
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { useToast } from '@/hooks/use-toast';
import ScoringMatchDetail from '@/components/scoring/ScoringMatchDetail';
import MatchAuditInfo from '@/components/match/MatchAuditInfo';
import { MatchScore, StandaloneMatch, Match } from '@/types/tournament';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { isSetComplete, getDefaultScoringSettings } from '@/utils/matchUtils';

const StandaloneMatchScoring = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const standaloneMatchStore = useStandaloneMatchStore();
  const [currentSet, setCurrentSet] = useState(0);
  const [scorerName, setScorerName] = useState('Anonymous Scorer');
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadComplete = useRef(false);
  const scoringSettings = getDefaultScoringSettings();
  
  // Effect to load match by ID when component mounts
  useEffect(() => {
    if (!matchId) {
      navigate('/scoring/standalone');
      return;
    }
    
    // Only load the match if we haven't already
    if (!initialLoadComplete.current) {
      setIsLoading(true);
      
      // Find the match in the store first without setting it as current
      const match = standaloneMatchStore.matches.find(m => m.id === matchId);
      if (match) {
        // Initialize current set to last set
        setCurrentSet(match.scores.length > 0 ? match.scores.length - 1 : 0);
        
        // Initialize scorer name if match has it
        if (match.scorerName) {
          setScorerName(match.scorerName);
        }
        
        // Now that we've initialized our local state, we can safely load the match
        standaloneMatchStore.loadMatchById(matchId);
      } else {
        toast({
          title: "Match not found",
          description: "Could not find the requested match.",
          variant: "destructive"
        });
        navigate('/scoring/standalone');
        return;
      }
      
      setIsLoading(false);
      initialLoadComplete.current = true;
    }
  }, [matchId, navigate, toast, standaloneMatchStore]);

  const match = standaloneMatchStore.currentMatch;

  // If no match, show loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading match data...</p>
        </div>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Match not found. Please go back to the standalone matches list.</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/scoring/standalone')} 
            className="mt-4"
          >
            Back to Matches
          </Button>
        </div>
      </div>
    );
  }

  // Convert standalone match to Match type for compatibility with components
  // Using type assertion as StandaloneMatch and Match have a lot of overlap
  const matchForAudit = {
    ...match,
    tournamentId: 'standalone',
    division: 'SINGLES' as any, // Cast to any to avoid type error
    stage: 'INITIAL_ROUND' as any,
    category: {
      id: 'standalone',
      name: 'Standalone Match',
      type: match.team1.players.length > 1 ? 'MENS_DOUBLES' : 'MENS_SINGLES'
    }
  } as Match;

  // Handle score change
  const handleScoreChange = (team: 'team1' | 'team2', increment: boolean) => {
    const scores = [...match.scores];
    
    // Ensure we have enough entries in the scores array
    while (scores.length <= currentSet) {
      scores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Get current scores for this set
    let { team1Score, team2Score } = scores[currentSet];
    
    // Update the appropriate score
    if (team === 'team1') {
      team1Score = increment ? team1Score + 1 : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment ? team2Score + 1 : Math.max(0, team2Score - 1);
    }
    
    // Check if this set would be completed with these scores
    const setWouldBeComplete = isSetComplete(team1Score, team2Score, scoringSettings);
    
    // Update the score in the store
    // Use requestAnimationFrame to prevent nested updates
    requestAnimationFrame(() => {
      standaloneMatchStore.updateMatchScore(match.id, currentSet, team1Score, team2Score, scorerName);
      
      // If the set is now complete, show appropriate dialog
      if (setWouldBeComplete) {
        // Check if the match would be complete with this set
        const updatedScores = [...match.scores];
        while (updatedScores.length <= currentSet) {
          updatedScores.push({ team1Score: 0, team2Score: 0 });
        }
        updatedScores[currentSet] = { team1Score, team2Score };
        
        const setWins = countSetsWon(updatedScores);
        
        if (setWins.team1 >= Math.ceil(scoringSettings.maxSets / 2) || 
            setWins.team2 >= Math.ceil(scoringSettings.maxSets / 2)) {
          // Match would be complete - show complete match dialog
          toast({
            title: "Set Complete",
            description: "This set is now complete. Match win condition has been met!"
          });
        } else if (currentSet + 1 < scoringSettings.maxSets) {
          // Show the toast for completed set
          toast({
            title: "Set Complete",
            description: `Set ${currentSet + 1} is complete. You can start a new set.`
          });
        }
      }
    });
  };

  // Helper function to count sets won
  const countSetsWon = (scores: MatchScore[]) => {
    let team1 = 0;
    let team2 = 0;
    
    scores.forEach(score => {
      if (isSetComplete(score.team1Score, score.team2Score, scoringSettings)) {
        if (score.team1Score > score.team2Score) team1++;
        else if (score.team2Score > score.team1Score) team2++;
      }
    });
    
    return { team1, team2 };
  };

  // Handle creating a new set
  const handleNewSet = () => {
    const newSetIndex = match.scores.length;
    
    // Check if we've reached the maximum number of sets
    if (newSetIndex >= scoringSettings.maxSets) {
      toast({
        title: "Maximum sets reached",
        description: `This match is limited to ${scoringSettings.maxSets} sets.`
      });
      return;
    }
    
    standaloneMatchStore.updateMatchScore(match.id, newSetIndex, 0, 0, scorerName);
    setCurrentSet(newSetIndex);
    
    toast({
      title: "New set started",
      description: `Set ${newSetIndex + 1} has been started.`
    });
  };

  // Handle completing a match
  const handleCompleteMatch = () => {
    const success = standaloneMatchStore.completeMatch(match.id, scorerName);
    
    if (success) {
      toast({
        title: "Match completed",
        description: "The match has been marked as completed."
      });
    } else {
      toast({
        title: "Error completing match",
        description: "Could not complete the match.",
        variant: "destructive"
      });
    }
  };

  // Handle scorer name change
  const handleScorerNameChange = (name: string) => {
    setScorerName(name);
    
    // Also update the match with the scorer name
    if (match) {
      const updatedMatch = {
        ...match,
        scorerName: name
      };
      standaloneMatchStore.updateMatch(updatedMatch);
    }
  };

  // Handle court number change
  const handleCourtNumberChange = (courtNumber: number) => {
    if (match) {
      standaloneMatchStore.updateCourtNumber(match.id, courtNumber);
      
      toast({
        title: "Court updated",
        description: `Match assigned to Court ${courtNumber}.`
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Match Scoring"
        description={`${match.team1.name} vs ${match.team2.name}`}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/scoring/standalone')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScoringMatchDetail 
            match={matchForAudit}
            onScoreChange={handleScoreChange}
            onNewSet={handleNewSet}
            onCompleteMatch={handleCompleteMatch}
            currentSet={currentSet}
            onSetChange={setCurrentSet}
            scorerName={scorerName}
            onScorerNameChange={handleScorerNameChange}
            onCourtChange={handleCourtNumberChange}
          />
        </div>
        
        <div>
          <MatchAuditInfo match={matchForAudit} />
        </div>
      </div>
    </div>
  );
};

export default StandaloneMatchScoring;
