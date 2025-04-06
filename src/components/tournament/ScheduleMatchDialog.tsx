
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTournament } from "@/contexts/tournament/useTournament";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Division, Team } from "@/types/tournament";
import ManualScheduleTab from "./schedule/ManualScheduleTab";
import AutoScheduleTab from "./schedule/AutoScheduleTab";

interface FormData {
  team1Id: string;
  team2Id: string;
  courtId: string;
  scheduledDate: string;
  scheduledTime: string;
}

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

  const handleSubmit = (formData: FormData) => {
    const { team1Id, team2Id, courtId, scheduledDate, scheduledTime } = formData;

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

    // Close dialog
    onOpenChange(false);
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
      const groupIndex = Math.floor(i / (availableCourts.length || 1));
      const matchTime = new Date(baseDateTime);
      matchTime.setMinutes(matchTime.getMinutes() + (groupIndex * matchDuration) + (i * 5));
      
      // Don't assign a court for these matches
      scheduleMatch(team1.id, team2.id, matchTime);
      scheduledCount++;
    }
    
    // Auto-assign courts for upcoming matches if courts are available
    if (availableCourts.length > 0) {
      autoAssignCourts();
    }
    
    toast({
      title: "Bulk scheduling complete",
      description: `Successfully scheduled ${scheduledCount} matches.`,
    });
    
    // Refresh suggested pairs
    generateSuggestedPairs();
    
    // Close the dialog
    onOpenChange(false);
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
            <ManualScheduleTab 
              tournament={currentTournament}
              selectedDivision={selectedDivision}
              onDivisionChange={setSelectedDivision}
              onScheduleMatch={handleSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="auto">
            <AutoScheduleTab 
              tournament={currentTournament}
              selectedDivision={selectedDivision}
              suggestedPairs={suggestedPairs}
              onDivisionChange={setSelectedDivision}
              onGenerateSuggestedPairs={generateSuggestedPairs}
              onScheduleAllMatches={scheduleAllMatches}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMatchDialog;
