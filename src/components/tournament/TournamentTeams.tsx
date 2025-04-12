import React, { useState } from 'react';
import { Tournament, Team } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Division } from '@/types/tournament-enums';

interface TournamentTeamsProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

export const TournamentTeams: React.FC<TournamentTeamsProps> = ({ tournament, onUpdate }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      players: [],
      division: Division.INITIAL,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTournament = {
      ...tournament,
      teams: [...tournament.teams, newTeam],
      updatedAt: new Date()
    };

    await onUpdate(updatedTournament);
    setNewTeamName('');
    setIsAddingTeam(false);
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to remove this team?')) return;

    const updatedTournament = {
      ...tournament,
      teams: tournament.teams.filter(team => team.id !== teamId),
      updatedAt: new Date()
    };

    await onUpdate(updatedTournament);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardDescription>Manage tournament teams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tournament.teams.length === 0 ? (
            <p className="text-muted-foreground">No teams registered yet.</p>
          ) : (
            <div className="grid gap-4">
              {tournament.teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {team.players.length} players • {team.division}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => handleRemoveTeam(team.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isAddingTeam ? (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTeam}>Add Team</Button>
                <Button variant="outline" onClick={() => setIsAddingTeam(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAddingTeam(true)}>Add Team</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 