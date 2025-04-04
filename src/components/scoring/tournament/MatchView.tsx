
import React from 'react';
import { Match } from '@/types/tournament';
import ScoringMatchDetail from '../ScoringMatchDetail';

interface MatchViewProps {
  match: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  isPending?: boolean;
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
  onCourtChange?: (courtNumber: number) => void;
}

const MatchView: React.FC<MatchViewProps> = ({
  match,
  currentSet,
  setCurrentSet,
  onNewSet,
  onCompleteMatch,
  onScoreChange,
  isPending,
  scorerName,
  onScorerNameChange,
  onCourtChange
}) => {
  if (!match) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No match selected.</p>
      </div>
    );
  }
  
  return (
    <ScoringMatchDetail
      match={match}
      currentSet={currentSet}
      onSetChange={setCurrentSet}
      onScoreChange={onScoreChange}
      onNewSet={onNewSet}
      onCompleteMatch={onCompleteMatch}
      isPending={isPending}
      scorerName={scorerName}
      onScorerNameChange={onScorerNameChange}
      onCourtChange={onCourtChange}
    />
  );
};

export default MatchView;
