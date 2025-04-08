
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRealtimeTournamentUpdates } from '@/hooks/useRealtimeTournamentUpdates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Clock, Users2, WifiOff, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Match, Division } from '@/types/tournament';

const PublicViewRealtime: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("live");
  
  const realtime = useRealtimeTournamentUpdates(id || '');
  const { isConnected, lastUpdated, currentTournament, inProgressMatches, isSubscribed } = realtime;

  if (!currentTournament) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Divide matches by status
  const scheduledMatches = currentTournament.matches.filter(m => m.status === 'SCHEDULED');
  const completedMatches = currentTournament.matches.filter(m => m.status === 'COMPLETED');

  const renderMatchList = (matches: Match[]) => {
    if (!matches || matches.length === 0) {
      return (
        <div className="py-4 text-center text-muted-foreground">
          No matches in this category.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {matches.map(match => (
          <Card key={match.id} className="overflow-hidden">
            <div className="bg-muted px-4 py-2 flex justify-between items-center">
              <span className="text-sm font-medium">
                {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
              </span>
              <Badge variant={
                match.status === 'COMPLETED' ? 'default' : 
                match.status === 'IN_PROGRESS' ? 'secondary' : 
                'outline'
              }>
                {match.status}
              </Badge>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Time:</p>
                  <p className="text-sm font-medium">
                    {match.scheduledTime ? format(new Date(match.scheduledTime), 'PPp') : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Court:</p>
                  <p className="text-sm font-medium">
                    {match.courtNumber ? `Court ${match.courtNumber}` : 'Not assigned'}
                  </p>
                </div>
                {match.scores && match.scores.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <p className="text-sm text-muted-foreground">Score:</p>
                    <div className="flex space-x-2">
                      {match.scores.map((score, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          Set {idx + 1}: {score.team1Score}-{score.team2Score}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{currentTournament.name}</h1>
            <Badge variant={isConnected ? "success" : "destructive"} className="flex items-center gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Live Updates" : "Offline"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(currentTournament.startDate), 'PP')} - {format(new Date(currentTournament.endDate), 'PP')}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {currentTournament.format}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users2 className="h-3 w-3" />
              {currentTournament.teams.length} Teams
            </Badge>
          </div>
          
          {currentTournament.description && (
            <p className="mt-4 text-muted-foreground">{currentTournament.description}</p>
          )}
          
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {format(lastUpdated, 'PPp')}
            </p>
          )}
        </div>
        
        <Separator className="my-6" />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Live Matches</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Matches</CardTitle>
                <CardDescription>
                  Matches currently in progress with real-time score updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inProgressMatches && inProgressMatches.length > 0 ? (
                  renderMatchList(inProgressMatches)
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No matches currently in progress.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("schedule")}>
                      View Scheduled Matches
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Matches</CardTitle>
                <CardDescription>
                  All scheduled matches for {currentTournament.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderMatchList(scheduledMatches)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Completed matches and their outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedMatches.length > 0 ? (
                  renderMatchList(completedMatches)
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No completed matches yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("schedule")}>
                      View Scheduled Matches
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PublicViewRealtime;
