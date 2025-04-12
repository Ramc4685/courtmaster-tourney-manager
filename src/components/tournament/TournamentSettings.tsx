import React from 'react';
import { Tournament } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TournamentSettingsProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

const TournamentSettings: React.FC<TournamentSettingsProps> = ({ tournament, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Settings</CardTitle>
        <CardDescription>Configure tournament settings and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Tournament settings configuration coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default TournamentSettings;
