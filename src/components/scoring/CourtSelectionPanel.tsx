
import React from 'react';
import { Court, Match } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourtSelectionPanelProps {
  courts: Court[];
  matches: Match[];
  onCourtSelect: (court: Court) => void;
  onMatchSelect: (match: Match) => void;
  onStartMatch: (match: Match) => void;
}

const CourtSelectionPanel: React.FC<CourtSelectionPanelProps> = ({
  courts,
  matches,
  onCourtSelect,
  onMatchSelect,
  onStartMatch
}) => {
  const navigate = useNavigate();

  const handleCourtClick = (court: Court) => {
    // First call the onCourtSelect handler
    onCourtSelect(court);
    
    // If the court has an active match, navigate to the scoring page
    if (court.currentMatch) {
      const matchId = court.currentMatch.id;
      console.log(`Navigating to scoring for match: ${matchId}`);
      navigate(`/scoring/${court.currentMatch.tournamentId}/${matchId}`);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Courts</h2>
      
      {courts.length === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-center">
          No courts available. Add courts in the tournament settings.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courts.map(court => (
            <Card 
              key={court.id} 
              className={`cursor-pointer hover:bg-gray-50 transition-colors
                ${court.status === 'IN_USE' ? 'border-blue-300 bg-blue-50' : 
                 court.status === 'MAINTENANCE' ? 'border-amber-300 bg-amber-50' :
                 'border-green-300 bg-green-50'}`}
              onClick={() => handleCourtClick(court)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{court.name || `Court ${court.number}`}</span>
                  <span className="text-xs px-2 py-1 rounded bg-white border">
                    {court.status}
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {court.currentMatch ? (
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">{court.currentMatch.team1?.name || 'TBD'}</div>
                      <div className="font-medium">vs</div>
                      <div className="font-medium">{court.currentMatch.team2?.name || 'TBD'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Match status: {court.currentMatch.status}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMatchSelect(court.currentMatch!);
                          // Navigate to scoring for this match
                          navigate(`/scoring/${court.currentMatch!.tournamentId}/${court.currentMatch!.id}`);
                        }}
                      >
                        View Scoring
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    <p>No active match</p>
                    
                    {/* Optional: Show a button to assign a match */}
                    {court.status === 'AVAILABLE' && matches.filter(m => m.status === 'SCHEDULED' && !m.courtNumber).length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Logic to show a match assignment dialog
                        }}
                      >
                        Assign Match
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourtSelectionPanel;
