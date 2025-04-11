
import React, { useState, FormEvent } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Division } from "@/types/tournament-enums";
import { Team } from "@/types/tournament";
import { DialogFooter } from "@/components/ui/dialog";

interface FormData {
  team1Id: string;
  team2Id: string;
  courtId: string;
  scheduledDate: string;
  scheduledTime: string;
}

interface ManualScheduleTabProps {
  tournament: any;
  selectedDivision: Division;
  onDivisionChange: (value: Division) => void;
  onScheduleMatch: (formData: FormData) => void;
  onCancel: () => void;
}

const ManualScheduleTab: React.FC<ManualScheduleTabProps> = ({
  tournament,
  selectedDivision,
  onDivisionChange,
  onScheduleMatch,
  onCancel,
}) => {
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [courtId, setCourtId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onScheduleMatch({
      team1Id,
      team2Id,
      courtId,
      scheduledDate,
      scheduledTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="division">Division</Label>
        <Select 
          value={selectedDivision} 
          onValueChange={(value: string) => onDivisionChange(value as Division)}
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
            {tournament.teams.map((team: Team) => (
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
            {tournament.teams.map((team: Team) => (
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
            {tournament.courts
              .filter((court: any) => court.status === "AVAILABLE")
              .map((court: any) => (
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
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-court-green hover:bg-court-green/90">
          Schedule Match
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ManualScheduleTab;
