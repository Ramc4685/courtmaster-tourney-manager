
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { useToast } from '@/hooks/use-toast';
import ScoringMatchDetail from '@/components/scoring/ScoringMatchDetail';
import MatchAuditInfo from '@/components/match/MatchAuditInfo';
import { MatchScore } from '@/types/tournament';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';

const StandaloneMatchScoring = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const standaloneMatchStore = useStandaloneMatchStore();
  const [currentSet, setCurrentSet] = useState(0);
  const [scorerName, setScorerName] = useState('Anonymous Scorer');
  
  // Effect to load match by ID when component mounts
  useEffect(() => {
    if (!matchId) {
      navigate('/scoring/standalone');
      return;
    }
    
    const match = standaloneMatchStore.loadMatchById(matchId);
    if (!match) {
      toast({
        title: "Match not found",
        description: "Could not find the requested match.",
        variant: "destructive"
      });
      navigate('/scoring/standalone');
    } else {
      // Initialize current set to last set
      setCurrentSet(match.scores.length > 0 ? match.scores.length - 1 : 0);
      
      // Initialize scorer name if match has it
      if (match.scorerName) {
        setScorerName(match.scorerName);
      }
    }
  }, [matchId, navigate, toast, standaloneMatchStore]);

  const match = standaloneMatchStore.currentMatch;

  // If no match, show loading
  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading match data...</p>
        </div>
      </div>
    );
  }

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
    
    // Update the score in the store
    standaloneMatchStore.updateMatchScore(match.id, currentSet, team1Score, team2Score, scorerName);
  };

  // Handle creating a new set
  const handleNewSet = () => {
    const newSetIndex = match.scores.length;
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
            match={match}
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
          <MatchAuditInfo match={match} />
        </div>
      </div>
    </div>
  );
};

export default StandaloneMatchScoring;
