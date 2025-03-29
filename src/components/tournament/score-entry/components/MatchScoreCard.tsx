
import React from "react";
import { Match } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import ManualResultEntry from "@/components/match/ManualResultEntry";
import DeferMatch from "@/components/match/DeferMatch";

interface MatchScoreCardProps {
  match: Match;
  isSelected: boolean;
  courts: any[];
  onSelect: (match: Match) => void;
  onUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
}

const MatchScoreCard: React.FC<MatchScoreCardProps> = ({
  match,
  isSelected,
  courts,
  onSelect,
  onUpdate,
  onCourtAssign
}) => {
  return (
    <div 
      className={`border p-4 rounded-md hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
      }`}
      onClick={() => onSelect(match)}
    >
      <div className="mb-2">
        <h4 className="font-semibold">
          {match.team1.name} vs {match.team2.name}
        </h4>
        <p className="text-sm text-gray-500">
          {match.courtNumber ? `Court ${match.courtNumber}` : "No court assigned"}
        </p>
      </div>
      {match.scores && match.scores.length > 0 ? (
        <div className="flex space-x-2">
          {match.scores.map((score, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-200 rounded text-sm">
              {score.team1Score} - {score.team2Score}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No scores recorded</p>
      )}
      <div className="mt-2 flex space-x-2">
        <ManualResultEntry
          match={match}
          onComplete={onUpdate}
        />
        <DeferMatch match={match} />
        {/* Removed the court assignment button from this view */}
      </div>
    </div>
  );
};

export default MatchScoreCard;
