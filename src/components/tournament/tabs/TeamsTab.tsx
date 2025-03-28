
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamTable from "@/components/team/TeamTable";
import { Team } from "@/types/tournament";

interface TeamsTabProps {
  teams: Team[];
  onTeamUpdate: (team: Team) => void;
  onAddTeamClick: () => void;
}

const TeamsTab: React.FC<TeamsTabProps> = ({
  teams,
  onTeamUpdate,
  onAddTeamClick
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Button onClick={onAddTeamClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>
      <TeamTable
        teams={teams}
        onTeamUpdate={onTeamUpdate}
      />
    </div>
  );
};

export default TeamsTab;
