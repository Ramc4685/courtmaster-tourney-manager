
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Team, Court, TournamentCategory, Division } from "@/types/tournament";
import { useTournament } from "@/contexts/tournament/useTournament";

export interface ScheduleMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  onCreateMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;
}

const ScheduleMatchDialog: React.FC<ScheduleMatchDialogProps> = ({
  open,
  onOpenChange,
  tournamentId,
  onCreateMatch
}) => {
  const { currentTournament } = useTournament();
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [courtId, setCourtId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory | null>(null);

  // Update selected category when categoryId changes
  useEffect(() => {
    if (categoryId && currentTournament) {
      const category = currentTournament.categories.find(c => c.id === categoryId) || null;
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [categoryId, currentTournament]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team1Id || !team2Id || !scheduledDate || !categoryId) {
      return;
    }
    
    // Convert date and time to a Date object
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(hours, minutes, 0);
    
    // Call onCreateMatch with the selected values
    // Only pass courtId if it's not "none" (our special value for no court)
    onCreateMatch(
      team1Id, 
      team2Id, 
      scheduledDateTime, 
      courtId !== "none" ? courtId : undefined,
      categoryId
    );
  };

  const availableTeams = currentTournament?.teams || [];
  const availableCourts = currentTournament?.courts.filter(court => court.status === "AVAILABLE") || [];
  const availableCategories = currentTournament?.categories || [];

  // Filter out team2 options to prevent selecting the same team
  const team2Options = availableTeams.filter(team => team.id !== team1Id);
  
  // Filter teams by selected category
  const getTeamsByCategory = (categoryId: string) => {
    if (!categoryId) return availableTeams;
    // In a real implementation, teams would be filtered by category
    // For now, we'll assume all teams can play in all categories
    return availableTeams;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule New Match</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Category Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  // Reset team selections when category changes
                  setTeam1Id("");
                  setTeam2Id("");
                }}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} {category.format ? `(${category.format})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team1" className="text-right">
                Team 1
              </Label>
              <Select
                value={team1Id}
                onValueChange={setTeam1Id}
                disabled={!categoryId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Team 1" />
                </SelectTrigger>
                <SelectContent>
                  {getTeamsByCategory(categoryId).map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team2" className="text-right">
                Team 2
              </Label>
              <Select
                value={team2Id}
                onValueChange={setTeam2Id}
                disabled={!team1Id}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Team 2" />
                </SelectTrigger>
                <SelectContent>
                  {team2Options.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      {scheduledDate ? format(scheduledDate, "PPP") : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="court" className="text-right">
                Court (Optional)
              </Label>
              <Select
                value={courtId}
                onValueChange={setCourtId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Court (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Court Assigned</SelectItem>
                  {availableCourts.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Schedule Match</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMatchDialog;
