
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tournament } from '@/types/tournament';

interface DashboardStatProps {
  title: string;
  value: number | string;
}

const DashboardStat: React.FC<DashboardStatProps> = ({ title, value }) => (
  <div className="flex flex-col">
    <p className="text-sm text-muted-foreground">{title}</p>
    <h2 className="text-3xl font-bold">{value}</h2>
  </div>
);

interface DashboardSummaryProps {
  tournaments: Tournament[];
  upcomingMatches: number;
  registeredPlayers: number;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  tournaments,
  upcomingMatches,
  registeredPlayers,
}) => {
  // Count ongoing tournaments
  const ongoingTournaments = tournaments.filter(t => t.status === 'IN_PROGRESS').length;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ongoingTournaments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingMatches}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Players Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{registeredPlayers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length > 0 ? (
              <div className="space-y-4">
                {tournaments.slice(0, 5).map(tournament => (
                  <div key={tournament.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h3 className="font-medium">{tournament.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tournament.status === 'IN_PROGRESS' 
                          ? 'bg-green-100 text-green-800' 
                          : tournament.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tournaments found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
