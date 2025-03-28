
import React from "react";
import { Court } from "@/types/tournament";
import { Clock } from "lucide-react";

interface CourtCardProps {
  court: Court;
}

const CourtCard: React.FC<CourtCardProps> = ({ court }) => {
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
    <div className="court-card">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold text-lg">{name || `Court ${number}`}</h3>
        <span className={`${getStatusColor()} text-white text-xs px-2 py-1 rounded-full`}>
          {status}
        </span>
      </div>
      
      {currentMatch ? (
        <div className="bg-white/90 rounded p-3 mt-2">
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentMatch.team1.name}</span>
              <span className="live-score text-court-blue text-xl">
                {currentMatch.scores.length > 0 
                  ? currentMatch.scores[currentMatch.scores.length - 1].team1Score 
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentMatch.team2.name}</span>
              <span className="live-score text-court-blue text-xl">
                {currentMatch.scores.length > 0 
                  ? currentMatch.scores[currentMatch.scores.length - 1].team2Score 
                  : 0}
              </span>
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>
              {currentMatch.scheduledTime 
                ? new Date(currentMatch.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "In progress"}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white/90 rounded p-3 mt-2 flex items-center justify-center h-24">
          <p className="text-gray-500">No match scheduled</p>
        </div>
      )}
    </div>
  );
};

export default CourtCard;
