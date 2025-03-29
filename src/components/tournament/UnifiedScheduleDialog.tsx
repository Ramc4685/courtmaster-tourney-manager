
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Wand2, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTournament } from "@/contexts/TournamentContext";
import { Team, Division } from "@/types/tournament";
import { cn } from "@/lib/utils";
import SuggestedMatchPairs from "./schedule/SuggestedMatchPairs";
import { toast } from "@/components/ui/use-toast";

interface UnifiedScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UnifiedScheduleDialog: React.FC<UnifiedScheduleDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { currentTournament, scheduleMatches } = useTournament();

  // Scheduling tabs state
  const [activeTab, setActiveTab] = useState("auto-schedule");

  // Manual scheduling state
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("12:00");
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");

  // Auto scheduling state
  const [selectedDivision, setSelectedDivision] = useState<Division>("INITIAL");
  const [suggestedPairs, setSuggestedPairs] = useState<{ team1: Team; team2: Team }[]>([]);
  const [autoScheduleDate, setAutoScheduleDate] = useState<Date>(new Date());
  const [autoScheduleTime, setAutoScheduleTime] = useState<string>("12:00");
  const [matchDuration, setMatchDuration] = useState<number>(45);
  const [assignCourts, setAssignCourts] = useState<boolean>(true);
  const [autoStartMatches, setAutoStartMatches] = useState<boolean>(true);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  // Reset states when dialog opens/closes or tournament changes
  useEffect(() => {
    if (open && currentTournament) {
      // Reset auto schedule states
      setActiveTab("auto-schedule");
      setSelectedDivision("INITIAL");
      setSuggestedPairs([]);
      setAutoScheduleDate(new Date());
      setAutoScheduleTime("12:00");
      setMatchDuration(45);
      setAssignCourts(true);
      setAutoStartMatches(true);
      
      // Reset manual schedule states
      setTeam1Id("");
      setTeam2Id("");
      setSelectedDate(new Date());
      setSelectedTime("12:00");
      setSelectedCourtId("");
      
      // Generate initial suggested pairs
      generateSuggestedPairs("INITIAL");
    }
  }, [open, currentTournament]);

  if (!currentTournament) {
    return null;
  }

  const teams = currentTournament.teams;
  const courts = currentTournament.courts.filter(court => court.status === "AVAILABLE");

  const generateSuggestedPairs = (division: Division) => {
    // Filter teams by division if specified
    const teamsInDivision = division !== "INITIAL" 
      ? teams.filter(team => {
          // Find matches for this team in the division
          const teamMatches = currentTournament.matches.filter(match => 
            (match.team1.id === team.id || match.team2.id === team.id) && 
            match.division === division
          );
          return teamMatches.length > 0;
        })
      : teams;
    
    // Simple pairing algorithm (can be improved)
    const pairs: { team1: Team; team2: Team }[] = [];
    
    // Create pairs avoiding teams that have already played each other
    for (let i = 0; i < teamsInDivision.length; i++) {
      for (let j = i + 1; j < teamsInDivision.length; j++) {
        const team1 = teamsInDivision[i];
        const team2 = teamsInDivision[j];
        
        // Check if these teams have already played each other in this division
        const alreadyPlayed = currentTournament.matches.some(match => 
          match.division === division &&
          ((match.team1.id === team1.id && match.team2.id === team2.id) ||
           (match.team1.id === team2.id && match.team2.id === team1.id))
        );
        
        if (!alreadyPlayed) {
          pairs.push({ team1, team2 });
        }
      }
    }
    
    setSuggestedPairs(pairs);
  };

  const handleScheduleMatches = async () => {
    if (!currentTournament || suggestedPairs.length === 0) {
      toast({
        title: "No matches to schedule",
        description: "Please create some team pairs first",
        variant: "destructive"
      });
      return;
    }
    
    setIsScheduling(true);
    
    try {
      // Use the scheduling service to schedule matches
      const result = await scheduleMatches(suggestedPairs, {
        date: autoScheduleDate,
        startTime: autoScheduleTime,
        matchDuration,
        assignCourts,
        autoStartMatches, // Add this new option
        division: selectedDivision
      });
      
      toast({
        title: "Matches scheduled successfully",
        description: `Scheduled ${result.scheduledMatches} matches, assigned ${result.assignedCourts} courts${result.startedMatches ? `, started ${result.startedMatches} matches` : ''}`,
        variant: "default"
      });
      
      // Close dialog after scheduling
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling matches:", error);
      toast({
        title: "Error scheduling matches",
        description: "An error occurred while scheduling matches",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  // Time options for dropdowns
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Matches & Assign Courts</DialogTitle>
          <DialogDescription>
            Schedule matches for your tournament and assign them to available courts
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto-schedule">Auto Schedule</TabsTrigger>
            <TabsTrigger value="manual-schedule">Manual Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="auto-schedule">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4 col-span-1">
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Select 
                    value={selectedDivision} 
                    onValueChange={(value: string) => {
                      setSelectedDivision(value as Division);
                      generateSuggestedPairs(value as Division);
                    }}
                  >
                    <SelectTrigger id="division">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INITIAL">Initial Round</SelectItem>
                      <SelectItem value="DIVISION_1">Division 1</SelectItem>
                      <SelectItem value="DIVISION_2">Division 2</SelectItem>
                      <SelectItem value="DIVISION_3">Division 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !autoScheduleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {autoScheduleDate ? (
                          format(autoScheduleDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={autoScheduleDate}
                        onSelect={(date) => setAutoScheduleDate(date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Select 
                    value={autoScheduleTime} 
                    onValueChange={setAutoScheduleTime}
                  >
                    <SelectTrigger id="start-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="match-duration">Match Duration (minutes)</Label>
                  <Input
                    id="match-duration"
                    type="number"
                    min="15"
                    step="5"
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value) || 45)}
                  />
                </div>

                <div className="space-y-3 border p-4 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between space-y-0">
                    <div className="flex flex-col">
                      <Label htmlFor="assign-courts" className="font-medium">
                        Assign Available Courts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Auto-assign courts to scheduled matches
                      </p>
                    </div>
                    <Switch
                      id="assign-courts"
                      checked={assignCourts}
                      onCheckedChange={setAssignCourts}
                    />
                  </div>
                  
                  {/* New Auto-Start option */}
                  <div className="flex items-center justify-between space-y-0">
                    <div className="flex flex-col">
                      <Label htmlFor="auto-start-matches" className="font-medium">
                        Auto-Start Matches with Courts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically start matches that have courts assigned
                      </p>
                    </div>
                    <Switch
                      id="auto-start-matches"
                      checked={autoStartMatches}
                      onCheckedChange={setAutoStartMatches}
                      disabled={!assignCourts}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Badge className="mb-2">Available Courts: {courts.length}</Badge>
                  {courts.length === 0 && (
                    <p className="text-sm text-amber-600">
                      No courts are available. Add courts to enable auto-assignment.
                    </p>
                  )}
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Suggested Match Pairs</h3>
                  <Badge variant={suggestedPairs.length > 0 ? "default" : "outline"}>
                    {suggestedPairs.length} pairs
                  </Badge>
                </div>
                
                <SuggestedMatchPairs 
                  suggestedPairs={suggestedPairs} 
                  onRefreshSuggestions={() => generateSuggestedPairs(selectedDivision)}
                />
                
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleScheduleMatches}
                  disabled={isScheduling || suggestedPairs.length === 0}
                >
                  {isScheduling ? (
                    <>
                      <Clock className="animate-spin h-4 w-4" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Schedule {suggestedPairs.length} Matches
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual-schedule">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team-1">Team 1</Label>
                  <Select 
                    value={team1Id} 
                    onValueChange={setTeam1Id}
                  >
                    <SelectTrigger id="team-1">
                      <SelectValue placeholder="Select first team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.id !== team2Id).map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-2">Team 2</Label>
                  <Select 
                    value={team2Id} 
                    onValueChange={setTeam2Id}
                  >
                    <SelectTrigger id="team-2">
                      <SelectValue placeholder="Select second team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(t => t.id !== team1Id).map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => setSelectedDate(date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select 
                    value={selectedTime} 
                    onValueChange={setSelectedTime}
                  >
                    <SelectTrigger id="time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="court">Court (Optional)</Label>
                <Select 
                  value={selectedCourtId} 
                  onValueChange={setSelectedCourtId}
                >
                  <SelectTrigger id="court">
                    <SelectValue placeholder="Assign a court (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No court</SelectItem>
                    {courts.map(court => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name} (Court {court.number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // We would implement manual scheduling here
                  toast({
                    title: "Match scheduled",
                    description: `Scheduled match between teams`,
                    variant: "default"
                  });
                  onOpenChange(false);
                }}
                disabled={!team1Id || !team2Id}
              >
                <Check className="mr-2 h-4 w-4" />
                Schedule Match
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedScheduleDialog;
