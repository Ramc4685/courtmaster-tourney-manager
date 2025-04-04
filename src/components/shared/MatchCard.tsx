import React from "react";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types/tournament";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface MatchCardProps {
  match: Match;
  detailed?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, detailed = false }) => {
  // Function to get badge variant based on match status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "secondary";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Determine if we have scores to display
  const hasScores = match.scores && match.scores.length > 0;

  return (
    <div className="border-b border-gray-100 pb-3 mb-3 last:mb-0 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-medium">{match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}</h3>
          
          {detailed && match.division && (
            <p className="text-sm text-gray-500 mt-1">
              Division: {match.division.replace(/_/g, ' ')}
            </p>
          )}
        </div>
        
        <Badge variant={getBadgeVariant(match.status)}>
          {match.status}
        </Badge>
      </div>
      
      {hasScores && (
        <div className="flex space-x-2 mb-2">
          {match.scores.map((score, idx) => (
            <div key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
              <span className="font-semibold">{score.team1Score}-{score.team2Score}</span>
              {detailed && <span className="text-xs text-gray-500 ml-1">Set {idx + 1}</span>}
            </div>
          ))}
        </div>
      )}
      
      {match.courtNumber && (
        <div className="text-sm text-gray-600">
          Court: {match.courtNumber}
        </div>
      )}
      
      {match.scheduledTime && (
        <div className="text-xs text-gray-500 flex items-center mt-1">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{format(new Date(match.scheduledTime), "MMM d")}</span>
          <Clock className="h-3 w-3 ml-2 mr-1" />
          <span>{format(new Date(match.scheduledTime), "h:mm a")}</span>
        </div>
      )}
      
      {match.status === "COMPLETED" && match.winner && (
        <div className="text-sm text-green-600 font-medium mt-1">
          Winner: {match.winner?.name || 'Unknown'}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
