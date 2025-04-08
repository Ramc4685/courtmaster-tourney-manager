import React from 'react';
import { Card } from '@/components/ui/card';
import { ScoreEntry } from './ScoreEntry';
import { useMatchScoring } from '@/hooks/useMatchScoring';
import { MatchScore, ScoreAuditLog } from '@/types/scoring';

interface MatchScoringProps {
  sport: string;
  team1Name: string;
  team2Name: string;
  onMatchComplete: (winner: 'team1' | 'team2', scores: MatchScore[]) => void;
  readOnly?: boolean;
}

export const MatchScoring: React.FC<MatchScoringProps> = ({
  sport,
  team1Name,
  team2Name,
  onMatchComplete,
  readOnly = false
}) => {
  const {
    currentSet,
    matchComplete,
    winner,
    handleScoreChange,
    handleSetComplete,
    getTeamSetsWon,
    getCurrentSetScore
  } = useMatchScoring({
    sport,
    onMatchComplete
  });

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Match Scoring</h2>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <h3 className="text-lg font-semibold">{team1Name}</h3>
            <p className="text-sm text-gray-500">
              Sets won: {getTeamSetsWon('team1')}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{team2Name}</h3>
            <p className="text-sm text-gray-500">
              Sets won: {getTeamSetsWon('team2')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Set {currentSet}</h3>
          <ScoreEntry
            sport={sport}
            initialScore={getCurrentSetScore()}
            onScoreChange={handleScoreChange}
            onSetComplete={handleSetComplete}
            readOnly={readOnly || matchComplete}
          />
        </div>

        {matchComplete && (
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-600">
              Match Complete! {winner === 'team1' ? team1Name : team2Name} wins!
            </h3>
          </div>
        )}
      </div>
    </Card>
  );
}; 