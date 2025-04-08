import { useEffect } from 'react';
import { useMatchScoringStore } from '@/stores/matchScoringStore';
import { MatchScore, ScoreAuditLog } from '@/types/scoring';
import { getDefaultScoringSettings } from '@/utils/scoringRules';

interface UseMatchScoringProps {
  sport: string;
  onMatchComplete?: (winner: 'team1' | 'team2', scores: MatchScore[]) => void;
}

export const useMatchScoring = ({ sport, onMatchComplete }: UseMatchScoringProps) => {
  const {
    currentSet,
    scores,
    matchComplete,
    winner,
    updateScore,
    completeSet,
    resetMatch
  } = useMatchScoringStore();

  const settings = getDefaultScoringSettings(sport);

  useEffect(() => {
    if (matchComplete && winner && onMatchComplete) {
      onMatchComplete(winner, scores);
    }
  }, [matchComplete, winner, scores, onMatchComplete]);

  const handleScoreChange = (score: MatchScore, auditLog: ScoreAuditLog) => {
    updateScore(score, auditLog);
  };

  const handleSetComplete = (setWinner: 'team1' | 'team2') => {
    completeSet(setWinner);
  };

  const getTeamSetsWon = (team: 'team1' | 'team2') => {
    return scores.filter((s: MatchScore) => s.winner === team).length;
  };

  const getCurrentSetScore = () => {
    return scores[currentSet - 1] || {
      team1Score: 0,
      team2Score: 0,
      isComplete: false,
      winner: null,
      duration: 0,
      auditLogs: []
    };
  };

  return {
    currentSet,
    scores,
    matchComplete,
    winner,
    settings,
    handleScoreChange,
    handleSetComplete,
    getTeamSetsWon,
    getCurrentSetScore,
    resetMatch
  };
}; 