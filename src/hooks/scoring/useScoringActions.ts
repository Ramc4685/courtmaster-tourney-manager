
import { useCallback } from 'react';
import { Match, Tournament } from '@/types/tournament';
import { ScoringSettings } from '@/types/scoring';
import { isSetComplete, isMatchComplete } from '@/utils/matchUtils';

interface UseScoringActionsProps {
  match: Match | null;
  currentSet: number;
  scoringSettings: ScoringSettings;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
}

export const useScoringActions = ({
  match,
  currentSet,
  scoringSettings,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
}: UseScoringActionsProps) => {
  const handleIncrementScore = useCallback(
    (team: "team1" | "team2") => {
      if (!match) return;
      onScoreChange(team, true);
    },
    [match, onScoreChange]
  );

  const handleDecrementScore = useCallback(
    (team: "team1" | "team2") => {
      if (!match) return;
      onScoreChange(team, false);
    },
    [match, onScoreChange]
  );

  const handleNewSet = useCallback(() => {
    if (!match) return;
    onNewSet();
  }, [match, onNewSet]);

  const handleCompleteMatch = useCallback(() => {
    if (!match) return;
    onCompleteMatch();
  }, [match, onCompleteMatch]);

  const isSetFinished = useCallback(() => {
    if (!match) return false;
    const { team1Score, team2Score } = match.scores[currentSet] || { team1Score: 0, team2Score: 0 };
    return isSetComplete(team1Score, team2Score, scoringSettings);
  }, [match, currentSet, scoringSettings]);

  const isMatchFinished = useCallback(() => {
    if (!match) return false;
    return isMatchComplete(match, scoringSettings);
  }, [match, scoringSettings]);

  return {
    handleIncrementScore,
    handleDecrementScore,
    handleNewSet,
    handleCompleteMatch,
    isSetFinished,
    isMatchFinished,
  };
};
