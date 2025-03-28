
import React from "react";
import { Match } from "@/types/tournament";
import { MapPin, Clock } from "lucide-react";

interface MatchCardProps {
  match: Match;
  onSelect?: () => void;
  mode?: "compact" | "full";
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onSelect, mode = "full" }) => {
  const { team1, team2, scores, status, courtNumber, scheduledTime } = match;
  
  const getStatusBadge = () => {
    switch (status) {
      case "SCHEDULED":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Scheduled</span>;
      case "IN_PROGRESS":
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full animate-pulse">Live</span>;
      case "COMPLETED":
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Completed</span>;
      case "CANCELLED":
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Cancelled</span>;
      default:
        return null;
    }
  };

  // Get the current scores
  const currentScore = scores.length > 0 ? scores[scores.length - 1] : { team1Score: 0, team2Score: 0 };
  
  // Calculate sets won
  const team1Sets = scores.filter(s => s.team1Score > s.team2Score).length;
  const team2Sets = scores.filter(s => s.team2Score > s.team1Score).length;

  if (mode === "compact") {
    return (
      <div 
        className="match-card cursor-pointer" 
        onClick={onSelect}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-medium">{team1.name}</span>
            <span className="font-medium">{team2.name}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-lg font-bold ${status === "IN_PROGRESS" ? "text-court-green" : ""}`}>
              {currentScore.team1Score}
            </span>
            <span className={`text-lg font-bold ${status === "IN_PROGRESS" ? "text-court-green" : ""}`}>
              {currentScore.team2Score}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          {getStatusBadge()}
          {courtNumber && (
            <div className="flex items-center">
              <MapPin size={12} className="mr-1" />
              <span>Court {courtNumber}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="match-card cursor-pointer" 
      onClick={onSelect}
    >
      <div className="flex justify-between items-center mb-3">
        {getStatusBadge()}
        <div className="flex space-x-3 text-sm text-gray-500">
          {courtNumber && (
            <div className="flex items-center">
              <MapPin size={14} className="mr-1" />
              <span>Court {courtNumber}</span>
            </div>
          )}
          {scheduledTime && (
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full bg-court-blue flex items-center justify-center text-white text-xs font-bold`}>
            {team1Sets}
          </div>
          <span className="font-medium">{team1.name}</span>
        </div>
        <span className={`text-2xl font-bold ${status === "IN_PROGRESS" ? "text-court-green" : ""}`}>
          {currentScore.team1Score}
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full bg-court-blue flex items-center justify-center text-white text-xs font-bold`}>
            {team2Sets}
          </div>
          <span className="font-medium">{team2.name}</span>
        </div>
        <span className={`text-2xl font-bold ${status === "IN_PROGRESS" ? "text-court-green" : ""}`}>
          {currentScore.team2Score}
        </span>
      </div>
      
      {scores.length > 1 && (
        <div className="flex justify-center space-x-4 mt-3 text-sm text-gray-500">
          {scores.map((score, index) => (
            <div key={index} className="flex space-x-1">
              <span>{score.team1Score}</span>
              <span>-</span>
              <span>{score.team2Score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
