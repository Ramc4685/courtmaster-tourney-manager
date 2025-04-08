
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SetScoreEntry } from './SetScoreEntry';
import { Match, ScoringSettings } from '@/types/tournament';

interface ScoringViewProps {
  match: Match;
  scoringSettings: ScoringSettings;
  onMatchComplete: (matchId: string, winnerId: string) => void;
}

export function ScoringView({ match, scoringSettings, onMatchComplete }: ScoringViewProps) {
  const [currentSet, setCurrentSet] = useState(1);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);

  const handleSetComplete = (setNumber: number, team1Score: number, team2Score: number) => {
    // Determine winner based on scores
    const winnerId = team1Score > team2Score ? match.team1?.id : match.team2?.id;
    
    if (winnerId === match.team1?.id) {
      setTeam1Score(prev => prev + 1);
    } else {
      setTeam2Score(prev => prev + 1);
    }
    setCurrentSet(prev => prev + 1);
  };

  const handleMatchComplete = () => {
    const winnerId = team1Score > team2Score ? match.team1?.id : match.team2?.id;
    if (winnerId) {
      onMatchComplete(match.id, winnerId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Scoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{match.team1?.name || 'Team 1'}</h3>
              <p>Sets Won: {team1Score}</p>
            </div>
            <div>
              <h3 className="font-medium">{match.team2?.name || 'Team 2'}</h3>
              <p>Sets Won: {team2Score}</p>
            </div>
          </div>

          <SetScoreEntry
            team1Name={match.team1?.name || 'Team 1'}
            team2Name={match.team2?.name || 'Team 2'}
            scoringRules={scoringSettings}
            onSetComplete={handleSetComplete}
          />

          {(team1Score > team2Score || team2Score > team1Score) && (
            <Button onClick={handleMatchComplete}>
              Complete Match
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
