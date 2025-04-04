
import React from 'react';
import { Tournament, Match, Court } from '@/types/tournament';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourtViewProps {
  tournament: Tournament;
  courts: Court[];
  onSelectCourt: (courtNumber: number) => void;
  onSelectMatch: (match: Match) => void;
}

const CourtView: React.FC<CourtViewProps> = ({
  tournament,
  courts,
  onSelectCourt,
  onSelectMatch
}) => {
  // Find active matches that are in progress
  const activeMatches = tournament.matches.filter(match => 
    match.status === 'IN_PROGRESS'
  );

  // Find scheduled matches
  const scheduledMatches = tournament.matches.filter(match => 
    match.status === 'SCHEDULED'
  );

  if (courts.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Courts Available</h2>
        <p className="text-gray-600 mb-4">
          Please add courts to the tournament before starting matches.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tournament Courts</h2>
      
      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {courts.map((court) => (
          <Card key={court.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Court {court.number}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  court.currentMatch ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {court.currentMatch ? 'Active' : 'Available'}
                </span>
              </div>
              
              {court.name && <p className="text-sm text-gray-500 mb-2">{court.name}</p>}
              
              {court.currentMatch ? (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Current Match:</p>
                  <div className="bg-gray-50 p-2 rounded-md text-sm mb-2">
                    {court.currentMatch.team1.name} vs {court.currentMatch.team2.name}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => onSelectMatch(court.currentMatch!)}
                  >
                    Score This Match
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => onSelectCourt(court.number)}
                  >
                    Select Court
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Matches */}
      {activeMatches.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Active Matches</h3>
          <div className="space-y-2">
            {activeMatches.map(match => (
              <Card key={match.id} className="bg-green-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{match.team1.name} vs {match.team2.name}</div>
                      <div className="text-xs text-gray-600">
                        Court {match.courtNumber || 'Not assigned'} • 
                        {match.scores.length > 0 ? 
                          ` Set ${match.scores.length}: ${match.scores[match.scores.length-1].team1Score}-${match.scores[match.scores.length-1].team2Score}` : 
                          ' No Score'}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onSelectMatch(match)}>Score</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Matches */}
      {scheduledMatches.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Scheduled Matches</h3>
          <div className="space-y-2">
            {scheduledMatches.slice(0, 5).map(match => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{match.team1.name} vs {match.team2.name}</div>
                      <div className="text-xs text-gray-600">
                        {match.scheduledTime ? new Date(match.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No time'} • 
                        Court {match.courtNumber || 'Not assigned'}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onSelectMatch(match)}>Select</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {scheduledMatches.length > 5 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                +{scheduledMatches.length - 5} more scheduled matches
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtView;
