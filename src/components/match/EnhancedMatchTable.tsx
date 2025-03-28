
import React from "react";
import MatchTable from "@/components/match/MatchTable";
import ManualResultEntry from "@/components/match/ManualResultEntry";
import { Match, Team, Court } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";
import { Badge } from "@/components/ui/badge";
import { Edit, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedMatchTableProps {
  matches: Match[];
  teams: Team[];
  courts: Court[];
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
}

const EnhancedMatchTable: React.FC<EnhancedMatchTableProps> = ({
  matches,
  teams,
  courts,
  onMatchUpdate,
  onCourtAssign,
}) => {
  const { completeMatch, updateMatchStatus } = useTournament();

  const handleCompleteMatch = (updatedMatch: Match) => {
    onMatchUpdate(updatedMatch);
    
    // If the match was not already completed, mark it as complete through the tournament context
    if (updatedMatch.status === "COMPLETED" && updatedMatch.id) {
      completeMatch(updatedMatch.id);
    }
  };

  const handleStartMatch = (matchId: string) => {
    updateMatchStatus(matchId, "IN_PROGRESS");
  };

  // Group matches by status for better organization
  const scheduledMatches = matches.filter(match => match.status === "SCHEDULED");
  const inProgressMatches = matches.filter(match => match.status === "IN_PROGRESS");
  const completedMatches = matches.filter(match => match.status === "COMPLETED");

  const renderMatchRow = (match: Match) => (
    <tr key={match.id} className="border-b border-gray-200">
      <td className="p-2">{match.team1.name} vs {match.team2.name}</td>
      <td className="p-2">
        <Badge className={`px-2 py-1 rounded text-xs ${
          match.status === "COMPLETED" 
            ? "bg-green-100 text-green-800" 
            : match.status === "IN_PROGRESS" 
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
        }`}>
          {match.status}
        </Badge>
      </td>
      <td className="p-2">{match.courtNumber ? `Court ${match.courtNumber}` : "Not assigned"}</td>
      <td className="p-2">
        {match.scheduledTime 
          ? new Date(match.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          : "Not scheduled"}
      </td>
      <td className="p-2">
        {match.scores && match.scores.length > 0
          ? match.scores.map((score, idx) => (
              <span key={idx} className="mr-2">
                {score.team1Score}-{score.team2Score}
              </span>
            ))
          : "No scores"}
      </td>
      <td className="p-2">
        <div className="flex space-x-2">
          {match.status === "SCHEDULED" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              onClick={() => handleStartMatch(match.id)}
            >
              <PlayCircle className="h-4 w-4 mr-1" /> Start Match
            </Button>
          )}
          <ManualResultEntry
            match={match}
            onComplete={handleCompleteMatch}
          />
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="overflow-x-auto mb-8">
        {inProgressMatches.length > 0 && (
          <>
            <h3 className="text-lg font-medium mb-2">Matches In Progress</h3>
            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="bg-blue-50 text-left">
                  <th className="p-2">Teams</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Court</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inProgressMatches.map(renderMatchRow)}
              </tbody>
            </table>
          </>
        )}

        {scheduledMatches.length > 0 && (
          <>
            <h3 className="text-lg font-medium mb-2">Scheduled Matches</h3>
            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Teams</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Court</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduledMatches.map(renderMatchRow)}
              </tbody>
            </table>
          </>
        )}

        {completedMatches.length > 0 && (
          <>
            <h3 className="text-lg font-medium mb-2">Completed Matches</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-50 text-left">
                  <th className="p-2">Teams</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Court</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedMatches.map(renderMatchRow)}
              </tbody>
            </table>
          </>
        )}
      </div>
      
      {/* Original MatchTable as a fallback */}
      <div className="hidden">
        <MatchTable
          matches={matches}
          teams={teams}
          courts={courts}
          onMatchUpdate={onMatchUpdate}
          onCourtAssign={onCourtAssign}
        />
      </div>
    </div>
  );
};

export default EnhancedMatchTable;
