import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Trophy, Plus, Calendar } from 'lucide-react';
import { TournamentStatusBadge } from './TournamentStatusBadge';
import { Tournament } from '@/types/tournament';

interface TournamentListProps {
  tournaments: Tournament[];
}

export const TournamentList: React.FC<TournamentListProps> = ({ tournaments }) => {
  if (!tournaments?.length) {
    return (
      <div className="container px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No Tournaments Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first tournament to get started.
            </p>
            <Button asChild>
              <Link to="/tournaments/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => (
        <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{tournament.name}</span>
                <TournamentStatusBadge status={tournament.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>{tournament.format}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};