import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTournament } from '@/contexts/tournament/useTournament';
import PageHeader from '@/components/shared/PageHeader';
import { Plus, CalendarDays, Users, Medal } from 'lucide-react';
import { format } from 'date-fns';
import { TournamentStatusBadge } from '@/components/tournament/TournamentStatusBadge';
import { useToast } from '@/hooks/use-toast';

const Tournaments = () => {
  const { tournaments } = useTournament();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Create a new tournament
  const handleCreateTournament = () => {
    // Navigate to the tournament creation page
    navigate('/tournaments/new');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Tournaments"
        description="Manage your badminton tournaments"
        action={
          <Button onClick={handleCreateTournament} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        }
      />

      <div className="mt-8">
        {tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link to={`/tournaments/${tournament.id}`} key={tournament.id}>
                <Card className="overflow-hidden h-full hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <div className="h-2 bg-primary w-full"></div>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium">{tournament.name}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{tournament.description || 'No description'}</p>
                      </div>
                      <TournamentStatusBadge status={tournament.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {tournament.startDate
                            ? format(new Date(tournament.startDate), 'MMM d, yyyy')
                            : 'No date set'}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {tournament.teams?.length || 0} Teams
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Medal className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {tournament.categories?.length || 0} Categories
                        </span>
                      </div>

                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {tournament.matches?.length || 0} Matches
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="max-w-lg mx-auto">
              <h2 className="text-2xl font-bold mb-4">No tournaments yet</h2>
              <p className="text-muted-foreground mb-8">
                You haven't created any tournaments yet. Create a new one to get started.
              </p>
              
              <Button onClick={handleCreateTournament} className="mx-auto flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
