
import React from 'react';
import { Match } from '@/types/tournament';
import ScoringMatchDetail from '../ScoringMatchDetail';

interface MatchViewProps {
  match: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  onScoreChange: (team1Score: number, team2Score: number) => void;
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
  // We need to adapt the onScoreChange function to work with ScoringMatchDetail's API
  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
    if (!match) return;
    
    // Get current scores
    const currentScores = match.scores[currentSet] || { team1Score: 0, team2Score: 0 };
    let team1Score = currentScores.team1Score;
    let team2Score = currentScores.team2Score;
    
    // Update the appropriate team's score
    if (team === "team1") {
      team1Score = increment ? team1Score + 1 : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment ? team2Score + 1 : Math.max(0, team2Score - 1);
    }
    
    // Call the parent's onScoreChange with the new scores
    onScoreChange(team1Score, team2Score);
  };
  
  if (!match) {
    return (
      <div className="p-4 text-center">
        <p>No match selected.</p>
      </div>
    );
  }
  
  return (
    <ScoringMatchDetail
      match={match}
      onScoreChange={handleScoreChange}
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
