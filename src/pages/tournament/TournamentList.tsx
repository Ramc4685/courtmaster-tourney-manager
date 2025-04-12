import React from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/TournamentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { TournamentStatusBadge } from '@/components/tournament/TournamentStatusBadge';

const TournamentList: React.FC = () => {
  const { tournaments } = useTournament();

  if (!tournaments) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="mb-4">Loading tournaments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="mb-4">No tournaments found</p>
              <Link to="/tournament/create">
                <Button>Create Tournament</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Link to="/tournament/create">
          <Button>Create Tournament</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{tournament.name}</CardTitle>
                  <TournamentStatusBadge status={tournament.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p>{tournament.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p>{format(new Date(tournament.startDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p>{tournament.format.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p>{tournament.categories?.length || 0} categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TournamentList; 