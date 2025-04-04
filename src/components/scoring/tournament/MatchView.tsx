
import React from 'react';
import { Match } from '@/types/tournament';
import ScoringMatchDetail from '../ScoringMatchDetail';

interface MatchViewProps {
  match: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  isPending?: boolean;
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
  onCourtChange?: (courtNumber: number) => void;
}

const MatchView: React.FC<MatchViewProps> = ({
  match,
  currentSet,
  setCurrentSet,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  isPending = false,
  scorerName,
  onScorerNameChange,
  onCourtChange
}) => {
  if (!match) {
    return (
      <div className="text-center p-8">
        <p>No match selected. Please select a match to score.</p>
      </div>
    );
  }

  return (
    <ScoringMatchDetail
      match={match}
      onScoreChange={onScoreChange}
      onNewSet={onNewSet}
      onCompleteMatch={onCompleteMatch}
      currentSet={currentSet}
      onSetChange={setCurrentSet}
      isPending={isPending}
      scorerName={scorerName}
      onScorerNameChange={onScorerNameChange}
      onCourtChange={onCourtChange}
    />
  );
};

export default MatchView;
