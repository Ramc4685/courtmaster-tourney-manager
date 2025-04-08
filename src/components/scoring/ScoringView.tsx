import React, { useEffect, useState } from 'react';
import { Match } from '@/types/tournament';
import { realtimeTournamentService } from '@/services/realtime/RealtimeTournamentService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ScoringView = ({ match }: { match: Match }) => {
  const [scores, setScores] = useState({
    team1: 0,
    team2: 0
  });

  useEffect(() => {
    const unsubscribe = realtimeTournamentService.subscribeMatch(match.id, 
      (updatedMatch) => {
        setScores({
          team1: updatedMatch.team1Score,
          team2: updatedMatch.team2Score
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

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">{match.team1Name}</h3>
          <div className="text-4xl font-bold">{scores.team1}</div>
          <div className="space-x-2">
            <Button onClick={() => updateScore('team1', true)}>+</Button>
            <Button variant="outline" onClick={() => updateScore('team1', false)}>-</Button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-2xl font-bold">VS</div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">{match.team2Name}</h3>
          <div className="text-4xl font-bold">{scores.team2}</div>
          <div className="space-x-2">
            <Button onClick={() => updateScore('team2', true)}>+</Button>
            <Button variant="outline" onClick={() => updateScore('team2', false)}>-</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};