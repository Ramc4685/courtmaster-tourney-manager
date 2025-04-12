import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tournament } from "@/types/tournament";

interface RegistrationStatsProps {
  playerCount: number;
  teamCount: number;
  tournament: Tournament;
}

export const RegistrationStats: React.FC<RegistrationStatsProps> = ({
  playerCount,
  teamCount,
  tournament,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Individual Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{playerCount}</div>
          <p className="text-xs text-muted-foreground">
            Registered players in this tournament
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{teamCount}</div>
          <p className="text-xs text-muted-foreground">
            Registered teams in this tournament
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Registration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{tournament.status}</div>
          <p className="text-xs text-muted-foreground">
            {tournament.registrationDeadline
              ? `Deadline: ${tournament.registrationDeadline.toLocaleDateString()}`
              : "No deadline set"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 