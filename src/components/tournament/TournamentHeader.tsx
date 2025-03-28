
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import PageHeader from "@/components/shared/PageHeader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tournament, TournamentFormat } from "@/types/tournament";
import { toast } from "@/components/ui/use-toast";

interface TournamentHeaderProps {
  tournament: Tournament;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (tournamentId: string) => void;
}

const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  tournament,
  updateTournament,
  deleteTournament
}) => {
  const [editMode, setEditMode] = useState(false);
  const [tournamentName, setTournamentName] = useState(tournament.name);
  const [tournamentDescription, setTournamentDescription] = useState(tournament.description || "");
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>(tournament.format);
  const [startDate, setStartDate] = useState<Date | undefined>(
    tournament.startDate ? new Date(tournament.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    tournament.endDate ? new Date(tournament.endDate) : undefined
  );
  const [autoAssignCourtsEnabled, setAutoAssignCourtsEnabled] = useState(
    tournament.autoAssignCourts || false
  );
  const [divisionProgressionEnabled, setDivisionProgressionEnabled] = useState(
    tournament.divisionProgression || false
  );
  const navigate = useNavigate();

  const handleTournamentUpdate = () => {
    const updatedTournament = {
      ...tournament,
      name: tournamentName,
      description: tournamentDescription,
      format: tournamentFormat,
      startDate: startDate || new Date(),
      endDate: endDate,
      autoAssignCourts: autoAssignCourtsEnabled,
      divisionProgression: divisionProgressionEnabled,
      updatedAt: new Date()
    };

    updateTournament(updatedTournament);
    setEditMode(false);
    
    toast({
      title: "Tournament Updated",
      description: "Tournament details have been successfully updated.",
    });
  };

  const handleTournamentDelete = () => {
    deleteTournament(tournament.id);
    navigate("/tournaments");
  };

  return (
    <div className="flex justify-between items-start flex-wrap mb-6">
      <div className="w-full md:w-2/3">
        {editMode ? (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Tournament Name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="mb-2"
            />
            <Input
              type="text"
              placeholder="Tournament Description"
              value={tournamentDescription}
              onChange={(e) => setTournamentDescription(e.target.value)}
              className="mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Tournament Format</Label>
                <Select 
                  value={tournamentFormat} 
                  onValueChange={(value) => setTournamentFormat(value as TournamentFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                    <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                    <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                    <SelectItem value="GROUP_DIVISION">Group Division</SelectItem>
                    <SelectItem value="MULTI_STAGE">Multi-Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-assign-courts">Auto-Assign Courts</Label>
                  <Switch
                    id="auto-assign-courts"
                    checked={autoAssignCourtsEnabled}
                    onCheckedChange={setAutoAssignCourtsEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="division-progression">Division Progression</Label>
                  <Switch
                    id="division-progression"
                    checked={divisionProgressionEnabled}
                    onCheckedChange={setDivisionProgressionEnabled}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="block">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="center">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="block">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="center">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ) : (
          <PageHeader
            title={tournament.name}
            description={tournament.description}
          />
        )}
      </div>

      <div className="mt-4 md:mt-0">
        {editMode ? (
          <div className="space-x-2">
            <Button onClick={handleTournamentUpdate}>Save</Button>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Tournament
            </Button>
            <Button variant="destructive" onClick={handleTournamentDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tournament
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentHeader;
