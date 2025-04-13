
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Match } from '@/types/tournament';

interface ScoringMatchProps {
  match: Match;
  onScoreChange: (team: 'team1' | 'team2', score: number) => void;
  onCompleteMatch: () => void;
  onNewSet: () => void;
}

export const ScoringMatch: React.FC<ScoringMatchProps> = ({
  match,
  onScoreChange,
  onCompleteMatch,
  onNewSet
}) => {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  
  const handleTeam1Increment = () => {
    const newScore = team1Score + 1;
    setTeam1Score(newScore);
    onScoreChange('team1', newScore);
  };
  
  const handleTeam2Increment = () => {
    const newScore = team2Score + 1;
    setTeam2Score(newScore);
    onScoreChange('team2', newScore);
  };
  
  const team1Name = match.team1?.name || 'Player 1';
  const team2Name = match.team2?.name || 'Player 2';
  const courtName = match.court?.name || 'Court';
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Score Entry</h1>
        <div>
          <Button variant="outline" className="mr-2" onClick={onNewSet}>New Set</Button>
          <Button onClick={onCompleteMatch}>Complete Match</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{team1Name}</CardTitle>
            <p className="text-sm text-muted-foreground">{courtName}</p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-7xl font-bold">{team1Score}</div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button size="lg" onClick={handleTeam1Increment} className="w-full">
              Point
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{team2Name}</CardTitle>
            <p className="text-sm text-muted-foreground">Player 2</p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-7xl font-bold">{team2Score}</div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button size="lg" onClick={handleTeam2Increment} className="w-full">
              Point
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setTeam1Score(Math.max(0, team1Score - 1))}>
          Decrease {team1Name}
        </Button>
        <Button variant="outline" onClick={() => setTeam2Score(Math.max(0, team2Score - 1))}>
          Decrease {team2Name}
        </Button>
      </div>
    </div>
  );
};
