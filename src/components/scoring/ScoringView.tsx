
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Match, ScoringSettings } from '@/types/tournament';
import { useTournament } from '@/contexts/tournament/useTournament';

export interface ScoringViewProps {
  match: Match;
  scoringSettings: ScoringSettings;
  onMatchComplete: (matchId: string, winnerId: string) => void;
}

const ScoringView: React.FC<ScoringViewProps> = ({ match, scoringSettings, onMatchComplete }) => {
  const { id } = useParams<{ id: string }>();
  const { currentTournament } = useTournament();
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);

  // Create a placeholder for the actual match
  const actualMatch = currentTournament?.matches.find(m => m.id === id) || match;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Match Scoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-medium">
                {actualMatch.team1?.name || 'Team 1'}
              </h3>
              <div className="flex items-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTeam1Score(prev => Math.max(prev - 1, 0))}
                >
                  -
                </Button>
                <span className="mx-4 text-2xl font-bold">{team1Score}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTeam1Score(prev => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">
                {actualMatch.team2?.name || 'Team 2'}
              </h3>
              <div className="flex items-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTeam2Score(prev => Math.max(prev - 1, 0))}
                >
                  -
                </Button>
                <span className="mx-4 text-2xl font-bold">{team2Score}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setTeam2Score(prev => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Set {currentSet + 1}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Points to win: {scoringSettings.pointsToWin}<br />
              Must win by two: {scoringSettings.mustWinByTwo ? 'Yes' : 'No'}<br />
              Max points: {scoringSettings.maxPoints}
            </p>
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentSet(prev => Math.max(prev - 1, 0))}
                disabled={currentSet === 0}
              >
                Previous Set
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setCurrentSet(prev => prev + 1)}
                disabled={currentSet >= scoringSettings.maxSets - 1}
              >
                Next Set
              </Button>
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={() => onMatchComplete(actualMatch.id, team1Score > team2Score ? actualMatch.team1Id || '' : actualMatch.team2Id || '')}
            >
              Complete Match
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoringView;
