
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
import { Match, Team, Court, MatchStatus } from "@/types/tournament";
import { Badge } from "@/components/ui/badge";
import { Play, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MatchTableProps {
  matches: Match[];
  teams: Team[];
  courts: Court[];
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
  onStartMatch?: (matchId: string, force?: boolean) => void;
}

const MatchTable: React.FC<MatchTableProps> = ({
  matches,
  teams,
  courts,
  onMatchUpdate,
  onCourtAssign,
  onStartMatch
}) => {
  const [assigningCourtId, setAssigningCourtId] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");

  const handleAssignCourt = (matchId: string) => {
    if (selectedCourtId) {
      onCourtAssign(matchId, selectedCourtId);
      setAssigningCourtId(null);
      setSelectedCourtId("");
    }
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline">Scheduled</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>;
      case "CANCELLED":
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
  const noAvailableCourts = availableCourts.length === 0;

  const handleStartMatch = (matchId: string) => {
    if (onStartMatch) {
      onStartMatch(matchId, noAvailableCourts);
    }
  };

  return (
    <TooltipProvider>
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
                    {match.status === "COMPLETED" ? 
                      `${match.winner?.name || "Unknown"} won (${getScoreSummary(match)})` : 
                      getScoreSummary(match) || "Not started"
                    }
                  </TableCell>
                  <TableCell>{match.division}</TableCell>
                  <TableCell className="text-right">
                    {match.status === "SCHEDULED" && (
                      <div className="flex justify-end gap-2">
                        {!match.courtNumber && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setAssigningCourtId(match.id)}
                            disabled={availableCourts.length === 0}
                          >
                            Assign Court
                          </Button>
                        )}
                        
                        {/* Start Game Button */}
                        {onStartMatch && (
                          noAvailableCourts && !match.courtNumber ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleStartMatch(match.id)}
                                  className="border-amber-400 hover:bg-amber-50 text-amber-600 flex items-center"
                                >
                                  <Play className="mr-1 h-3 w-3" />
                                  <span>Start Game</span>
                                  <AlertTriangle className="ml-1 h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>No courts available. Starting this match without a court is not recommended.</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStartMatch(match.id)}
                              className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 flex items-center"
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Start Game
                            </Button>
                          )
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default MatchTable;
