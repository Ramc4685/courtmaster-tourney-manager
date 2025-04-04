
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { useTournament } from '@/contexts/tournament/useTournament';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ScheduleMatchesProps {
  tournamentId: string;
}

const ScheduleMatches: React.FC<ScheduleMatchesProps> = ({ tournamentId }) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [matchDuration, setMatchDuration] = useState("30");
  const [breakDuration, setBreakDuration] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const { currentTournament, autoAssignCourts } = useTournament();
  const { toast } = useToast();

  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const handleSchedule = async () => {
    if (!currentTournament) return;

    setIsLoading(true);
    try {
      if (!startDate) {
        toast({
          title: "Date Required",
          description: "Please select a start date for scheduling.",
          variant: "destructive"
        });
        return;
      }

      // Parse the time
      const [hours, minutes] = startTime.split(':').map(Number);
      const scheduledDate = new Date(startDate);
      scheduledDate.setHours(hours, minutes, 0);

      // Assign courts to the matches
      const result = await autoAssignCourts();
      
      toast({
        title: "Courts Assigned",
        description: `Successfully assigned ${result} courts to matches.`
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Error scheduling matches:", error);
      toast({
        title: "Scheduling Error",
        description: "An error occurred while scheduling matches.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        className="w-full"
        variant="default"
        onClick={() => setOpen(true)}
      >
        <CalendarIcon className="h-5 w-5 mr-2" />
        Schedule & Assign Courts
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Matches</DialogTitle>
            <DialogDescription>
              Automatically schedule matches and assign courts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
              <label className="block text-sm font-medium">Start Time</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeOptions().map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Match Duration (minutes)</label>
              <Select value={matchDuration} onValueChange={setMatchDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select match duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Break Between Matches (minutes)</label>
              <Select value={breakDuration} onValueChange={setBreakDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select break duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No break</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Scheduling..." : "Schedule & Assign Courts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScheduleMatches;
