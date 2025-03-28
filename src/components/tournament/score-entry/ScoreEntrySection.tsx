
import React, { useState } from "react";
import { Match, MatchStatus } from "@/types/tournament";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardEdit, PlayCircle } from "lucide-react";
import ManualResultEntry from "@/components/match/ManualResultEntry";
import { useTournament } from "@/contexts/TournamentContext";

interface ScoreEntrySectionProps {
  matches: Match[];
  onMatchUpdate: (match: Match) => void;
}

const ScoreEntrySection: React.FC<ScoreEntrySectionProps> = ({ matches, onMatchUpdate }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const { updateMatchStatus } = useTournament();
  
  // Filter matches that are in progress or scheduled (not completed)
  const availableMatches = matches.filter(
    match => match.status !== "COMPLETED" && match.status !== "CANCELLED"
  );

  // Get matches in progress for quick access
  const inProgressMatches = matches.filter(
    match => match.status === "IN_PROGRESS"
  );

  const selectedMatch = matches.find(match => match.id === selectedMatchId);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleMatchUpdate = (updatedMatch: Match) => {
    onMatchUpdate(updatedMatch);
  };
  
  const handleStartMatch = (matchId: string) => {
    updateMatchStatus(matchId, "IN_PROGRESS");
    setSelectedMatchId(matchId);
  };

  if (availableMatches.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5" />
            Match Progress & Score Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No active matches available for score entry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardEdit className="h-5 w-5" />
          Match Progress & Score Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* In Progress Matches Section */}
          {inProgressMatches.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-3">Matches In Progress</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {inProgressMatches.map((match) => (
                  <div 
                    key={match.id} 
                    className={`border p-4 rounded-md hover:shadow-md transition-shadow cursor-pointer ${
                      selectedMatchId === match.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                    }`}
                    onClick={() => handleMatchSelect(match.id)}
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
                    <div className="mt-2">
                      <ManualResultEntry
                        match={match}
                        onComplete={handleMatchUpdate}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Match Selection Dropdown */}
          <div>
            <label htmlFor="match-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select a Match to Score
            </label>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedMatchId} onValueChange={handleMatchSelect} className="flex-grow">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a match" />
                </SelectTrigger>
                <SelectContent>
                  {availableMatches.map((match) => (
                    <SelectItem key={match.id} value={match.id}>
                      {match.team1.name} vs {match.team2.name} 
                      {match.status === "IN_PROGRESS" ? " (In Progress)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Match Details */}
          {selectedMatch ? (
            <div className="border p-4 rounded-md bg-blue-50">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">
                  {selectedMatch.team1.name} vs {selectedMatch.team2.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                  <span className="px-2 py-1 bg-gray-200 rounded">
                    Status: {selectedMatch.status}
                  </span>
                  {selectedMatch.courtNumber && (
                    <span className="px-2 py-1 bg-gray-200 rounded">
                      Court: {selectedMatch.courtNumber}
                    </span>
                  )}
                  {selectedMatch.scheduledTime && (
                    <span className="px-2 py-1 bg-gray-200 rounded">
                      Time: {new Date(selectedMatch.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedMatch.status === "SCHEDULED" && (
                  <Button 
                    onClick={() => handleStartMatch(selectedMatch.id)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Start Match
                  </Button>
                )}
                <ManualResultEntry
                  match={selectedMatch}
                  onComplete={handleMatchUpdate}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Select a match to view details and enter scores</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreEntrySection;
