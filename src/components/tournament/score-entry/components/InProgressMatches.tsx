
import React from "react";
import { Match, Court } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardEdit, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InProgressMatchesProps {
  matches: Match[];
  selectedMatchId: string;
  courts: Court[];
  onMatchSelect: (matchId: string) => void;
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
}

const InProgressMatches: React.FC<InProgressMatchesProps> = ({
  matches,
  selectedMatchId,
  courts,
  onMatchSelect,
  onMatchUpdate,
  onCourtAssign
}) => {
  if (matches.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Matches In Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <Card
            key={match.id}
            className={`overflow-hidden ${
              selectedMatchId === match.id ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <div className="space-y-2 mb-3">
                  <h4 className="font-semibold">
                    {match.team1.name} vs {match.team2.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">In Progress</Badge>
                    {match.courtNumber && (
                      <span className="text-sm text-gray-500">
                        Court {match.courtNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {match.scores && match.scores.length > 0
                      ? `Current score: ${match.scores.map(
                          (s) => `${s.team1Score}-${s.team2Score}`
                        )}`
                      : "No scores recorded"}
                  </p>
                </div>
                
                {/* Button group with flex layout */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => onMatchSelect(match.id)}
                  >
                    <ClipboardEdit className="h-4 w-4 mr-1" />
                    Record Result
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Defer Match
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InProgressMatches;
