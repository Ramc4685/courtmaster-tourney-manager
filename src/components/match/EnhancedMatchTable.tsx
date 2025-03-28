
import React from "react";
import MatchTable from "@/components/match/MatchTable";
import ManualResultEntry from "@/components/match/ManualResultEntry";
import { Match, Team, Court } from "@/types/tournament";
import { useTournament } from "@/contexts/TournamentContext";

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
  const { completeMatch } = useTournament();

  const handleCompleteMatch = (updatedMatch: Match) => {
    onMatchUpdate(updatedMatch);
    
    // If the match was not already completed, mark it as complete through the tournament context
    if (updatedMatch.status === "COMPLETED" && updatedMatch.id) {
      completeMatch(updatedMatch.id);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse">
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
            {matches.map((match) => (
              <tr key={match.id} className="border-b border-gray-200">
                <td className="p-2">{match.team1.name} vs {match.team2.name}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    match.status === "COMPLETED" 
                      ? "bg-green-100 text-green-800" 
                      : match.status === "IN_PROGRESS" 
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {match.status}
                  </span>
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
                    <ManualResultEntry
                      match={match}
                      onComplete={handleCompleteMatch}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
