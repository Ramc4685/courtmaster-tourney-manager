
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LineChart, BarChart } from "@/components/ui/chart";
import { Users, Trophy, BarChart2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsProps {
  tournamentId: string;
  metrics: {
    matchesCompleted: number;
    totalMatches: number;
    activePlayers: number;
    courtUtilization: number[];
    playerStatistics: any[];
    courtUsage: {
      courtId: string;
      usagePercentage: number;
    }[];
  };
}

const TournamentAnalytics: React.FC<AnalyticsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Progress</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.matchesCompleted} / {metrics.totalMatches}</div>
            <Progress 
              value={(metrics.matchesCompleted / metrics.totalMatches) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activePlayers}</div>
            <p className="text-xs text-muted-foreground">Active in last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Court Utilization</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.courtUtilization.reduce((a, b) => a + b, 0) / metrics.courtUtilization.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Average utilization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Court Usage Over Time</CardTitle>
            <CardDescription>Hourly court utilization rate</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={metrics.courtUtilization}
              className="h-[300px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Court Usage Distribution</CardTitle>
            <CardDescription>Usage percentage by court</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={metrics.courtUsage.map(c => c.usagePercentage)}
              className="h-[300px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TournamentAnalytics;
