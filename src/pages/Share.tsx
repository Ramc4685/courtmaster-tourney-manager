import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Share: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { currentTournament, setCurrentTournament, tournaments } = useTournament();

  useEffect(() => {
    if (tournamentId) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        setCurrentTournament(tournament);
      } else {
        navigate('/tournaments');
      }
    }
  }, [tournamentId, tournaments, setCurrentTournament, navigate]);

  if (!currentTournament) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we load the tournament details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{currentTournament.name}</CardTitle>
          <CardDescription>Tournament Details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p><strong>Description:</strong> {currentTournament.description}</p>
            <p><strong>Status:</strong> {currentTournament.status}</p>
            <p><strong>Teams:</strong> {currentTournament.teams.length}</p>
            <p><strong>Matches:</strong> {currentTournament.matches.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Share; 