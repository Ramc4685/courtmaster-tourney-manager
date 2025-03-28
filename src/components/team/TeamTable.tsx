
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X } from "lucide-react";
import { Team } from "@/types/tournament";

interface TeamTableProps {
  teams: Team[];
  onTeamUpdate: (team: Team) => void;
}

const TeamTable: React.FC<TeamTableProps> = ({ teams, onTeamUpdate }) => {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editedTeamName, setEditedTeamName] = useState("");

  const handleEditClick = (team: Team) => {
    setEditingTeamId(team.id);
    setEditedTeamName(team.name);
  };

  const handleSaveClick = (team: Team) => {
    const updatedTeam = {
      ...team,
      name: editedTeamName
    };
    onTeamUpdate(updatedTeam);
    setEditingTeamId(null);
  };

  const handleCancelClick = () => {
    setEditingTeamId(null);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Players</TableHead>
            <TableHead>Seed</TableHead>
            <TableHead>Initial Ranking</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No teams found. Add a team to get started.
              </TableCell>
            </TableRow>
          ) : (
            teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  {editingTeamId === team.id ? (
                    <Input
                      value={editedTeamName}
                      onChange={(e) => setEditedTeamName(e.target.value)}
                    />
                  ) : (
                    team.name
                  )}
                </TableCell>
                <TableCell>
                  {team.players.map((player) => player.name).join(", ")}
                </TableCell>
                <TableCell>{team.seed || "-"}</TableCell>
                <TableCell>{team.initialRanking || "-"}</TableCell>
                <TableCell className="text-right">
                  {editingTeamId === team.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleSaveClick(team)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelClick}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(team)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamTable;
