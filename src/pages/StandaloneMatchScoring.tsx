
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStandaloneScoring } from '@/hooks/scoring/useStandaloneScoring';
import ScoringContainer from '@/components/scoring/ScoringContainer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const StandaloneMatchScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const standaloneMatchStore = useStandaloneMatchStore();
  const [currentSet, setCurrentSet] = useState(0);
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Use the scoring hook
  const {
    match,
    scoringMatch,
    isLoading,
    error,
    handleScoreChange,
    handleNewSet,
    handleCompleteMatch,
    saveMatch
  } = useStandaloneScoring(matchId || null);
  
  // Initialize a standalone match if none exists
  useEffect(() => {
    if (!matchId) return;
    
    if (!match && !isLoading) {
      // Create a new standalone match if one doesn't exist
      const newMatch = standaloneMatchStore.createMatch({
        team1: { 
          id: `team1-${Date.now()}`,
          name: 'Team 1', 
          players: [{ id: `player1-${Date.now()}`, name: 'Player 1' }] 
        },
        team2: { 
          id: `team2-${Date.now()}`,
          name: 'Team 2', 
          players: [{ id: `player2-${Date.now()}`, name: 'Player 2' }] 
        },
      });
      
      if (newMatch) {
        toast({
          title: "Match created",
          description: "A new standalone match has been created."
        });
      }
    }
  }, [matchId, match, isLoading, standaloneMatchStore, toast]);

  const handleScoreIncrement = (team: "team1" | "team2") => {
    handleScoreChange(team, true, currentSet);
  };

  const handleScoreDecrement = (team: "team1" | "team2") => {
    handleScoreChange(team, false, currentSet);
  };

  const startNewSet = () => {
    const success = handleNewSet();
    if (success) {
      setCurrentSet(currentSet + 1);
    }
  };

  const completeMatch = () => {
    handleCompleteMatch();
    navigate('/scoring/standalone');
  };

  if (isLoading) {
    return (
      <ScoringContainer>
        <div className="flex justify-center items-center h-full">
          <p>Loading match data...</p>
        </div>
      </ScoringContainer>
    );
  }

  if (error || !scoringMatch) {
    return (
      <ScoringContainer>
        <div className="space-y-4">
          <PageHeader
            title="Error"
            description={error || `Match with ID ${matchId} not found`}
          />
          <Button onClick={() => navigate('/scoring/standalone')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quick Match
          </Button>
        </div>
      </ScoringContainer>
    );
  }

  return (
    <ScoringContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Standalone Match Scoring"
            description={`${scoringMatch.team1?.name || 'Team 1'} vs ${scoringMatch.team2?.name || 'Team 2'}`}
          />
          <Button onClick={() => navigate('/scoring/standalone')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Match Score</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Teams scoring section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Team 1 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{scoringMatch.team1?.name}</h3>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleScoreDecrement("team1")}
                  >
                    -
                  </Button>
                  <span className="text-4xl font-bold">
                    {scoringMatch.scores[currentSet]?.team1Score || 0}
                  </span>
                  <Button 
                    variant="default" 
                    size="icon"
                    onClick={() => handleScoreIncrement("team1")}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Team 2 */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{scoringMatch.team2?.name}</h3>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleScoreDecrement("team2")}
                  >
                    -
                  </Button>
                  <span className="text-4xl font-bold">
                    {scoringMatch.scores[currentSet]?.team2Score || 0}
                  </span>
                  <Button 
                    variant="default" 
                    size="icon"
                    onClick={() => handleScoreIncrement("team2")}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Sets */}
            <div className="mt-8">
              <h3 className="font-medium mb-2">Sets</h3>
              <div className="flex flex-wrap gap-2">
                {scoringMatch.scores.map((score, index) => (
                  <Button
                    key={index}
                    variant={currentSet === index ? "default" : "outline"}
                    onClick={() => setCurrentSet(index)}
                  >
                    Set {index + 1}: {score.team1Score}-{score.team2Score}
                  </Button>
                ))}
                {scoringMatch.scores.length < 3 && (
                  <Button variant="outline" onClick={startNewSet}>
                    Add Set
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Separator />
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => saveMatch()}
          >
            Save Match
          </Button>
          <Button
            variant="default"
            onClick={completeMatch}
          >
            Complete Match
          </Button>
        </div>
      </div>
    </ScoringContainer>
  );
};

export default StandaloneMatchScoring;
