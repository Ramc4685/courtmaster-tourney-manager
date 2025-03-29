
import React from "react";
import { Match } from "@/types/tournament";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MatchCard from "@/components/shared/MatchCard";
import { Badge } from "@/components/ui/badge";

interface ScheduledMatchesListProps {
  matches: Match[];
  onStartMatch: (match: Match) => void;
}

const ScheduledMatchesList: React.FC<ScheduledMatchesListProps> = ({
  matches,
  onStartMatch
}) => {
  if (matches.length === 0) {
    return <p className="text-gray-500">No scheduled matches available</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <Card key={match.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <Badge variant={match.courtNumber ? "outline" : "secondary"} className="mb-2">
                {match.courtNumber ? `Court ${match.courtNumber}` : "No Court Assigned"}
              </Badge>
              <Badge variant={
                match.status === "SCHEDULED" ? "outline" : 
                match.status === "IN_PROGRESS" ? "default" : 
                match.status === "COMPLETED" ? "success" : "destructive"
              }>
                {match.status}
              </Badge>
            </div>
            <MatchCard match={match} detailed={false} />
          </CardContent>
          <CardFooter className="bg-gray-50 px-4 py-3 flex justify-end">
            <Button 
              size="sm"
              className="bg-court-green hover:bg-court-green/90"
              onClick={() => onStartMatch(match)}
              disabled={!match.courtNumber}
              title={!match.courtNumber ? "Assign a court first" : "Start match"}
            >
              Start Match
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ScheduledMatchesList;
