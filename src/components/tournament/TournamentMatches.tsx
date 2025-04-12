import React from 'react';
import { Tournament, Match } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TournamentMatchesProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

export const TournamentMatches: React.FC<TournamentMatchesProps> = ({ tournament, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matches</CardTitle>
        <CardDescription>View and manage tournament matches</CardDescription>
      </CardHeader>
      <CardContent>
        {tournament.matches?.length === 0 ? (
          <p className="text-muted-foreground">No matches scheduled yet.</p>
        ) : (
          <div className="grid gap-4">
            {tournament.matches?.map(match => (
              <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Match {match.matchNumber || match.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 