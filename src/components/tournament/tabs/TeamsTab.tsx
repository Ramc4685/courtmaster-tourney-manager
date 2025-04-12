import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamTable from "@/components/team/TeamTable";
import { Team, Tournament, TournamentCategory } from "@/types/tournament";
import { useTournament } from "@/contexts/tournament/useTournament";

interface TeamsTabProps {
  tournament: Tournament;
  category?: TournamentCategory; // Optional category for filtered view
}

const TeamsTab: React.FC<TeamsTabProps> = ({
  tournament,
  category
}) => {
  const { updateTeam } = useTournament();

  // Filter teams by category if one is provided
  const filteredTeams = category 
    ? tournament.teams?.filter(team => team.category && team.category.id === category.id)
    : tournament.teams || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {category ? `${category.name} Teams` : 'All Teams'}
        </h2>
      </div>
      
      {filteredTeams.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No teams found for {category ? category.name : 'this tournament'}.</p>
        </div>
      ) : (
        <TeamTable
          teams={filteredTeams}
          onTeamUpdate={updateTeam}
        />
      )}
    </div>
  );
};

export default TeamsTab;
