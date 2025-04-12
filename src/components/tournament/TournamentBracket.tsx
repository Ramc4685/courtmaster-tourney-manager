import React from 'react';
import { Tournament } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TournamentBracketProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Bracket</CardTitle>
        <CardDescription>View the tournament bracket structure</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Bracket visualization coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default TournamentBracket;
