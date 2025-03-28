
import React from "react";
import { Team } from "@/types/tournament";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TeamListProps {
  teams: Team[];
}

const TeamList: React.FC<TeamListProps> = ({ teams }) => {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No teams yet</h3>
        <p className="mt-1 text-gray-500">Add teams to the tournament to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <Card key={team.id} className="overflow-hidden">
          <div className="bg-court-green h-2" />
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">{team.name}</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 font-medium">Players:</p>
              {team.players.map((player) => (
                <div key={player.id} className="text-sm">
                  {player.name}
                  {player.email && <span className="text-xs text-gray-500 ml-2">({player.email})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeamList;
