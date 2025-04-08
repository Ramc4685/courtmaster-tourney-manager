
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, BarChart } from "@/components/ui/chart";

interface AnalyticsProps {
  tournamentId: string;
  metrics: {
    matchesCompleted: number;
    activePlayers: number;
    courtUtilization: number[];
    playerStatistics: any[];
  };
}

const TournamentAnalytics: React.FC<AnalyticsProps> = ({ metrics }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Matches Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.matchesCompleted}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activePlayers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Court Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={metrics.courtUtilization}
            className="h-[200px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentAnalytics;
