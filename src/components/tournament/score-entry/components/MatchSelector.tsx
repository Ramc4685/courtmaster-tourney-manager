
import React from "react";
import { Match } from "@/types/tournament";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MatchSelectorProps {
  matches: Match[];
  selectedMatchId: string;
  onMatchSelect: (matchId: string) => void;
}

const MatchSelector: React.FC<MatchSelectorProps> = ({
  matches,
  selectedMatchId,
  onMatchSelect
}) => {
  return (
    <div>
      <label htmlFor="match-select" className="block text-sm font-medium text-gray-700 mb-1">
        Select a Match to Score
      </label>
      <div className="flex flex-wrap gap-2">
        <Select value={selectedMatchId} onValueChange={onMatchSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a match" />
          </SelectTrigger>
          <SelectContent>
            {matches.map((match) => (
              <SelectItem key={match.id} value={match.id}>
                {match.team1.name} vs {match.team2.name} 
                {match.status === "IN_PROGRESS" ? " (In Progress)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default MatchSelector;
