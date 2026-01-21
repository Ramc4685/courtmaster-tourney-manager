import React from 'react';
import { Court, Match } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SimpleCourtTableProps {
  courts: Court[];
  matches: Match[];
  onCourtUpdate?: (court: Court) => void;
  onMatchUpdate?: (match: Match) => void;
  onClearCourt?: (courtId: string) => void;
}

export const SimpleCourtTable: React.FC<SimpleCourtTableProps> = ({
  courts,
  matches,
  onCourtUpdate,
  onMatchUpdate,
  onClearCourt
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Courts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map((court) => (
          <Card key={court.id} className="border">
            <CardHeader>
              <CardTitle className="text-sm">{court.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Status: {court.status}
                </p>
                {court.currentMatch && (
                  <div className="text-sm">
                    <p className="font-medium">Current Match:</p>
                    <p>{court.currentMatch.team1?.name || 'TBD'} vs {court.currentMatch.team2?.name || 'TBD'}</p>
                  </div>
                )}
                {onClearCourt && court.currentMatch && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onClearCourt(court.id)}
                  >
                    Clear Court
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-2">Unassigned Matches</h4>
        <div className="space-y-2">
          {matches.filter(match => !match.courtId).map((match) => (
            <Card key={match.id} className="border-dashed">
              <CardContent className="p-3">
                <p className="text-sm">
                  {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
                </p>
                <p className="text-xs text-gray-500">
                  Round {match.roundNumber} - Match {match.matchNumber}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
