
import React from 'react';
import { Court, Match, Tournament } from '@/types/tournament';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  if (!courts.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No courts available.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Courts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map((court) => (
          <Card 
            key={court.id}
            className={`cursor-pointer hover:border-primary ${
              court.status === 'IN_USE' ? 'border-amber-400' : ''
            }`}
            onClick={() => onSelectCourt(court)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">Court {court.number}</h3>
                <Badge variant={court.status === 'IN_USE' ? "default" : "outline"}>
                  {court.status === 'IN_USE' ? 'In Use' : 'Available'}
                </Badge>
              </div>
              
              {court.currentMatch && (
                <div 
                  className="mt-4 p-3 bg-gray-50 rounded cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMatch(court.currentMatch as Match);
                  }}
                >
                  <p className="font-medium">Current Match:</p>
                  <div className="flex justify-between mt-2">
                    <span>{court.currentMatch.team1.name}</span>
                    <span>vs</span>
                    <span>{court.currentMatch.team2.name}</span>
                  </div>
                  {court.currentMatch.scores && court.currentMatch.scores.length > 0 && (
                    <div className="text-center mt-2 text-sm">
                      Score: {court.currentMatch.scores.map((set, idx) => (
                        <span key={idx}>
                          {idx > 0 && ', '}
                          {set.team1Score}-{set.team2Score}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>Status: {court.currentMatch.status}</span>
                    {court.currentMatch.scheduledTime && (
                      <span>
                        {new Date(court.currentMatch.scheduledTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourtView;
