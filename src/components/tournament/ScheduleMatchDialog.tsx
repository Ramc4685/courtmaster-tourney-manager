
import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useTournament } from "@/contexts/TournamentContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

interface ScheduleMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

const ScheduleMatchDialog: React.FC<ScheduleMatchDialogProps> = ({
  open,
  onOpenChange,
  tournamentId,
}) => {
  const { currentTournament, scheduleMatch } = useTournament();
  const { toast } = useToast();
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [courtId, setCourtId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (team1Id === team2Id) {
      toast({
        title: "Invalid team selection",
        description: "A team cannot play against itself",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    // Call the schedule match function
    scheduleMatch(team1Id, team2Id, dateTime, courtId || undefined);

    // Show success message
    toast({
      title: "Match scheduled",
      description: "The match has been scheduled successfully",
    });

    // Reset form and close dialog
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTeam1Id("");
    setTeam2Id("");
    setCourtId("");
    setScheduledDate(format(new Date(), "yyyy-MM-dd"));
    setScheduledTime("12:00");
  };

  // Helper to get team name
  const getTeamName = (teamId: string) => {
    const team = currentTournament?.teams.find((t) => t.id === teamId);
    return team ? team.name : "";
  };

  if (!currentTournament) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Match</DialogTitle>
          <DialogDescription>
            Create a new match between two teams
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="team1">Team 1</Label>
            <Select value={team1Id} onValueChange={setTeam1Id} required>
              <SelectTrigger id="team1">
                <SelectValue placeholder="Select team 1" />
              </SelectTrigger>
              <SelectContent>
                {currentTournament.teams.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team2">Team 2</Label>
            <Select value={team2Id} onValueChange={setTeam2Id} required>
              <SelectTrigger id="team2">
                <SelectValue placeholder="Select team 2" />
              </SelectTrigger>
              <SelectContent>
                {currentTournament.teams.map((team: Team) => (
                  <SelectItem 
                    key={team.id} 
                    value={team.id}
                    disabled={team.id === team1Id}
                  >
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="court">Court (Optional)</Label>
            <Select value={courtId} onValueChange={setCourtId}>
              <SelectTrigger id="court">
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent>
                {currentTournament.courts
                  .filter((court) => court.status === "AVAILABLE")
                  .map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  id="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-court-green hover:bg-court-green/90">
              Schedule Match
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMatchDialog;
