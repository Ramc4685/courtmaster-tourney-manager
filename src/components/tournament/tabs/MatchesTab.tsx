
import React, { useState } from "react";
import { Plus, Clock, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchTable from "@/components/match/MatchTable";
import { Match, Team, Court } from "@/types/tournament";

interface MatchesTabProps {
  matches: Match[];
  teams: Team[];
  courts: Court[];
  onMatchUpdate: (match: Match) => void;
  onCourtAssign: (matchId: string, courtId: string) => void;
  onStartMatch?: (matchId: string, force?: boolean) => void;
  onAddMatchClick: () => void;
  onAutoScheduleClick: () => void;
}

const MatchesTab: React.FC<MatchesTabProps> = ({
  matches,
  teams,
  courts,
  onMatchUpdate,
  onCourtAssign,
  onStartMatch,
  onAddMatchClick,
  onAutoScheduleClick
}) => {
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");

  const availableCourts = courts.filter(court => court.status === "AVAILABLE");
  const scheduledMatches = matches.filter(match => match.status === "SCHEDULED" && !match.courtNumber);

  const handleQuickAssign = (match: Match) => {
    setSelectedMatch(match);
    setQuickAssignOpen(true);
  };

  const handleAssignCourt = () => {
    if (selectedMatch && selectedCourtId) {
      onCourtAssign(selectedMatch.id, selectedCourtId);
      setQuickAssignOpen(false);
      setSelectedMatch(null);
      setSelectedCourtId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Matches</h2>
        <div className="space-x-2">
          <Button onClick={onAddMatchClick} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Schedule One Match
          </Button>
          <Button onClick={onAutoScheduleClick} className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Auto Schedule & Start
          </Button>
        </div>
      </div>

      {scheduledMatches.length > 0 && availableCourts.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium mb-2">Quick Court Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledMatches.slice(0, 3).map(match => (
              <div key={match.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                <div className="truncate">
                  <span className="text-sm font-medium">{match.team1.name} vs {match.team2.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickAssign(match)}
                  >
                    Assign Court
                  </Button>
                  {onStartMatch && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => onStartMatch(match.id)}
                      className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <MatchTable
        matches={matches}
        teams={teams}
        courts={courts}
        onMatchUpdate={onMatchUpdate}
        onCourtAssign={onCourtAssign}
        onStartMatch={onStartMatch}
      />

      <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Court</DialogTitle>
            <DialogDescription>
              Assign a court to the match between {selectedMatch?.team1.name} and {selectedMatch?.team2.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Court</label>
              <Select
                value={selectedCourtId}
                onValueChange={setSelectedCourtId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an available court" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name} (Court {court.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full mt-2" 
              disabled={!selectedCourtId}
              onClick={handleAssignCourt}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Assign Court
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchesTab;
