
import React from "react";
import { Court, CourtStatus } from "@/types/tournament";
import { Clock, Users, Award } from "lucide-react";

interface CourtCardProps {
  court: Court;
  detailed?: boolean;
}

const CourtCard: React.FC<CourtCardProps> = ({ court, detailed = false }) => {
  const { name, number, status, currentMatch } = court;

  const getStatusColor = () => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500";
      case "IN_USE":
        return "bg-red-500";
      case "MAINTENANCE":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="court-card border rounded-lg p-4 bg-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">{name || `Court ${number}`}</h3>
        <span className={`${getStatusColor()} text-white text-xs px-2 py-1 rounded-full`}>
          {status}
        </span>
      </div>
      
      {currentMatch ? (
        <div className="bg-white rounded p-3 mt-2">
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentMatch.team1.name}</span>
              <span className="live-score text-court-blue text-xl font-bold">
                {currentMatch.scores.length > 0 
                  ? currentMatch.scores[currentMatch.scores.length - 1].team1Score 
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentMatch.team2.name}</span>
              <span className="live-score text-court-blue text-xl font-bold">
                {currentMatch.scores.length > 0 
                  ? currentMatch.scores[currentMatch.scores.length - 1].team2Score 
                  : 0}
              </span>
            </div>
          </div>
          
          {detailed && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-col space-y-2">
                {currentMatch.division && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Award size={14} className="mr-1" />
                    <span>
                      {currentMatch.division.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                
                {currentMatch.team1.players && currentMatch.team2.players && (
                  <div className="flex items-start text-sm text-gray-600">
                    <Users size={14} className="mr-1 mt-1" />
                    <div className="flex flex-col">
                      <span>
                        {currentMatch.team1.players.map(p => p.name).join(', ')}
                      </span>
                      <span>vs</span>
                      <span>
                        {currentMatch.team2.players.map(p => p.name).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                
                {currentMatch.scheduledTime && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={14} className="mr-1" />
                    <span>
                      {new Date(currentMatch.scheduledTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  </div>
                )}
                
                {currentMatch.scores.length > 1 && (
                  <div className="flex items-center space-x-2 mt-1">
                    {currentMatch.scores.slice(0, -1).map((score, idx) => (
                      <div key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {score.team1Score}-{score.team2Score}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded p-3 mt-2 flex items-center justify-center h-24">
          <p className="text-gray-500">No match scheduled</p>
        </div>
      )}
    </div>
  );
};

export default CourtCard;
