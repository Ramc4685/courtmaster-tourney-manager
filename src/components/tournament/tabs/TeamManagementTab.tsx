
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Trash, Edit } from 'lucide-react';
import { Tournament, Team } from '@/types/tournament';
import { useTournament } from '@/contexts/tournament/useTournament';

interface TeamManagementTabProps {
  tournament: Tournament;
}

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({ tournament }) => {
  const [openAddTeamDialog, setOpenAddTeamDialog] = React.useState(false);
  const [openImportTeamsDialog, setOpenImportTeamsDialog] = React.useState(false);
  const { addTeam, importTeams } = useTournament();

  const handleAddTeam = (team: Team) => {
    addTeam(team);
  };

  const handleImportTeams = (teams: Team[]) => {
    importTeams(teams);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Team Management</h2>
        <div className="flex gap-2">
          <Button onClick={() => setOpenAddTeamDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
          <Button variant="outline" onClick={() => setOpenImportTeamsDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Teams
          </Button>
        </div>
      </div>

      {tournament.teams && tournament.teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournament.teams.map((team) => (
            <div key={team.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{team.name}</h3>
              {team.players && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Players:</p>
                  <ul className="list-disc list-inside">
                    {team.players.map((player, idx) => (
                      <li key={idx} className="text-sm">
                        {player.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No teams have been added yet.</p>
          <Button 
            variant="outline" 
            onClick={() => setOpenAddTeamDialog(true)} 
            className="mt-4"
          >
            Add Your First Team
          </Button>
        </div>
      )}

      {/* Team dialogs would be rendered here */}
    </div>
  );
};

export default TeamManagementTab;
