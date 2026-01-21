import React, { useState, useMemo } from 'react';
import { Match, Tournament, Court } from '@/types/tournament';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Users2, CheckCircle2, XCircle, Maximize2, Minimize2 } from 'lucide-react';
import { format, isToday, addHours, isSameDay, parseISO, formatDistance, differenceInMinutes } from 'date-fns';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTournament } from '@/contexts/tournament/useTournament';

interface MatchTimelineProps {
  tournament: Tournament;
  matches: Match[];
  courts: Court[];
  date?: Date;
  onMatchUpdate?: (match: Match) => Promise<void>;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({
  tournament,
  matches,
  courts,
  date = new Date(),
  onMatchUpdate
}) => {
  const [expandedView, setExpandedView] = useState(false);
  const { toast } = useToast();
  const tournamentContext = useTournament();

  // Hours to display in the timeline (default 8:00 AM to 10:00 PM)
  // Use default hours as tournament.settings isn't available
  const startHour = 8; // Default to 8:00 AM
  const endHour = 22;  // Default to 10:00 PM
  
  // Filter matches for the selected date
  const matchesForDay = useMemo(() => {
    return matches.filter(match => {
      if (!match.startTime) return false;
      
      const matchDate = new Date(match.startTime);
      return isSameDay(matchDate, date);
    }).sort((a, b) => {
      // Sort by start time, then by court
      if (!a.startTime || !b.startTime) return 0;
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      
      if (dateA.getTime() === dateB.getTime()) {
        // If same time, sort by court
        return (a.courtId || '').localeCompare(b.courtId || '');
      }
      
      return dateA.getTime() - dateB.getTime();
    });
  }, [matches, date]);
  
  // Generate hours for the timeline
  const timelineHours = useMemo(() => {
    const hours = [];
    for (let i = startHour; i <= endHour; i++) {
      hours.push(i);
    }
    return hours;
  }, [startHour, endHour]);
  
  // Get the court name by ID
  const getCourtName = (courtId: string): string => {
    const court = courts.find(court => court.id === courtId);
    return court ? court.name : 'Unknown Court';
  };
  
  // Format match time range
  const formatMatchTime = (match: Match): string => {
    if (!match.startTime) return 'TBD';
    
    const startTime = new Date(match.startTime);
    if (!match.endTime) {
      return format(startTime, 'h:mm a');
    } else {
      const endTime = new Date(match.endTime);
      return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
    }
  };
  
  // Calculate position and width for a match in the timeline
  const getMatchPosition = (match: Match): { left: string; width: string } => {
    if (!match.startTime) {
      return { left: '0%', width: '0%' };
    }
    
    const startTime = new Date(match.startTime);
    const startHourFraction = startTime.getHours() + startTime.getMinutes() / 60;
    
    // Calculate match duration - default to 60 minutes if no end time
    let durationHours = 1;
    if (match.endTime) {
      const endTime = new Date(match.endTime);
      durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    }
    
    // Calculate position as percentage of total timeline width
    const timelineSpan = endHour - startHour;
    const startPosition = ((startHourFraction - startHour) / timelineSpan) * 100;
    const widthPercentage = (durationHours / timelineSpan) * 100;
    
    return {
      left: `${Math.max(0, startPosition)}%`,
      width: `${Math.min(100, widthPercentage)}%`,
    };
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Match Schedule: {format(date, 'EEEE, MMMM d')}</span>
              {isToday(date) && <Badge variant="outline">Today</Badge>}
            </div>
          </CardTitle>
        </div>
        <Button
          variant="ghost" 
          size="sm" 
          onClick={() => setExpandedView(!expandedView)}
          className="ml-auto"
        >
          {expandedView ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {matchesForDay.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No matches scheduled for this day.</p>
          </div>
        ) : (
          <div className={`match-timeline ${expandedView ? 'h-[500px]' : 'h-[300px]'}`}>
            {/* Timeline header */}
            <div className="grid grid-cols-[120px_1fr] border-b">
              <div className="p-2 font-medium text-sm">Court</div>
              <div className="relative">
                <div className="flex">
                  {timelineHours.map(hour => (
                    <div key={hour} className="flex-1 border-l p-2 text-center text-sm font-medium">
                      {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 ? 'AM' : 'PM'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Timeline content */}
            <ScrollArea className={`${expandedView ? 'h-[450px]' : 'h-[250px]'}`}>
              {/* Group matches by court */}
              {courts.filter(court => matchesForDay.some(m => m.courtId === court.id)).map(court => (
                <div key={court.id} className="grid grid-cols-[120px_1fr] border-b hover:bg-muted/10">
                  {/* Court name */}
                  <div className="p-2 font-medium border-r text-sm">
                    {court.name}
                  </div>
                  
                  {/* Timeline row */}
                  <div className="relative h-16">
                    {/* Hour markers */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timelineHours.map((hour, i) => (
                        <div 
                          key={hour} 
                          className={`flex-1 h-full border-l ${i === 0 ? 'border-l-0' : ''}`}
                        />
                      ))}
                    </div>
                    
                    {/* Match blocks */}
                    {matchesForDay.filter(m => m.courtId === court.id).map(match => {
                      const position = getMatchPosition(match);
                      return (
                        <TooltipProvider key={match.id}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div 
                                className={`absolute top-1 bottom-1 rounded px-2 py-1 flex items-center justify-center text-sm font-medium truncate shadow-sm cursor-pointer ${
                                  match.status === 'COMPLETED' ? 'bg-green-100 border-green-300 text-green-800' :
                                  'bg-blue-100 border-blue-300 text-blue-800'
                                }`}
                                style={{ 
                                  left: position.left, 
                                  width: position.width,
                                  minWidth: '80px'
                                }}
                              >
                                {match.team1?.name} vs {match.team2?.name}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="w-64">
                              <div className="space-y-2 p-1">
                                <div className="font-medium">
                                  {match.team1?.name} vs {match.team2?.name}
                                </div>
                                <div className="flex items-center text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{formatMatchTime(match)}</span>
                                </div>
                                <div className="flex items-center text-xs">
                                  <Users2 className="h-3 w-3 mr-1" />
                                  <span>{getCourtName(match.courtId || '')}</span>
                                </div>
                                {match.status === 'COMPLETED' ? (
                                  <div className="flex items-center text-xs text-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span>Completed</span>
                                  </div>
                                ) : null}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Handle matches without courts */}
              {matchesForDay.filter(m => !m.courtId).length > 0 && (
                <div className="grid grid-cols-[120px_1fr] border-b bg-muted/10">
                  <div className="p-2 font-medium border-r text-sm">
                    Unassigned
                  </div>
                  <div className="p-2">
                    <div className="flex flex-col gap-1">
                      {matchesForDay.filter(m => !m.courtId).map(match => (
                        <div key={match.id} className="text-sm p-1 border rounded flex justify-between bg-muted/30">
                          <span>{match.team1?.name} vs {match.team2?.name}</span>
                          <span className="text-muted-foreground">{formatMatchTime(match)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchTimeline;
