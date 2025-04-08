
import React, { useState } from "react";
import { Calendar, Clock, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Division, Tournament } from "@/types/tournament";
import SuggestedMatchPairs from "./SuggestedMatchPairs";

interface AutoScheduleTabProps {
  tournament: Tournament;
  selectedDivision: DivisionType;
  suggestedPairs: { team1: any; team2: any }[];
  onDivisionChange: (value: DivisionType) => void;
  onGenerateSuggestedPairs: () => void;
  onScheduleAllMatches: () => void;
  onCancel: () => void;
}

const AutoScheduleTab: React.FC<AutoScheduleTabProps> = ({
  tournament,
  selectedDivision,
  suggestedPairs,
  onDivisionChange,
  onGenerateSuggestedPairs,
  onScheduleAllMatches,
  onCancel,
}) => {
  const [autoScheduleDate, setAutoScheduleDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [autoScheduleTime, setAutoScheduleTime] = useState<string>("12:00");
  const [matchDuration, setMatchDuration] = useState<number>(60);

  const handleScheduleTimeChange = (date: string, time: string, duration: number) => {
    setAutoScheduleDate(date);
    setAutoScheduleTime(time);
    setMatchDuration(duration);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="auto-division">Division for Auto-Scheduling</Label>
        <Select 
          value={selectedDivision} 
          onValueChange={(value: string) => {
            onDivisionChange(value as Division);
            onGenerateSuggestedPairs();
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
              onChange={(e) => handleScheduleTimeChange(e.target.value, autoScheduleTime, matchDuration)}
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
            onChange={(e) => handleScheduleTimeChange(autoScheduleDate, e.target.value, matchDuration)}
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
            onChange={(e) => handleScheduleTimeChange(autoScheduleDate, autoScheduleTime, parseInt(e.target.value) || 60)}
            className="pl-8"
            min={30}
            max={180}
          />
        </div>
        <p className="text-xs text-gray-500">
          This helps schedule future matches when courts become available
        </p>
      </div>

      <SuggestedMatchPairs 
        suggestedPairs={suggestedPairs}
        onRefreshSuggestions={onGenerateSuggestedPairs}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Available Courts: <span className="font-medium">{tournament.courts.filter(c => c.status === "AVAILABLE").length}</span>
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
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className="bg-court-green hover:bg-court-green/90"
          onClick={() => onScheduleAllMatches()}
          disabled={suggestedPairs.length === 0}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Auto Schedule All Matches
        </Button>
      </DialogFooter>
    </div>
  );
};

export default AutoScheduleTab;
