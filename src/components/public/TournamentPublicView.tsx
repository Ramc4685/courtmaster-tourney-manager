
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tournament, Match } from '@/types/tournament';

interface TournamentPublicViewProps {
  tournament: Tournament;
  upcomingMatches: Match[];
  announcements: { id: string; title: string; content: string; date: string }[];
}

export const TournamentPublicView: React.FC<TournamentPublicViewProps> = ({
  tournament,
  upcomingMatches,
  announcements,
}) => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        <p className="text-muted-foreground">
          {tournament.startDate && new Date(tournament.startDate).toLocaleDateString()}
          {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString()}`}
        </p>
      </div>
      
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMatches.map(match => (
                    <div key={match.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">
                          {match.team1?.name || 'Player 1'} vs {match.team2?.name || 'Player 2'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Court {match.court?.number || 'TBD'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {match.scheduledTime ? 
                            new Date(match.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                            'TBD'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {match.scheduledTime ? 
                            new Date(match.scheduledTime).toLocaleDateString() : 
                            'TBD'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No upcoming matches</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="border-b pb-2">
                      <h3 className="font-medium">{announcement.title}</h3>
                      <p className="text-sm">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(announcement.date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No announcements</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No results available yet</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="standings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Standings will be available when matches are completed</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
