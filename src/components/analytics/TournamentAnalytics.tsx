
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LineChart from './LineChart';
import BarChart from './BarChart';

interface TournamentAnalyticsProps {
  tournamentId: string;
}

const TournamentAnalytics: React.FC<TournamentAnalyticsProps> = ({ tournamentId }) => {
  // Placeholder data for charts
  const matchesByDayData = [5, 8, 12, 10, 7, 4];
  const playerParticipationData = [20, 25, 30, 35, 40, 45];
  const courtUtilizationData = [65, 80, 75, 90, 85, 70];
  const durationData = [45, 50, 40, 55, 60, 50];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tournament Analytics</h2>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="courts">Courts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Matches</CardTitle>
                <CardDescription>Across all divisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">48</div>
                <p className="text-sm text-muted-foreground">+12% from previous tournament</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Player Participation</CardTitle>
                <CardDescription>Unique players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">64</div>
                <p className="text-sm text-muted-foreground">+8% from previous tournament</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Match Duration</CardTitle>
                <CardDescription>In minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">45</div>
                <p className="text-sm text-muted-foreground">-5% from previous tournament</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Court Utilization</CardTitle>
                <CardDescription>Average % used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">78%</div>
                <p className="text-sm text-muted-foreground">+15% from previous tournament</p>
              </CardContent>
            </Card>
          </div>
          
          <LineChart 
            data={matchesByDayData} 
            className="mt-4" 
            lines={[
              { label: "Matches", color: "#0E76D7" }
            ]}
          />
        </TabsContent>
        
        <TabsContent value="matches" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Match Analytics</CardTitle>
              <CardDescription>Match statistics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={durationData} 
                className="mt-4" 
                bars={[
                  { label: "Duration", color: "#22C55E" }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="players" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Analytics</CardTitle>
              <CardDescription>Participation and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={playerParticipationData} 
                className="mt-4" 
                lines={[
                  { label: "Participation", color: "#F59E0B" }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courts" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Court Analytics</CardTitle>
              <CardDescription>Utilization and scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={courtUtilizationData} 
                className="mt-4" 
                bars={[
                  { label: "Utilization", color: "#8B5CF6" }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentAnalytics;
