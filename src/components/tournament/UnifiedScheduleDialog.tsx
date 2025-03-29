
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, CircleCheckBig, Users, CalendarClock } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Team, Division, TournamentCategory } from "@/types/tournament";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface UnifiedScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UnifiedScheduleDialog: React.FC<UnifiedScheduleDialogProps> = ({ open, onOpenChange }) => {
  const { currentTournament, scheduleMatches } = useTournament();
  const { toast } = useToast();
  const [selectedDivision, setSelectedDivision] = useState<Division>("INITIAL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [suggestedPairs, setSuggestedPairs] = useState<{ team1: Team; team2: Team }[]>([]);
  const [schedulingDate, setSchedulingDate] = useState<Date>(new Date());
  const [schedulingTime, setSchedulingTime] = useState<string>("12:00");
  const [matchDuration, setMatchDuration] = useState<number>(60); // Default match duration in minutes
  const [assignCourts, setAssignCourts] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtering teams by the selected category
  const getTeamsByCategory = (teams: Team[], categoryId: string): Team[] => {
    if (!categoryId) return teams;
    
    return teams.filter(team => 
      !team.category || 
      team.category.id === categoryId
    );
  };

  // Generate suggested team pairs based on current tournament stage, division, and category
  const generateSuggestedPairs = () => {
    if (!currentTournament) return;

    // Get already scheduled matches to avoid duplicates
    const scheduledMatchTeamIds = currentTournament.matches
      .filter(match => 
        match.division === selectedDivision &&
        match.stage === currentTournament.currentStage &&
        (!selectedCategoryId || match.category?.id === selectedCategoryId)
      )
      .map(match => [match.team1.id, match.team2.id])
      .flat();

    // Get teams based on category and division filters
    let availableTeams = currentTournament.teams;
    
    // Filter by category if selected
    if (selectedCategoryId) {
      availableTeams = getTeamsByCategory(availableTeams, selectedCategoryId);
    }
    
    // Filter out teams already in matches for this division and stage
    availableTeams = availableTeams.filter(team => 
      !scheduledMatchTeamIds.includes(team.id) ||
      !currentTournament.matches.some(
        m => (m.team1.id === team.id || m.team2.id === team.id) && 
             m.division === selectedDivision &&
             m.stage === currentTournament.currentStage &&
             (!selectedCategoryId || m.category?.id === selectedCategoryId)
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

  // Set the division based on the current tournament stage
  useEffect(() => {
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
      
      // Set default category if available
      if (currentTournament.categories.length > 0) {
        setSelectedCategoryId(currentTournament.categories[0].id);
      }
    }
  }, [currentTournament]);

  // Generate pairs when dialog opens or filters change
  useEffect(() => {
    if (open && currentTournament) {
      generateSuggestedPairs();
    }
  }, [open, selectedDivision, selectedCategoryId, currentTournament]);

  const handleScheduleAll = async () => {
    if (!currentTournament || suggestedPairs.length === 0) {
      toast({
        title: "No matches to schedule",
        description: "There are no available matches to schedule.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Schedule all matches with our unified service
      const result = await scheduleMatches(suggestedPairs, {
        date: schedulingDate,
        startTime: schedulingTime,
        matchDuration: matchDuration,
        assignCourts: assignCourts,
        categoryId: selectedCategoryId,
        division: selectedDivision
      });

      toast({
        title: "Scheduling Complete",
        description: `Scheduled ${result.scheduledMatches} matches with ${result.assignedCourts} courts assigned.`,
      });

      // Refresh the suggested pairs
      generateSuggestedPairs();
    } catch (error) {
      console.error('Error scheduling matches:', error);
      toast({
        title: "Scheduling Failed",
        description: "There was an error scheduling the matches.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onOpenChange(false);
    }
  };

  if (!currentTournament) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarClock className="mr-2 h-5 w-5" />
            Schedule Tournament Matches
          </DialogTitle>
          <DialogDescription>
            Schedule matches and automatically assign courts in one step
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Category selection */}
          {currentTournament.categories.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <div className="col-span-3">
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    generateSuggestedPairs();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentTournament.categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Division selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="division" className="text-right">Division</Label>
            <div className="col-span-3">
              <Select 
                value={selectedDivision} 
                onValueChange={(value: Division) => {
                  setSelectedDivision(value);
                  generateSuggestedPairs();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL">Initial</SelectItem>
                  <SelectItem value="QUALIFIER_DIV1">Qualifier Div 1</SelectItem>
                  <SelectItem value="QUALIFIER_DIV2">Qualifier Div 2</SelectItem>
                  <SelectItem value="DIVISION_1">Division 1</SelectItem>
                  <SelectItem value="DIVISION_2">Division 2</SelectItem>
                  <SelectItem value="DIVISION_3">Division 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team pairs information */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Team Pairs
            </Label>
            <div className="col-span-3 flex items-center justify-between">
              <span className="font-medium">
                {suggestedPairs.length} matches available to schedule
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateSuggestedPairs}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Date selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !schedulingDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {schedulingDate ? format(schedulingDate, "PPP") : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={schedulingDate}
                    onSelect={(date) => date && setSchedulingDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Time selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Start Time</Label>
            <div className="col-span-3">
              <Input
                type="time"
                value={schedulingTime}
                onChange={(e) => setSchedulingTime(e.target.value)}
              />
            </div>
          </div>

          {/* Match duration */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Match Duration
            </Label>
            <div className="col-span-3">
              <div className="flex items-center">
                <Input 
                  id="duration"
                  type="number" 
                  min={15} 
                  max={120}
                  value={matchDuration}
                  onChange={(e) => setMatchDuration(parseInt(e.target.value) || 60)}
                  className="w-full"
                />
                <span className="ml-2">minutes</span>
              </div>
            </div>
          </div>

          {/* Auto assign courts toggle */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Auto-Assign Courts</Label>
            <div className="col-span-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={assignCourts}
                  onCheckedChange={setAssignCourts}
                  id="assign-courts"
                />
                <Label htmlFor="assign-courts" className="cursor-pointer">
                  Automatically assign available courts to matches
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleAll}
            disabled={suggestedPairs.length === 0 || isProcessing}
            className="space-x-2 flex items-center"
          >
            <CircleCheckBig className="h-4 w-4" />
            <span>Schedule {suggestedPairs.length} Matches</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedScheduleDialog;
