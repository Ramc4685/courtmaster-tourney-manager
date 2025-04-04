import React, { useState } from "react";
import { Match, MatchStatus, Court, CourtStatus } from "@/types/tournament";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardEdit } from "lucide-react";
import { useTournament } from "@/contexts/tournament/useTournament";

// Import refactored components
import InProgressMatches from "./components/InProgressMatches";
import MatchSelector from "./components/MatchSelector";
import MatchDetails from "./components/MatchDetails";

interface ScoreEntrySectionProps {
  matches: Match[];
  onMatchUpdate: (match: Match) => void;
}

const ScoreEntrySection: React.FC<ScoreEntrySectionProps> = ({ matches, onMatchUpdate }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const { updateMatchStatus, assignCourt } = useTournament();
  
  // Filter matches that are in progress or scheduled (not completed)
  const availableMatches = matches.filter(
    match => match.status !== "COMPLETED" && 
             match.status !== "CANCELLED" &&
             match.team1 && 
             match.team2
  );

  // Get matches in progress for quick access
  const inProgressMatches = matches.filter(
    match => match.status === "IN_PROGRESS" &&
             match.team1 &&
             match.team2
  );

  const selectedMatch = matches.find(match => match.id === selectedMatchId);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleMatchUpdate = (updatedMatch: Match) => {
    onMatchUpdate(updatedMatch);
    // Refresh the selected match if it's the one being updated
    if (selectedMatchId === updatedMatch.id) {
      const refreshedMatch = matches.find(m => m.id === updatedMatch.id);
      if (refreshedMatch) {
        // Force a re-render
        setSelectedMatchId("");
        setTimeout(() => setSelectedMatchId(updatedMatch.id), 0);
      }
    }
  };
  
  const handleStartMatch = (matchId: string) => {
    updateMatchStatus(matchId, "IN_PROGRESS");
    setSelectedMatchId(matchId);
  };

  const handleCourtAssign = (matchId: string, courtId: string) => {
    assignCourt(matchId, courtId);
    // Refresh the view after court assignment
    const updatedMatch = matches.find(match => match.id === matchId);
    if (updatedMatch) {
      handleMatchUpdate(updatedMatch);
    }
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

  // Get all courts from all matches
  const allCourts = matches
    .filter(m => m.courtNumber)
    .map(m => ({
      id: `court-${m.courtNumber}`,
      number: m.courtNumber!,
      name: `Court ${m.courtNumber}`,
      status: m.status === "IN_PROGRESS" ? "IN_USE" as CourtStatus : "AVAILABLE" as CourtStatus,
      currentMatch: m.status === "IN_PROGRESS" ? m : undefined
    }));

  // Remove duplicates
  const uniqueCourts = Array.from(
    new Map(allCourts.map(court => [court.number, court])).values()
  );

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
          {/* In Progress Matches Section - Using the refactored component */}
          {inProgressMatches.length > 0 && (
            <InProgressMatches
              matches={inProgressMatches}
              selectedMatchId={selectedMatchId}
              courts={uniqueCourts}
              onMatchSelect={handleMatchSelect}
              onMatchUpdate={handleMatchUpdate}
              onCourtAssign={handleCourtAssign}
            />
          )}
          
          {/* Match Selection - Using the refactored component */}
          <MatchSelector
            matches={availableMatches}
            selectedMatchId={selectedMatchId}
            onMatchSelect={handleMatchSelect}
          />

          {/* Selected Match Details - Using the refactored component */}
          {selectedMatch ? (
            <MatchDetails
              match={selectedMatch}
              courts={uniqueCourts}
              onStartMatch={handleStartMatch}
              onMatchUpdate={handleMatchUpdate}
              onCourtAssign={handleCourtAssign}
            />
          ) : (
            <p className="text-gray-500 italic">Select a match to view details and enter scores</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreEntrySection;
