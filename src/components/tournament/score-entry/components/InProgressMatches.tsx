
import React from "react";
import { Match } from "@/types/tournament";
import MatchScoreCard from "./MatchScoreCard";

interface InProgressMatchesProps {
  matches: Match[];
  selectedMatchId: string;
  courts: any[];
  onMatchSelect: (matchId: string) => void;
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
}

const InProgressMatches: React.FC<InProgressMatchesProps> = ({
  matches,
  selectedMatchId,
  courts,
  onMatchSelect,
  onMatchUpdate,
  onCourtAssign
}) => {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-md font-medium mb-3">Matches In Progress</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {matches.map((match) => (
          <MatchScoreCard
            key={match.id}
            match={match}
            isSelected={selectedMatchId === match.id}
            courts={courts}
            onSelect={(match) => onMatchSelect(match.id)}
            onUpdate={onMatchUpdate}
            onCourtAssign={onCourtAssign}
          />
        ))}
      </div>
    </div>
  );
};

export default InProgressMatches;
