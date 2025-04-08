import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TournamentView() {
  const { id } = useParams();
  const { tournaments } = useTournament();
  const tournament = tournaments.find(t => t.id === id);

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>{tournament.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium">Format</h3>
                  <p className="text-muted-foreground">{tournament.format.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="text-muted-foreground">{tournament.status}</p>
                </div>
                <div>
                  <h3 className="font-medium">Categories</h3>
                  <p className="text-muted-foreground">{tournament.categories?.length || 0} categories</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teams">
              <div className="grid gap-4">
                {tournament.teams?.map(team => (
                  <Card key={team.id}>
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="matches">
              <div className="grid gap-4">
                {tournament.matches?.map(match => (
                  <Card key={match.id}>
                    <CardHeader>
                      <CardTitle>Match {match.id}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="standings">
              <p>Standings will be displayed here</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 