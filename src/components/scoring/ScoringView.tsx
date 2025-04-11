
import React, { useEffect, useState } from 'react';
import { Match } from '@/types/tournament';
import { realtimeTournamentService } from '@/services/realtime/RealtimeTournamentService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ScoringView = ({ match }: { match: Match }) => {
  const [scores, setScores] = useState({
    team1: 0,
    team2: 0,
    sets: [] as {team1: number, team2: number}[]
  });

  const [currentSet, setCurrentSet] = useState(1);

  useEffect(() => {
    const unsubscribe = realtimeTournamentService.subscribeMatch(match.id, 
      (updatedMatch) => {
        setScores({
          team1: updatedMatch.team1Score || 0,
          team2: updatedMatch.team2Score || 0,
          sets: updatedMatch.scores || []
        });
      }
    );
    return () => unsubscribe();
  }, [match.id]);

  const updateScore = (team: 'team1' | 'team2', increment: boolean) => {
    const newScores = {
      ...scores,
      [team]: increment ? scores[team] + 1 : Math.max(0, scores[team] - 1)
    };
    setScores(newScores);
    realtimeTournamentService.publishMatchUpdate({
      ...match,
      team1Score: newScores.team1,
      team2Score: newScores.team2
    });
  };

  const completeSet = () => {
    const newSets = [...scores.sets, { team1: scores.team1, team2: scores.team2 }];
    setScores({
      ...scores,
      sets: newSets,
      team1: 0,
      team2: 0
    });
    setCurrentSet(currentSet + 1);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-lg">Set {currentSet}</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{match.team1Name}</h3>
            <div className="text-6xl font-bold text-primary">{scores.team1}</div>
            <div className="space-x-2">
              <Button size="lg" onClick={() => updateScore('team1', true)}>+</Button>
              <Button size="lg" variant="outline" onClick={() => updateScore('team1', false)}>-</Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-3xl font-bold">VS</div>
            <Button 
              variant="secondary" 
              onClick={completeSet}
              className="mt-4"
            >
              Complete Set
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">{match.team2Name}</h3>
            <div className="text-6xl font-bold text-primary">{scores.team2}</div>
            <div className="space-x-2">
              <Button size="lg" onClick={() => updateScore('team2', true)}>+</Button>
              <Button size="lg" variant="outline" onClick={() => updateScore('team2', false)}>-</Button>
            </div>
          </div>
        </div>
      </Card>

      {scores.sets.length > 0 && (
        <Card className="p-4 max-w-3xl mx-auto">
          <h4 className="font-semibold mb-2">Previous Sets</h4>
          <div className="grid grid-cols-3 gap-2">
            {scores.sets.map((set, idx) => (
              <div key={idx} className="text-center p-2 bg-muted rounded">
                <div className="font-medium">Set {idx + 1}</div>
                <div>{set.team1} - {set.team2}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
