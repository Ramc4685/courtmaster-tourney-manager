import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Trophy, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tournament } from '@/types/tournament';

interface TournamentHeaderProps {
  tournament: Tournament;
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({ tournament }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 rounded-lg shadow-lg mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          <p className="text-muted-foreground mt-1">{tournament.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/tournament/${tournament.id}/settings`)}>
            Settings
          </Button>
          <Button>Start Matches</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="p-4 flex items-center gap-3 bg-card/50 backdrop-blur">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium">{new Date(tournament.startDate).toLocaleDateString()}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-card/50 backdrop-blur">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Teams</p>
            <p className="font-medium">{tournament.teams.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-card/50 backdrop-blur">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Format</p>
            <p className="font-medium">{tournament.format}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-card/50 backdrop-blur">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{tournament.status}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TournamentHeader;