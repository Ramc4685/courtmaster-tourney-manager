
import React, { useState } from "react";
import { Match, MatchStatus } from "@/types/tournament";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardEdit } from "lucide-react";
import ManualResultEntry from "@/components/match/ManualResultEntry";

interface ScoreEntrySectionProps {
  matches: Match[];
  onMatchUpdate: (match: Match) => void;
}

const ScoreEntrySection: React.FC<ScoreEntrySectionProps> = ({ matches, onMatchUpdate }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  
  // Filter matches that are in progress or scheduled (not completed)
  const availableMatches = matches.filter(
    match => match.status !== "COMPLETED" && match.status !== "CANCELLED"
  );

  const selectedMatch = matches.find(match => match.id === selectedMatchId);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleMatchUpdate = (updatedMatch: Match) => {
    onMatchUpdate(updatedMatch);
  };

  if (availableMatches.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manual Score Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No active matches available for score entry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardEdit className="h-5 w-5" />
          Manual Score Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="match-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Match
            </label>
            <Select value={selectedMatchId} onValueChange={handleMatchSelect}>
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

          {selectedMatch ? (
            <div className="border p-4 rounded-md bg-gray-50">
              <div className="mb-4">
                <h3 className="font-semibold">
                  {selectedMatch.team1.name} vs {selectedMatch.team2.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Status: {selectedMatch.status}
                  {selectedMatch.courtNumber ? ` | Court: ${selectedMatch.courtNumber}` : ""}
                </p>
              </div>
              
              <ManualResultEntry
                match={selectedMatch}
                onComplete={handleMatchUpdate}
              />
            </div>
          ) : (
            <p className="text-gray-500 italic">Select a match to enter scores</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreEntrySection;
