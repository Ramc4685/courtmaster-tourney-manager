
import React from 'react';
import { Tournament, Match, Court } from '@/types/tournament';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CourtViewProps {
  tournament: Tournament;
  courts: Court[];
  onSelectCourt: (court: Court) => void;
  onSelectMatch: (match: Match) => void;
}

const CourtView: React.FC<CourtViewProps> = ({
  tournament,
  courts,
  onSelectCourt,
  onSelectMatch
}) => {
  // Get active matches (matches in progress or scheduled)
  const activeMatches = tournament.matches.filter(
    m => m.status === "IN_PROGRESS" || m.status === "SCHEDULED"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Courts</h2>
        {courts.length === 0 ? (
          <p className="text-gray-500">No courts available.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {courts.map(court => {
              // Find the match happening on this court
              const matchOnCourt = tournament.matches.find(
                m => 
                  m.courtNumber === court.number && 
                  (m.status === "IN_PROGRESS" || m.status === "SCHEDULED")
              );

              return (
                <Card 
                  key={court.id}
                  className={`
                    cursor-pointer hover:shadow-md transition-shadow
                    ${matchOnCourt ? 'bg-green-50 border-green-200' : 'bg-gray-50'}
                  `}
                  onClick={() => onSelectCourt(court)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-1">Court {court.number}</h3>
                    {matchOnCourt ? (
                      <div>
                        <p className="text-sm">{matchOnCourt.team1.name} vs {matchOnCourt.team2.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {matchOnCourt.status}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No active match</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Active Matches</h2>
        {activeMatches.length === 0 ? (
          <p className="text-gray-500">No active matches.</p>
        ) : (
          <div className="space-y-2">
            {activeMatches.map(match => (
              <Card 
                key={match.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectMatch(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{match.team1.name} vs {match.team2.name}</h3>
                      <p className="text-sm text-gray-500">
                        Court: {match.courtNumber || 'Not assigned'} • 
                        Status: {match.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      onSelectMatch(match);
                    }}>
                      Score
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtView;
