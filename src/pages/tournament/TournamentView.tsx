
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tournament } from '@/types/tournament';
import { useTournament } from '@/contexts/tournament/TournamentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const TournamentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tournaments, currentTournament } = useTournament();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{tournament.name}</CardTitle>
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
              <h3 className="font-semibold">Status</h3>
              <p>{tournament.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentView;
