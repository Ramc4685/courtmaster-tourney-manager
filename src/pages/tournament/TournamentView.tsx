import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament } from '@/types/tournament';
import { useTournament } from '@/contexts/tournament/TournamentContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { TournamentStatusBadge } from '@/components/tournament/TournamentStatusBadge';
import { TournamentTeams } from '@/components/tournament/TournamentTeams';
import { TournamentMatches } from '@/components/tournament/TournamentMatches';
import TournamentBracket from '@/components/tournament/TournamentBracket';
import TournamentSettings from '@/components/tournament/TournamentSettings';

const TournamentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, currentTournament, updateTournament, deleteTournament } = useTournament();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      console.log('Looking for tournament with ID:', id);
      console.log('Current tournament:', currentTournament);
      console.log('Available tournaments:', tournaments);
      
      if (currentTournament && currentTournament.id === id) {
        console.log('Found matching current tournament');
        setTournament(currentTournament);
      } else {
        const foundTournament = tournaments.find(t => t.id === id);
        console.log('Found tournament from list:', foundTournament);
        setTournament(foundTournament || null);
      }
      setLoading(false);
    }
  }, [id, tournaments, currentTournament]);

  const handleDelete = async () => {
    if (tournament && window.confirm('Are you sure you want to delete this tournament?')) {
      await deleteTournament(tournament.id);
      navigate('/tournaments');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            <p>Loading tournament...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            <p>Tournament not found</p>
            <Button onClick={() => navigate('/tournaments')} className="mt-4">
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
          <div className="flex items-center gap-2">
            <TournamentStatusBadge status={tournament.status} />
            <span className="text-muted-foreground">
              Created {format(new Date(tournament.createdAt), 'PPP')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/tournaments')}>
            Back
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
              <CardDescription>Basic information about the tournament</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p>{tournament.location}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Dates</h3>
                  <p>
                    {format(new Date(tournament.startDate), 'PPP')} -{' '}
                    {tournament.endDate ? format(new Date(tournament.endDate), 'PPP') : 'Ongoing'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Format</h3>
                  <p>{String(tournament.format).replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Categories</h3>
                  <p>{tournament.categories?.length || 0} categories</p>
                </div>
                <div>
                  <h3 className="font-semibold">Teams</h3>
                  <p>{tournament.teams?.length || 0} teams registered</p>
                </div>
                <div>
                  <h3 className="font-semibold">Matches</h3>
                  <p>{tournament.matches?.length || 0} matches scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <TournamentTeams tournament={tournament} onUpdate={updateTournament} />
        </TabsContent>

        <TabsContent value="matches">
          <TournamentMatches tournament={tournament} onUpdate={updateTournament} />
        </TabsContent>

        <TabsContent value="bracket">
          <TournamentBracket tournament={tournament} onUpdate={updateTournament} />
        </TabsContent>

        <TabsContent value="settings">
          <TournamentSettings tournament={tournament} onUpdate={updateTournament} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentView;
