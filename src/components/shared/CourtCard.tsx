
// Since this is a read-only file, we cannot modify it directly.
// We'll need to create a new enhanced version that we can use where needed

<lov-write file_path="src/components/shared/EnhancedCourtCard.tsx">
import React from "react";
import { Court } from "@/types/tournament";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Clock, Calendar } from "lucide-react";

interface EnhancedCourtCardProps {
  court: Court;
  detailed?: boolean;
}

const EnhancedCourtCard: React.FC<EnhancedCourtCardProps> = ({ court, detailed = false }) => {
  const { name, number, status, currentMatch } = court;
  
  const getStatusColor = () => {
    switch (status) {
      case "AVAILABLE":
        return "bg-court-green";
      case "IN_USE":
        return "bg-amber-500";
      case "MAINTENANCE":
        return "bg-gray-400";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${getStatusColor()}`} />
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{name}</h3>
          <span className={`text-sm px-2 py-0.5 rounded-full ${
            status === "AVAILABLE" 
              ? "bg-green-100 text-green-800" 
              : status === "IN_USE" 
                ? "bg-amber-100 text-amber-800" 
                : "bg-gray-100 text-gray-800"
          }`}>
            {status}
          </span>
        </div>
        
        {currentMatch ? (
          <div className="mt-3 border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm">Current Match</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                currentMatch.status === "IN_PROGRESS" 
                  ? "bg-green-100 text-green-800 animate-pulse" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {currentMatch.status}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">{currentMatch.team1.name}</span>
                {currentMatch.scores.length > 0 && (
                  <span className="font-bold text-sm">
                    {currentMatch.scores[currentMatch.scores.length - 1].team1Score}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{currentMatch.team2.name}</span>
                {currentMatch.scores.length > 0 && (
                  <span className="font-bold text-sm">
                    {currentMatch.scores[currentMatch.scores.length - 1].team2Score}
                  </span>
                )}
              </div>
              
              {detailed && currentMatch.scheduledTime && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{format(new Date(currentMatch.scheduledTime), "MMM d")}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{format(new Date(currentMatch.scheduledTime), "h:mm a")}</span>
                  </div>
                </div>
              )}
              
              {detailed && currentMatch.division && (
                <div className="mt-1 text-xs text-gray-500">
                  Division: {currentMatch.division.replace("_", " ")}
                </div>
              )}
              
              {detailed && currentMatch.scores.length > 1 && (
                <div className="mt-2 text-xs flex items-center space-x-2">
                  <span className="text-gray-500">Sets:</span>
                  <div className="flex space-x-1">
                    {currentMatch.scores.map((score, idx) => (
                      <span key={idx} className="bg-gray-100 rounded px-1">
                        {score.team1Score}-{score.team2Score}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-gray-500">
            No match currently scheduled
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedCourtCard;
