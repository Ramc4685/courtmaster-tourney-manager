import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ScoringSettings } from '@/types/tournament';

interface SetScoreEntryProps {
  team1Name: string;
  team2Name: string;
  scoringRules: ScoringSettings;
  onSetComplete: (setNumber: number, team1Score: number, team2Score: number) => void;
}

export function SetScoreEntry({
  team1Name,
  team2Name,
  scoringRules,
  onSetComplete,
}: SetScoreEntryProps) {
  const [currentSet, setCurrentSet] = useState(1);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const { toast } = useToast();

  const validateScore = (score1: number, score2: number): boolean => {
    const { pointsToWin, mustWinByTwo, maxPoints } = scoringRules;

    // Check if either team has reached max points
    if (score1 > maxPoints || score2 > maxPoints) {
      return false;
    }

    // Check if either team has won
    if (score1 >= pointsToWin || score2 >= pointsToWin) {
      if (mustWinByTwo) {
        return Math.abs(score1 - score2) >= 2;
      }
      return true;
    }

    return true;
  };

  const handleScoreUpdate = (team: 1 | 2, newScore: number) => {
    const updatedTeam1Score = team === 1 ? newScore : team1Score;
    const updatedTeam2Score = team === 2 ? newScore : team2Score;

    if (!validateScore(updatedTeam1Score, updatedTeam2Score)) {
      toast({
        title: "Invalid Score",
        description: "This score violates the tournament's scoring rules.",
        variant: "destructive",
      });
      return;
    }

    if (team === 1) {
      setTeam1Score(newScore);
    } else {
      setTeam2Score(newScore);
    }

    // Check if set is complete
    const { pointsToWin, mustWinByTwo } = scoringRules;
    if (
      (updatedTeam1Score >= pointsToWin && (!mustWinByTwo || updatedTeam1Score - updatedTeam2Score >= 2)) ||
      (updatedTeam2Score >= pointsToWin && (!mustWinByTwo || updatedTeam2Score - updatedTeam1Score >= 2))
    ) {
      onSetComplete(currentSet, updatedTeam1Score, updatedTeam2Score);
      setCurrentSet(prev => prev + 1);
      setTeam1Score(0);
      setTeam2Score(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Set {currentSet}</Label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{team1Name}</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScoreUpdate(1, Math.max(0, team1Score - 1))}
            >
              -
            </Button>
            <Input
              type="number"
              min={0}
              max={scoringRules.maxPoints}
              value={team1Score}
              onChange={(e) => handleScoreUpdate(1, parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScoreUpdate(1, team1Score + 1)}
            >
              +
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{team2Name}</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScoreUpdate(2, Math.max(0, team2Score - 1))}
            >
              -
            </Button>
            <Input
              type="number"
              min={0}
              max={scoringRules.maxPoints}
              value={team2Score}
              onChange={(e) => handleScoreUpdate(2, parseInt(e.target.value) || 0)}
              className="text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScoreUpdate(2, team2Score + 1)}
            >
              +
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 