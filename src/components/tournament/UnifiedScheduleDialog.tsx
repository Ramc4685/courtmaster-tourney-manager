
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTournament } from "@/contexts/TournamentContext";
import { Tournament, Team } from "@/types/tournament";
import { SchedulingOptions, SchedulingResult } from "@/contexts/tournament/types";
import { toast } from "@/components/ui/use-toast";

interface UnifiedScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
}

const UnifiedScheduleDialog: React.FC<UnifiedScheduleDialogProps> = ({
  open,
  onOpenChange,
  tournament
}) => {
  const { scheduleMatches } = useTournament();
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("09:00");
  const [matchDuration, setMatchDuration] = useState<number>(30);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [assignCourts, setAssignCourts] = useState<boolean>(true);
  const [autoStartMatches, setAutoStartMatches] = useState<boolean>(false);
  const [respectFormat, setRespectFormat] = useState<boolean>(true);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<{team1: Team, team2: Team}[]>([]);
  const [isCreatingPairs, setIsCreatingPairs] = useState<boolean>(false);
  const [teamPairs, setTeamPairs] = useState<{team1: Team, team2: Team}[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("teams");

  // Update available teams when tournament changes
  useEffect(() => {
    if (tournament) {
      setAvailableTeams(tournament.teams || []);
    }
  }, [tournament]);

  // Toggle team selection
  const toggleTeamSelection = (teamId: string) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  // Create pairs from selected teams
  const createPairs = () => {
    if (selectedTeams.size < 2) {
      toast({
        title: "Not enough teams selected",
        description: "Please select at least 2 teams to create pairs",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPairs(true);
    
    // Filter to only selected teams
    const teams = availableTeams.filter(team => selectedTeams.has(team.id));
    
    // Create pairs based on algorithm (round-robin style)
    const pairs: {team1: Team, team2: Team}[] = [];
    
    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push({
          team1: teams[i],
          team2: teams[j]
        });
      }
    }
    
    setTeamPairs(pairs);
    setSelectedPairs(pairs);
    setCurrentTab("pairs");
  };

  // Reset to team selection
  const backToTeamSelection = () => {
    setIsCreatingPairs(false);
    setCurrentTab("teams");
  };

  // Toggle pair selection
  const togglePairSelection = (index: number) => {
    const newSelectedPairs = [...selectedPairs];
    const pair = teamPairs[index];
    
    const pairIndex = newSelectedPairs.findIndex(
      p => p.team1.id === pair.team1.id && p.team2.id === pair.team2.id
    );
    
    if (pairIndex !== -1) {
      newSelectedPairs.splice(pairIndex, 1);
    } else {
      newSelectedPairs.push(pair);
    }
    
    setSelectedPairs(newSelectedPairs);
  };

  // Check if a pair is selected
  const isPairSelected = (index: number) => {
    const pair = teamPairs[index];
    return selectedPairs.some(
      p => p.team1.id === pair.team1.id && p.team2.id === pair.team2.id
    );
  };

  // Schedule the matches
  const handleSchedule = async () => {
    if (selectedPairs.length === 0) {
      toast({
        title: "No pairs selected",
        description: "Please select at least one pair of teams to schedule",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create scheduling options
      const options: SchedulingOptions = {
        startDate: date,
        startTime: time,
        matchDuration,
        breakDuration,
        assignCourts,
        autoStartMatches,
        respectFormat
      };

      // Schedule matches
      const result = await scheduleMatches(selectedPairs, options);
      
      toast({
        title: "Matches scheduled",
        description: `Successfully scheduled ${result.matchesScheduled} matches, assigned ${result.courtsAssigned} courts, and started ${result.matchesStarted} matches.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling matches:", error);
      toast({
        title: "Error",
        description: "Failed to schedule matches. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Matches</DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="teams" disabled={isCreatingPairs}>Teams</TabsTrigger>
            <TabsTrigger value="pairs" disabled={!isCreatingPairs}>Pairs</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Select Teams</Label>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTeams(new Set(availableTeams.map(t => t.id)))}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTeams(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="border rounded-md h-64 overflow-y-auto p-2">
                {availableTeams.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    No teams available in this tournament
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableTeams.map((team) => (
                      <div
                        key={team.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-secondary/20",
                          selectedTeams.has(team.id) && "bg-secondary/30"
                        )}
                        onClick={() => toggleTeamSelection(team.id)}
                      >
                        <Checkbox 
                          checked={selectedTeams.has(team.id)} 
                          onCheckedChange={() => toggleTeamSelection(team.id)}
                        />
                        <span>{team.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={createPairs}
              disabled={selectedTeams.size < 2}
              className="w-full"
            >
              Create Team Pairs
            </Button>
          </TabsContent>

          <TabsContent value="pairs" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Team Pairs</Label>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedPairs([...teamPairs])}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedPairs([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="border rounded-md h-48 overflow-y-auto p-2">
                {teamPairs.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    No team pairs created
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teamPairs.map((pair, index) => (
                      <div
                        key={`${pair.team1.id}-${pair.team2.id}`}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-secondary/20",
                          isPairSelected(index) && "bg-secondary/30"
                        )}
                        onClick={() => togglePairSelection(index)}
                      >
                        <Checkbox 
                          checked={isPairSelected(index)} 
                          onCheckedChange={() => togglePairSelection(index)}
                        />
                        <span>{pair.team1.name} vs {pair.team2.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={backToTeamSelection}
                className="mt-2"
              >
                Back to Team Selection
              </Button>
            </div>

            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="scheduleDate">Schedule Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="startTime">Start Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="matchDuration">Match Duration (minutes)</Label>
                  <Input
                    id="matchDuration"
                    type="number"
                    min="5"
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="breakDuration">Break Between Matches (minutes)</Label>
                  <Input
                    id="breakDuration"
                    type="number"
                    min="0"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assignCourts"
                    checked={assignCourts}
                    onCheckedChange={(checked) => setAssignCourts(!!checked)}
                  />
                  <Label htmlFor="assignCourts">Auto-assign courts when available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoStartMatches"
                    checked={autoStartMatches}
                    onCheckedChange={(checked) => setAutoStartMatches(!!checked)}
                  />
                  <Label htmlFor="autoStartMatches">Auto-start matches when courts assigned</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="respectFormat"
                    checked={respectFormat}
                    onCheckedChange={(checked) => setRespectFormat(!!checked)}
                  />
                  <Label htmlFor="respectFormat">Respect tournament format for scheduling</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={selectedPairs.length === 0 || !isCreatingPairs}>
            Schedule Matches
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedScheduleDialog;
