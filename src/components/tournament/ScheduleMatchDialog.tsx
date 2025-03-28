
import React, { useState, useEffect } from "react";
import { Calendar, ArrowRight, Wand2, Clock } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { useTournament } from "@/contexts/TournamentContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team, Division, TournamentStage } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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
  const { currentTournament, scheduleMatch, autoAssignCourts } = useTournament();
  const { toast } = useToast();
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [courtId, setCourtId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");
  const [selectedDivision, setSelectedDivision] = useState<Division>("INITIAL");
  const [suggestedPairs, setSuggestedPairs] = useState<{ team1: Team; team2: Team }[]>([]);
  const [autoScheduleDate, setAutoScheduleDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [autoScheduleTime, setAutoScheduleTime] = useState<string>("12:00");
  const [matchDuration, setMatchDuration] = useState<number>(60); // Default match duration in minutes

  useEffect(() => {
    // Set the appropriate division based on the tournament's current stage
    if (currentTournament) {
      switch (currentTournament.currentStage) {
        case "INITIAL_ROUND":
          setSelectedDivision("INITIAL");
          break;
        case "DIVISION_PLACEMENT":
          setSelectedDivision("QUALIFIER_DIV1");
          break;
        case "PLAYOFF_KNOCKOUT":
          setSelectedDivision("DIVISION_1");
          break;
        default:
          setSelectedDivision("INITIAL");
      }
    }
  }, [currentTournament]);

  // Generate suggested team pairs based on current tournament stage and division
  const generateSuggestedPairs = () => {
    if (!currentTournament) return;

    const scheduledMatchTeamIds = currentTournament.matches
      .map(match => [match.team1.id, match.team2.id])
      .flat();

    // Get teams that aren't already in matches for the selected division and stage
    const availableTeams = currentTournament.teams.filter(team => 
      !scheduledMatchTeamIds.includes(team.id) ||
      !currentTournament.matches.some(
        m => (m.team1.id === team.id || m.team2.id === team.id) && 
             m.division === selectedDivision &&
             m.stage === currentTournament.currentStage
      )
    );

    // Sort teams by initial ranking if available
    const sortedTeams = [...availableTeams].sort((a, b) => 
      (a.initialRanking || 999) - (b.initialRanking || 999)
    );

    // Generate pairs based on sorted rankings (highest vs lowest)
    const pairs: { team1: Team; team2: Team }[] = [];
    const halfLength = Math.floor(sortedTeams.length / 2);
    
    for (let i = 0; i < halfLength; i++) {
      pairs.push({
        team1: sortedTeams[i], // Top ranked team
        team2: sortedTeams[sortedTeams.length - 1 - i] // Bottom ranked team
      });
    }

    setSuggestedPairs(pairs);
  };

  useEffect(() => {
    if (open && currentTournament) {
      generateSuggestedPairs();
    }
  }, [open, selectedDivision, currentTournament]);

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

  const scheduleAutoMatch = (team1: Team, team2: Team) => {
    // Use the current date and time plus 1 hour for scheduling
    const scheduledDateTime = new Date();
    scheduledDateTime.setHours(scheduledDateTime.getHours() + 1);
    
    // Schedule the match
    scheduleMatch(team1.id, team2.id, scheduledDateTime);
    
    toast({
      title: "Match auto-scheduled",
      description: `${team1.name} vs ${team2.name} has been scheduled`,
    });
    
    // Refresh suggested pairs
    generateSuggestedPairs();
  };

  const scheduleAllMatches = () => {
    if (!currentTournament || suggestedPairs.length === 0) {
      toast({
        title: "No matches to schedule",
        description: "There are no available matches to schedule.",
        variant: "destructive",
      });
      return;
    }

    // Get all available courts
    const availableCourts = currentTournament.courts.filter(c => c.status === "AVAILABLE");
    if (availableCourts.length === 0) {
      toast({
        title: "No courts available",
        description: "There are no available courts to schedule matches.",
        variant: "destructive",
      });
      return;
    }

    // Parse the starting date and time
    const baseDateTime = new Date(`${autoScheduleDate}T${autoScheduleTime}`);
    
    // Schedule as many matches as possible
    let scheduledCount = 0;
    const maxInitialMatches = Math.min(availableCourts.length, suggestedPairs.length);
    
    // First, schedule matches on all available courts
    for (let i = 0; i < maxInitialMatches; i++) {
      const { team1, team2 } = suggestedPairs[i];
      const courtId = availableCourts[i].id;
      
      // Calculate match time (staggered by 5 minutes to prevent exact same time)
      const matchTime = new Date(baseDateTime);
      matchTime.setMinutes(matchTime.getMinutes() + (i * 5));
      
      scheduleMatch(team1.id, team2.id, matchTime, courtId);
      scheduledCount++;
    }
    
    // Then, create additional scheduled matches that will be assigned to courts as they become available
    for (let i = maxInitialMatches; i < suggestedPairs.length; i++) {
      const { team1, team2 } = suggestedPairs[i];
      
      // Calculate match time - add match duration minutes for each group of matches
      // This is just an estimate for when courts might be available
      const groupIndex = Math.floor(i / availableCourts.length);
      const matchTime = new Date(baseDateTime);
      matchTime.setMinutes(matchTime.getMinutes() + (groupIndex * matchDuration));
      
      scheduleMatch(team1.id, team2.id, matchTime);
      scheduledCount++;
    }
    
    // Auto-assign courts for upcoming matches
    autoAssignCourts();
    
    toast({
      title: "Bulk scheduling complete",
      description: `Successfully scheduled ${scheduledCount} matches.`,
    });
    
    // Refresh suggested pairs
    generateSuggestedPairs();
    
    // Close the dialog
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
            Create or auto-schedule matches between teams
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="auto" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="manual">Manual Schedule</TabsTrigger>
            <TabsTrigger value="auto">Auto Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select 
                  value={selectedDivision} 
                  onValueChange={(value: string) => setSelectedDivision(value as Division)}
                >
                  <SelectTrigger id="division">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INITIAL">Initial Round</SelectItem>
                    <SelectItem value="QUALIFIER_DIV1">Division 1 Qualifier</SelectItem>
                    <SelectItem value="QUALIFIER_DIV2">Division 2 Qualifier</SelectItem>
                    <SelectItem value="GROUP_DIV3">Division 3 Group</SelectItem>
                    <SelectItem value="DIVISION_1">Division 1</SelectItem>
                    <SelectItem value="DIVISION_2">Division 2</SelectItem>
                    <SelectItem value="DIVISION_3">Division 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
          </TabsContent>

          <TabsContent value="auto">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="auto-division">Division for Auto-Scheduling</Label>
                <Select 
                  value={selectedDivision} 
                  onValueChange={(value: string) => {
                    setSelectedDivision(value as Division);
                    generateSuggestedPairs();
                  }}
                >
                  <SelectTrigger id="auto-division">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INITIAL">Initial Round</SelectItem>
                    <SelectItem value="QUALIFIER_DIV1">Division 1 Qualifier</SelectItem>
                    <SelectItem value="QUALIFIER_DIV2">Division 2 Qualifier</SelectItem>
                    <SelectItem value="GROUP_DIV3">Division 3 Group</SelectItem>
                    <SelectItem value="DIVISION_1">Division 1</SelectItem>
                    <SelectItem value="DIVISION_2">Division 2</SelectItem>
                    <SelectItem value="DIVISION_3">Division 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auto-date">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      id="auto-date"
                      value={autoScheduleDate}
                      onChange={(e) => setAutoScheduleDate(e.target.value)}
                      className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-time">Start Time</Label>
                  <input
                    type="time"
                    id="auto-time"
                    value={autoScheduleTime}
                    onChange={(e) => setAutoScheduleTime(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="match-duration">Match Duration (minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="match-duration"
                    type="number"
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value) || 60)}
                    className="pl-8"
                    min={30}
                    max={180}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  This helps schedule future matches when courts become available
                </p>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Suggested Matches ({suggestedPairs.length}):</h4>
                {suggestedPairs.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {suggestedPairs.slice(0, 5).map((pair, index) => (
                      <div key={index} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex-1">
                          <p className="font-medium">{pair.team1.name}</p>
                          <p className="text-xs text-gray-500">Rank: {pair.team1.initialRanking || 'N/A'}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium">{pair.team2.name}</p>
                          <p className="text-xs text-gray-500">Rank: {pair.team2.initialRanking || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                    {suggestedPairs.length > 5 && (
                      <p className="text-center text-sm text-gray-500 py-2">
                        And {suggestedPairs.length - 5} more matches...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-gray-500">No suggested matches available for this division</p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={generateSuggestedPairs}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Refresh Suggestions
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Available Courts: <span className="font-medium">{currentTournament.courts.filter(c => c.status === "AVAILABLE").length}</span>
                  </p>
                  <p className="text-sm">
                    Matches to Schedule: <span className="font-medium">{suggestedPairs.length}</span>
                  </p>
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
                <Button
                  className="bg-court-green hover:bg-court-green/90"
                  onClick={scheduleAllMatches}
                  disabled={suggestedPairs.length === 0}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto Schedule All Matches
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMatchDialog;
