
import React from "react";
import { Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchTable from "@/components/match/MatchTable";
import { Match, Team, Court } from "@/types/tournament";

interface MatchesTabProps {
  matches: Match[];
  teams: Team[];
  courts: Court[];
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
  onAddMatchClick: () => void;
  onAutoScheduleClick: () => void;
}

const MatchesTab: React.FC<MatchesTabProps> = ({
  matches,
  teams,
  courts,
  onMatchUpdate,
  onCourtAssign,
  onAddMatchClick,
  onAutoScheduleClick
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Matches</h2>
        <div className="space-x-2">
          <Button onClick={onAddMatchClick} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Schedule One Match
          </Button>
          <Button onClick={onAutoScheduleClick}>
            <Clock className="h-4 w-4 mr-2" />
            Auto Schedule
          </Button>
        </div>
      </div>
      <MatchTable
        matches={matches}
        teams={teams}
        courts={courts}
        onMatchUpdate={onMatchUpdate}
        onCourtAssign={onCourtAssign}
      />
    </div>
  );
};

export default MatchesTab;
