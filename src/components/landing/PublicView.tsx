
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PublicView: React.FC = () => {
  // Mock data for demonstration
  const upcomingMatches = [
    { id: 1, team1: 'Smith/Lee', team2: 'Johnson/Brown', court: 'Court 1', time: '10:30 AM' },
    { id: 2, team1: 'Davis/Wilson', team2: 'Taylor/Harris', court: 'Court 2', time: '11:00 AM' },
  ];
  
  const recentResults = [
    { id: 1, team1: 'Adams/Morris', team2: 'Clark/Lewis', score: '21-18, 21-15', winner: 'Adams/Morris' },
    { id: 2, team1: 'Young/Walker', team2: 'Hall/Wright', score: '19-21, 21-17, 21-18', winner: 'Young/Walker' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Upcoming Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-4">
                {upcomingMatches.map(match => (
                  <div key={match.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between mb-1">
                      <div>
                        <span className="font-medium">{match.team1}</span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span className="font-medium">{match.team2}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{match.time}</div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" /> 
                      {match.court}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Matches <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming matches</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-primary" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.map(result => (
                  <div key={result.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between mb-1">
                      <div>
                        <span className={result.winner === result.team1 ? "font-medium" : ""}>
                          {result.team1}
                        </span>
                        <span className="text-muted-foreground mx-2">vs</span>
                        <span className={result.winner === result.team2 ? "font-medium" : ""}>
                          {result.team2}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">{result.score}</div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Results <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No recent results</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tournament Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Current Tournament</h3>
              <p className="text-lg font-medium">Spring Badminton Championship 2025</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
                <p>Apr 15 - Apr 18, 2025</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p>City Sports Center</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
                <p>Singles, Doubles, Mixed</p>
              </div>
            </div>
            <Button variant="default" size="sm" className="mt-2">
              Tournament Details <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicView;
