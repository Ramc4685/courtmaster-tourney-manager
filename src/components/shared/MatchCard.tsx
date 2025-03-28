
import React from "react";
import { Match } from "@/types/tournament";
import { MapPin, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface MatchCardProps {
  match: Match;
  onSelect?: () => void;
  mode?: "compact" | "full";
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onSelect, mode = "full" }) => {
  const { team1, team2, scores, status, courtNumber, scheduledTime, division, stage } = match;
  
  const getStatusBadge = () => {
    switch (status) {
      case "SCHEDULED":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Not Started</span>;
      case "IN_PROGRESS":
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full animate-pulse">In Progress</span>;
      case "COMPLETED":
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Completed</span>;
      case "CANCELLED":
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Cancelled</span>;
      default:
        return null;
    }
  };

  const getDivisionBadge = () => {
    // Don't show division badge if it's INITIAL and stage is INITIAL_ROUND to avoid duplication
    if (division === "INITIAL" && stage === "INITIAL_ROUND") {
      return null;
    }
    
    switch (division) {
      case "DIVISION_1":
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Division 1</span>;
      case "DIVISION_2":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Division 2</span>;
      case "DIVISION_3":
        return <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">Division 3</span>;
      case "QUALIFIER_DIV1":
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">Div 1 Qualifier</span>;
      case "QUALIFIER_DIV2":
        return <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full">Div 2 Qualifier</span>;
      case "GROUP_DIV3":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">Div 3 Groups</span>;
      case "INITIAL":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Initial Round</span>;
      default:
        return null;
    }
  };

  const getStageBadge = () => {
    switch (stage) {
      case "INITIAL_ROUND":
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Initial Round</span>;
      case "DIVISION_PLACEMENT":
        return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Division Placement</span>;
      case "PLAYOFF_KNOCKOUT":
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Playoff Knockout</span>;
      case "COMPLETED":
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Completed</span>;
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
        <div className="flex flex-wrap justify-between items-center mt-2 text-xs text-gray-500 gap-1">
          {getStatusBadge()}
          <div className="flex items-center space-x-2">
            {courtNumber && (
              <div className="flex items-center">
                <MapPin size={12} className="mr-1" />
                <span>Court {courtNumber}</span>
              </div>
            )}
            {scheduledTime && (
              <div className="flex items-center">
                <Clock size={12} className="mr-1" />
                <span>{format(new Date(scheduledTime), "h:mm a")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="match-card cursor-pointer" 
      onClick={onSelect}
    >
      <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
        <div className="flex flex-wrap gap-2">
          {getStatusBadge()}
          {getDivisionBadge()}
          {getStageBadge()}
        </div>
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
              <span>{format(new Date(scheduledTime), "h:mm a")}</span>
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
          {team1.initialRanking && (
            <span className="text-xs text-gray-500">#{team1.initialRanking}</span>
          )}
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
          {team2.initialRanking && (
            <span className="text-xs text-gray-500">#{team2.initialRanking}</span>
          )}
        </div>
        <span className={`text-2xl font-bold ${status === "IN_PROGRESS" ? "text-court-green" : ""}`}>
          {currentScore.team2Score}
        </span>
      </div>
      
      {scores.length > 0 && (
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
      
      {scheduledTime && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-center">
          <Calendar size={12} className="mr-1" />
          <span>{format(new Date(scheduledTime), "MMMM d, yyyy")}</span>
        </div>
      )}
      
      {match.groupName && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {match.groupName}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
