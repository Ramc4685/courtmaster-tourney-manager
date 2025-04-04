import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Team, Division, Tournament } from "@/types/tournament";
import { useTournament } from "@/contexts/tournament/useTournament"; // Updated import path
import { toast } from "@/components/ui/use-toast";
import SuggestedMatchPairs from "./SuggestedMatchPairs";
import { SchedulingOptions } from "@/services/tournament/SchedulingService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UnifiedScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UnifiedScheduleDialog: React.FC<UnifiedScheduleDialogProps> = ({
  open,
  onOpenChange
}) => {
  // State for dialog tabs
  const [activeTab, setActiveTab] = useState<"auto" | "manual">("auto");
  
  // Get tournament context
  const { currentTournament, scheduleMatches } = useTournament();
  
  // Auto schedule tab state
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [matchDuration, setMatchDuration] = useState<number>(30);
  const [assignCourts, setAssignCourts] = useState<boolean>(true);
  const [autoStartMatches, setAutoStartMatches] = useState<boolean>(true);
  const [selectedDivision, setSelectedDivision] = useState<Division>("INITIAL");
  const [suggestedPairs, setSuggestedPairs] = useState<{ team1: Team; team2: Team }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // When dialog opens, generate suggested pairs
  useEffect(() => {
    if (open) {
      generateSuggestedPairs(selectedDivision);
    }
  }, [open, selectedDivision]);
  
  // Generate suggested pairs based on division
  const generateSuggestedPairs = (division: Division) => {
    if (!currentTournament) return;
    
    // Fix: Filter teams without using the division property from Team
    // Instead, we'll use match data to determine which teams belong to which division
    const teamsInDivision = new Set<string>();
    
    // First, find all teams that have played in this division
    currentTournament.matches.forEach(match => {
      if (match.division === division) {
        teamsInDivision.add(match.team1.id);
        teamsInDivision.add(match.team2.id);
      }
    });
    
    // If no matches in this division yet, use all teams
    let eligibleTeams = teamsInDivision.size > 0 
      ? currentTournament.teams.filter(t => teamsInDivision.has(t.id))
      : currentTournament.teams;
    
    // Check if there are enough teams
    if (eligibleTeams.length < 2) {
      setSuggestedPairs([]);
      return;
    }
    
    // Create pairs
    const pairs: { team1: Team; team2: Team }[] = [];
    
    // Find teams without scheduled matches first
    const scheduledTeamIds = new Set(
      currentTournament.matches
        .filter(m => m.status !== "COMPLETED" && m.status !== "CANCELLED")
        .flatMap(m => [m.team1.id, m.team2.id])
    );
    
    const unscheduledTeams = eligibleTeams.filter(t => !scheduledTeamIds.has(t.id));
    const teamsWithMatches = eligibleTeams.filter(t => scheduledTeamIds.has(t.id));
    
    // Prioritize unscheduled teams first
    for (let i = 0; i < unscheduledTeams.length; i += 2) {
      if (i + 1 < unscheduledTeams.length) {
        pairs.push({
          team1: unscheduledTeams[i],
          team2: unscheduledTeams[i + 1]
        });
      }
    }
    
    // If there's an odd unscheduled team, pair it with a team that already has matches
    if (unscheduledTeams.length % 2 !== 0 && teamsWithMatches.length > 0) {
      pairs.push({
        team1: unscheduledTeams[unscheduledTeams.length - 1],
        team2: teamsWithMatches[0]
      });
      teamsWithMatches.shift();
    }
    
    // Then create pairs from remaining teams
    for (let i = 0; i < teamsWithMatches.length; i += 2) {
      if (i + 1 < teamsWithMatches.length) {
        pairs.push({
          team1: teamsWithMatches[i],
          team2: teamsWithMatches[i + 1]
        });
      }
    }
    
    setSuggestedPairs(pairs);
  };
  
  // Schedule matches
  const handleSchedule = async () => {
    if (!currentTournament || suggestedPairs.length === 0) return;
    
    setLoading(true);
    
    try {
      console.log("Scheduling matches with options:", {
        date,
        startTime,
        matchDuration,
        assignCourts,
        autoStartMatches,
        division: selectedDivision,
        pairsCount: suggestedPairs.length
      });
      
      const options: SchedulingOptions = {
        date,
        startTime,
        matchDuration,
        assignCourts,
        autoStartMatches,
        division: selectedDivision
      };
      
      console.log("Calling scheduleMatches with pairs:", suggestedPairs);
      const result = await scheduleMatches(suggestedPairs, options);
      console.log("Schedule result:", result);
      
      // Show success message
      toast({
        title: "Matches scheduled successfully",
        description: `${result.scheduledMatches} matches scheduled, ${result.assignedCourts} courts assigned${
          autoStartMatches ? `, ${result.startedMatches} matches started` : ''
        }`,
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling matches:", error);
      toast({
        title: "Error scheduling matches",
        description: "An error occurred while scheduling matches.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Schedule & Start Matches</DialogTitle>
          <DialogDescription>
            Schedule multiple matches at once with automatic court assignment.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "auto" | "manual")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">Auto Schedule</TabsTrigger>
            <TabsTrigger value="manual">Manual Schedule</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[60vh] pr-4 pb-4">
            <TabsContent value="auto" className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => setDate(newDate as Date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matchDuration">Match Duration (minutes)</Label>
                    <Input
                      id="matchDuration"
                      type="number"
                      value={matchDuration}
                      onChange={(e) => setMatchDuration(Number(e.target.value))}
                      min={5}
                      step={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    <Select
                      value={selectedDivision}
                      onValueChange={(value) => {
                        setSelectedDivision(value as Division);
                        generateSuggestedPairs(value as Division);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INITIAL">Initial</SelectItem>
                        <SelectItem value="A">Division A</SelectItem>
                        <SelectItem value="B">Division B</SelectItem>
                        <SelectItem value="C">Division C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assignCourts"
                      checked={assignCourts}
                      onCheckedChange={setAssignCourts}
                    />
                    <Label htmlFor="assignCourts">Auto-assign courts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoStartMatches"
                      checked={autoStartMatches}
                      onCheckedChange={setAutoStartMatches}
                      disabled={!assignCourts}
                    />
                    <Label 
                      htmlFor="autoStartMatches" 
                      className={!assignCourts ? "text-gray-400" : ""}
                    >
                      Auto-start matches
                    </Label>
                  </div>
                </div>
                  
                <SuggestedMatchPairs 
                  suggestedPairs={suggestedPairs} 
                  onRefreshSuggestions={() => generateSuggestedPairs(selectedDivision)}
                />
              </div>
            </TabsContent>
          
            {/* Manual scheduling tab content would go here */}
            <TabsContent value="manual" className="pt-4">
              <div className="text-center py-8 text-gray-500">
                <p>Manual scheduling allows you to create individual matches with specific teams and times.</p>
                <p className="mt-2">To manually schedule matches, close this dialog and use the "Schedule One Match" button on the Matches tab.</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button
            className="w-full"
            disabled={loading || suggestedPairs.length === 0}
            onClick={handleSchedule}
          >
            {loading ? "Scheduling..." : "Schedule & Start Matches"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedScheduleDialog;
