import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  validateScore, 
  isSetComplete, 
  getSetWinner,
  createScoreAuditLog,
  getDefaultScoringSettings
} from '@/utils/scoringRules';
import { ScoringSettings, MatchScore, ScoreValidationResult, ScoreAuditLog } from '@/types/scoring';

interface ScoreEntryProps {
  sport: string;
  initialScore?: MatchScore;
  onScoreChange: (score: MatchScore, auditLog: ScoreAuditLog) => void;
  onSetComplete?: (winner: 'team1' | 'team2') => void;
  readOnly?: boolean;
}

export const ScoreEntry: React.FC<ScoreEntryProps> = ({
  sport,
  initialScore,
  onScoreChange,
  onSetComplete,
  readOnly = false
}) => {
  const [score, setScore] = useState<MatchScore>(initialScore || {
    team1Score: 0,
    team2Score: 0,
    isComplete: false,
    winner: null,
    duration: 0,
    auditLogs: []
  });

  const [settings, setSettings] = useState<ScoringSettings>(getDefaultScoringSettings(sport));
  const [validation, setValidation] = useState<ScoreValidationResult>({ isValid: true, errors: [], warnings: [] });

  useEffect(() => {
    if (initialScore) {
      setScore(initialScore);
    }
  }, [initialScore]);

  const handleScoreChange = (team: 'team1' | 'team2', newScore: number) => {
    const updatedScore: MatchScore = {
      ...score,
      [`${team}Score`]: newScore,
      isComplete: false,
      winner: null
    };

    // Validate the new score
    const validationResult = validateScore(updatedScore, settings);
    setValidation(validationResult);

    if (validationResult.isValid) {
      // Check if the set is complete
      const setComplete = isSetComplete(updatedScore.team1Score, updatedScore.team2Score, settings);
      if (setComplete) {
        const winner = getSetWinner(updatedScore.team1Score, updatedScore.team2Score, settings);
        updatedScore.isComplete = true;
        updatedScore.winner = winner;
        
        if (onSetComplete && winner) {
          onSetComplete(winner);
        }
      }

      // Create audit log
      const auditLog = createScoreAuditLog(
        'score_update',
        updatedScore,
        'scorer', // This should be replaced with actual scorer ID
        `${score.team1Score}-${score.team2Score}`
      );

      setScore(updatedScore);
      onScoreChange(updatedScore, auditLog);
    }
  };

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="team1Score">Team 1 Score</Label>
          <Input
            id="team1Score"
            type="number"
            min="0"
            max={settings.maxTwoPointLeadScore}
            value={score.team1Score}
            onChange={(e) => handleScoreChange('team1', parseInt(e.target.value) || 0)}
            disabled={readOnly || score.isComplete}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team2Score">Team 2 Score</Label>
          <Input
            id="team2Score"
            type="number"
            min="0"
            max={settings.maxTwoPointLeadScore}
            value={score.team2Score}
            onChange={(e) => handleScoreChange('team2', parseInt(e.target.value) || 0)}
            disabled={readOnly || score.isComplete}
          />
        </div>
      </div>

      {validation.errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          {validation.errors.map((error, index) => (
            <AlertDescription key={index}>{error}</AlertDescription>
          ))}
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert variant="info" className="mt-4">
          {validation.warnings.map((warning, index) => (
            <AlertDescription key={index}>{warning}</AlertDescription>
          ))}
        </Alert>
      )}

      {score.isComplete && (
        <Alert className="mt-4">
          <AlertDescription>
            Set complete! Winner: Team {score.winner === 'team1' ? '1' : '2'}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}; 