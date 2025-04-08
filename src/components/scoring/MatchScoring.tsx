
import React, { useEffect, useState } from "react";
import { Match, MatchScore, ScoringSettings } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { validateBadmintonScore, BADMINTON_SCORING_SETTINGS } from "@/utils/scoringRules";
import { useToast } from "@/components/ui/use-toast";

interface MatchScoringProps {
  match: Match;
  onScoreUpdate: (scores: MatchScore[]) => void;
  onMatchComplete: () => void;
  settings?: ScoringSettings;
}

export const MatchScoring: React.FC<MatchScoringProps> = ({
  match,
  onScoreUpdate,
  onMatchComplete,
  settings = BADMINTON_SCORING_SETTINGS
}) => {
  const [scores, setScores] = useState<MatchScore[]>(match.scores || []);
  const [currentSet, setCurrentSet] = useState(scores.length);
  const { toast } = useToast();

  const updateScore = (team: 'team1' | 'team2', increment: boolean) => {
    const newScores = [...scores];
    if (!newScores[currentSet]) {
      newScores[currentSet] = { team1Score: 0, team2Score: 0 };
    }
    
    const delta = increment ? 1 : -1;
    if (team === 'team1') {
      newScores[currentSet].team1Score = Math.max(0, newScores[currentSet].team1Score + delta);
    } else {
      newScores[currentSet].team2Score = Math.max(0, newScores[currentSet].team2Score + delta);
    }
    
    if (validateBadmintonScore(newScores, settings)) {
      setScores(newScores);
      onScoreUpdate(newScores);
    }
  };

  useEffect(() => {
    const isMatchComplete = scores.length === settings.maxSets || 
      scores.filter(s => s.team1Score > s.team2Score).length > settings.maxSets / 2 ||
      scores.filter(s => s.team2Score > s.team1Score).length > settings.maxSets / 2;
      
    if (isMatchComplete) {
      onMatchComplete();
    }
  }, [scores, settings]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Current Set Score */}
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">Set {currentSet + 1}</div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{scores[currentSet]?.team1Score || 0}</div>
              <Button onClick={() => updateScore('team1', true)}>+</Button>
              <Button onClick={() => updateScore('team1', false)}>-</Button>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{scores[currentSet]?.team2Score || 0}</div>
              <Button onClick={() => updateScore('team2', true)}>+</Button>
              <Button onClick={() => updateScore('team2', false)}>-</Button>
            </div>
          </div>
        </div>
        
        {/* Previous Sets */}
        <div className="space-y-2">
          {scores.slice(0, currentSet).map((score, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <div>Set {idx + 1}</div>
              <div className="flex gap-4">
                <div>{score.team1Score}</div>
                <div>{score.team2Score}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default MatchScoring;
