
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamTable from "@/components/team/TeamTable";
import { Team, TournamentCategory } from "@/types/tournament";

interface TeamsTabProps {
  teams: Team[];
  onTeamUpdate: (team: Team) => void;
  onAddTeamClick: () => void;
  category?: TournamentCategory; // Optional category for filtered view
}

const TeamsTab: React.FC<TeamsTabProps> = ({
  teams,
  onTeamUpdate,
  onAddTeamClick,
  category
}) => {
  // Filter teams by category if one is provided
  const filteredTeams = category 
    ? teams.filter(team => team.category && team.category.id === category.id)
    : teams;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {category ? `${category.name} Teams` : 'All Teams'}
        </h2>
        <Button onClick={onAddTeamClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>
      
      {filteredTeams.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No teams found for {category ? category.name : 'this tournament'}.</p>
        </div>
      ) : (
        <TeamTable
          teams={filteredTeams}
          onTeamUpdate={onTeamUpdate}
        />
      )}
    </div>
  );
};

export default TeamsTab;
