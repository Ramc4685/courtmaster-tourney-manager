
import React from 'react';
import { Court, Match, Tournament } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, MapPin, Users } from 'lucide-react';

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
  // Get upcoming matches that don't have a court assigned
  const upcomingMatches = tournament.matches
    .filter(m => 
      (m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS') && 
      !m.courtNumber
    )
    .sort((a, b) => {
      const aTime = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
      const bTime = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
      return aTime - bTime;
    });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Courts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map((court) => {
          // Find if there's a match in progress on this court
          const activeMatch = tournament.matches.find(m => 
            m.courtNumber === court.number && 
            (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED')
          );

          return (
            <Card 
              key={court.id} 
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                activeMatch ? 'border-green-500' : 'border-gray-200'
              }`}
              onClick={() => onSelectCourt(court)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Court {court.number}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    court.status === 'AVAILABLE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {court.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeMatch ? (
                  <div className="space-y-2">
                    <div className="font-medium">{activeMatch.team1.name} vs {activeMatch.team2.name}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {activeMatch.status === 'IN_PROGRESS' ? 'In Progress' : 'Scheduled'}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMatch(activeMatch);
                      }}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Score Match
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-500 py-4 text-center">
                    <MapPin className="h-5 w-5 mx-auto mb-1" />
                    <p>No active match</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {upcomingMatches.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-8">Upcoming Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.slice(0, 6).map((match) => (
              <Card 
                key={match.id} 
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => onSelectMatch(match)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>{match.team1.name} vs {match.team2.name}</span>
                    <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {match.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {match.scheduledTime 
                        ? new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'No time set'
                      }
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {match.category?.name || 'General'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CourtView;
