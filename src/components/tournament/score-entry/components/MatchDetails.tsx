
import React from "react";
import { Match, Court } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { PlayCircle, ClipboardEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ManualResultEntry from "@/components/match/ManualResultEntry";
import DeferMatch from "@/components/match/DeferMatch";
import ManualCourtAssignment from "@/components/match/ManualCourtAssignment";

interface MatchDetailsProps {
  match: Match;
  courts: Court[];
  onStartMatch: (matchId: string) => void;
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({
  match,
  courts,
  onStartMatch,
  onMatchUpdate,
  onCourtAssign
}) => {
  const navigate = useNavigate();

  const handleContinueScoring = () => {
    // Navigate to the scoring page with the tournament ID and match ID
    console.log(`Navigating to scoring page for match: ${match.id} in tournament: ${match.tournamentId}`);
    navigate(`/scoring/${match.tournamentId}/${match.id}`);
  };

  return (
    <div className="border p-4 rounded-md bg-blue-50">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">
          {match.team1.name} vs {match.team2.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
          <span className="px-2 py-1 bg-gray-200 rounded">
            Status: {match.status}
          </span>
          {match.courtNumber && (
            <span className="px-2 py-1 bg-gray-200 rounded">
              Court: {match.courtNumber}
            </span>
          )}
          {match.scheduledTime && (
            <span className="px-2 py-1 bg-gray-200 rounded">
              Time: {new Date(match.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          )}
        </div>
      </div>
      
      {/* Updated button grid with equal-width columns */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {match.status === "SCHEDULED" && (
          <Button 
            onClick={() => onStartMatch(match.id)}
            className="bg-blue-600 hover:bg-blue-700 w-full"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Match
          </Button>
        )}
        
        {match.status === "IN_PROGRESS" && (
          <Button 
            onClick={handleContinueScoring}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            <ClipboardEdit className="h-4 w-4 mr-2" />
            Continue Scoring
          </Button>
        )}
        
        <ManualResultEntry
          match={match}
          onComplete={onMatchUpdate}
        />
        
        {match.status === "IN_PROGRESS" && (
          <DeferMatch match={match} />
        )}
        
        <ManualCourtAssignment 
          match={match}
          courts={courts}
          onCourtAssign={onCourtAssign}
        />
      </div>
    </div>
  );
};

export default MatchDetails;
