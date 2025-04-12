import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Match, Team, Court } from "@/types/tournament";
import { MatchStatus } from "@/types/tournament-enums";
import { useTournament } from "@/contexts/tournament/useTournament";
import { Badge } from "@/components/ui/badge";
import { Edit, PlayCircle } from "lucide-react";
import ManualResultEntry from "@/components/match/ManualResultEntry";
import ManualCourtAssignment from "@/components/match/ManualCourtAssignment";
import DeferMatch from "@/components/match/DeferMatch";

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
  const { updateMatchStatus } = useTournament();
  const [assigningCourtId, setAssigningCourtId] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");

  const handleAssignCourt = (matchId: string) => {
    if (selectedCourtId) {
      onCourtAssign(matchId, selectedCourtId);
      setAssigningCourtId(null);
      setSelectedCourtId("");
    }
  };

  const handleStartMatch = (match: Match) => {
    if (!match.courtNumber) {
      alert("A match must be assigned to a court before it can start.");
      return;
    }
    
    updateMatchStatus(match.id, MatchStatus.IN_PROGRESS);
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.SCHEDULED:
        return <Badge variant="outline">Scheduled</Badge>;
      case MatchStatus.IN_PROGRESS:
        return <Badge variant="secondary">In Progress</Badge>;
      case MatchStatus.COMPLETED:
        return <Badge variant="default">Completed</Badge>;
      case MatchStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreSummary = (match: Match) => {
    if (!match.scores || match.scores.length === 0) {
      return "No scores";
    }
    
    return match.scores.map((score, index) => (
      `Set ${index + 1}: ${score.team1Score}-${score.team2Score}`
    )).join(", ");
  };

  const availableCourts = courts.filter(court => court.status === "AVAILABLE");

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teams</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Division</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No matches scheduled. Schedule a match to get started.
              </TableCell>
            </TableRow>
          ) : (
            matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>{match.team1.name} vs {match.team2.name}</TableCell>
                <TableCell>{getStatusBadge(match.status)}</TableCell>
                <TableCell>
                  {assigningCourtId === match.id ? (
                    <div className="flex items-center space-x-2">
                      <Select
                        value={selectedCourtId}
                        onValueChange={setSelectedCourtId}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select Court" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourts.map((court) => (
                            <SelectItem key={court.id} value={court.id}>
                              {court.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        onClick={() => handleAssignCourt(match.id)}
                        disabled={!selectedCourtId}
                      >
                        Assign
                      </Button>
                    </div>
                  ) : (
                    match.courtNumber ? `Court ${match.courtNumber}` : "Not assigned"
                  )}
                </TableCell>
                <TableCell>
                  {match.scheduledTime ? format(new Date(match.scheduledTime), "PPp") : "Not scheduled"}
                </TableCell>
                <TableCell>
                  {match.status === MatchStatus.COMPLETED ? 
                    `${match.winner?.name || "Unknown"} won (${getScoreSummary(match)})` : 
                    getScoreSummary(match)
                  }
                </TableCell>
                <TableCell>{match.division}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Manual Result Entry Button */}
                    <ManualResultEntry
                      match={match}
                      onComplete={onMatchUpdate}
                    />

                    {/* Defer Match Button (only for IN_PROGRESS matches) */}
                    {match.status === MatchStatus.IN_PROGRESS && (
                      <DeferMatch match={match} />
                    )}

                    {/* Start Match Button (only for SCHEDULED matches) */}
                    {match.status === MatchStatus.SCHEDULED && match.courtNumber && (
                      <Button 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStartMatch(match)}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}

                    {/* Court Assignment Button */}
                    {match.status !== MatchStatus.COMPLETED && !match.courtNumber && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setAssigningCourtId(match.id)}
                        disabled={availableCourts.length === 0}
                      >
                        Assign Court
                      </Button>
                    )}

                    {/* Manual Court Assignment for matches with courts */}
                    {match.status !== MatchStatus.COMPLETED && match.courtNumber && (
                      <ManualCourtAssignment 
                        match={match}
                        courts={courts}
                        onCourtAssign={onCourtAssign}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EnhancedMatchTable;
