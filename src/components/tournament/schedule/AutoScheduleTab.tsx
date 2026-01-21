import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Wand2,
  CalendarDays,
  ListFilter,
  Target,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  MapPin,
  Zap,
  RotateCcw,
  Save,
  Eye,
  Copy,
  Shuffle
} from "lucide-react";
import { format, addDays, parseISO, addMinutes, isAfter, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Division } from "@/types/tournament-enums";
import { Tournament, Court } from "@/types/tournament";
import { UIMatch, getParticipantNames, isSchedulable } from '@/utils/adapters/matchAdapter';
import SuggestedMatchPairs from "./SuggestedMatchPairs";
import MatchTimeline from "./MatchTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AutoScheduleTabProps {
  tournament: Tournament;
  matches?: UIMatch[];
  courts?: Court[];
  selectedDivision: Division;
  suggestedPairs: { team1: any; team2: any }[];
  onDivisionChange: (value: Division) => void;
  onGenerateSuggestedPairs: () => void;
  onScheduleAllMatches: () => void;
  onCancel: () => void;
  onMatchUpdate?: (match: Match) => Promise<void>;
}

interface SchedulingPreferences {
  prioritizeBalance: boolean;
  allowSimultaneous: boolean;
  minimumBreakTime: number;
  preferredStartTime: string;
  maxDailyMatches: number;
  courtPreferences: Record<string, boolean>;
}

const AutoScheduleTab: React.FC<AutoScheduleTabProps> = ({
  tournament,
  matches = [],
  courts = [],
  selectedDivision,
  suggestedPairs,
  onDivisionChange,
  onGenerateSuggestedPairs,
  onScheduleAllMatches,
  onCancel,
  onMatchUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [autoScheduleDate, setAutoScheduleDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [autoScheduleTime, setAutoScheduleTime] = useState<string>("09:00");
  const [matchDuration, setMatchDuration] = useState<number>(45);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { isMobile } = useMobileOptimization();
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingProgress, setSchedulingProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'list'>('timeline');
  const [previewMode, setPreviewMode] = useState(false);

  const { toast } = useToast();

  // Advanced scheduling preferences
  const [preferences, setPreferences] = useState<SchedulingPreferences>({
    prioritizeBalance: true,
    allowSimultaneous: true,
    minimumBreakTime: 15,
    preferredStartTime: "09:00",
    maxDailyMatches: 8,
    courtPreferences: {}
  });

  // Tournament dates
  const startDate = tournament?.startDate ? parseISO(tournament.startDate) : new Date();
  const endDate = tournament?.endDate ? parseISO(tournament.endDate) : addDays(new Date(), 7);

  const tournamentDates = useMemo(() => {
    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }, [startDate, endDate]);

  // Available courts with status
  const courtStats = useMemo(() => {
    const available = courts.filter(c => c.status === "AVAILABLE").length;
    const occupied = courts.filter(c => c.status === "OCCUPIED").length;
    const maintenance = courts.filter(c => c.status === "MAINTENANCE").length;

    return { available, occupied, maintenance, total: courts.length };
  }, [courts]);

  // Scheduling statistics
  const schedulingStats = useMemo(() => {
    const scheduledMatches = matches.filter(m => m.scheduledTime).length;
    const unscheduledMatches = suggestedPairs.length;
    const totalMatches = scheduledMatches + unscheduledMatches;
    const completionRate = totalMatches > 0 ? (scheduledMatches / totalMatches) * 100 : 0;

    return {
      scheduled: scheduledMatches,
      unscheduled: unscheduledMatches,
      total: totalMatches,
      completionRate
    };
  }, [matches, suggestedPairs]);

  // Smart scheduling suggestions
  const smartSuggestions = useMemo(() => {
    const suggestions = [];

    if (courtStats.available === 0) {
      suggestions.push({
        type: 'warning',
        title: 'No Available Courts',
        description: 'All courts are currently occupied or under maintenance.',
        action: 'Check court status'
      });
    }

    if (matchDuration < 30) {
      suggestions.push({
        type: 'info',
        title: 'Short Match Duration',
        description: 'Consider if 30+ minutes allows adequate play time.',
        action: 'Adjust duration'
      });
    }

    if (suggestedPairs.length > courtStats.available * 3) {
      suggestions.push({
        type: 'tip',
        title: 'Multiple Rounds Needed',
        description: `${Math.ceil(suggestedPairs.length / courtStats.available)} rounds will be required.`,
        action: 'Consider staggering'
      });
    }

    if (schedulingStats.completionRate > 80) {
      suggestions.push({
        type: 'success',
        title: 'Nearly Complete',
        description: 'Most matches are already scheduled.',
        action: 'Review timeline'
      });
    }

    return suggestions;
  }, [courtStats, matchDuration, suggestedPairs.length, schedulingStats.completionRate]);

  const handleScheduleTimeChange = (date: string, time: string, duration: number) => {
    setAutoScheduleDate(date);
    setAutoScheduleTime(time);
    setMatchDuration(duration);
  };

  const handleAdvancedSchedule = async () => {
    setIsScheduling(true);
    setSchedulingProgress(0);

    try {
      // Simulate intelligent scheduling with progress
      for (let i = 0; i <= 100; i += 20) {
        setSchedulingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await onScheduleAllMatches();

      toast({
        title: "Smart Scheduling Complete",
        description: `${suggestedPairs.length} matches scheduled successfully with optimized timing.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scheduling Failed",
        description: "There was an error scheduling the matches. Please try again.",
      });
    } finally {
      setIsScheduling(false);
      setSchedulingProgress(0);
    }
  };

  const handlePreferences = (key: keyof SchedulingPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const estimateSchedulingTime = () => {
    const availableCourts = courtStats.available;
    const totalMatches = suggestedPairs.length;

    if (availableCourts <= 0 || totalMatches <= 0) {
      return {
        rounds: 0,
        totalMinutes: 0,
        endTime: new Date(`${autoScheduleDate}T${autoScheduleTime}`),
        matchesPerRound: 0
      };
    }

    const rounds = Math.ceil(totalMatches / availableCourts);
    const totalMinutes = rounds * (matchDuration + preferences.minimumBreakTime);

    return {
      rounds,
      totalMinutes,
      endTime: addMinutes(new Date(`${autoScheduleDate}T${autoScheduleTime}`), totalMinutes),
      matchesPerRound: Math.floor(totalMatches / rounds)
    };
  };

  const scheduling = estimateSchedulingTime();

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <span>Smart Scheduling</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Intelligently schedule matches with optimal court utilization
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
      )}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Courts</p>
                <p className="text-2xl font-bold">{courtStats.available}</p>
                <p className="text-xs text-muted-foreground">
                  of {courtStats.total} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matches Pending</p>
                <p className="text-2xl font-bold">{schedulingStats.unscheduled}</p>
                <p className="text-xs text-muted-foreground">
                  to be scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{schedulingStats.scheduled}</p>
                <p className="text-xs text-green-600">
                  {schedulingStats.completionRate.toFixed(1)}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Duration</p>
                <p className="text-2xl font-bold">{Math.ceil(scheduling.totalMinutes / 60)}h</p>
                <p className="text-xs text-muted-foreground">
                  {scheduling.rounds} rounds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Smart Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {smartSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {suggestion.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className={cn(
          "grid w-full",
          isMobile ? "grid-cols-2" : "grid-cols-3"
        )}>
          <TabsTrigger value="schedule">
            <Settings className="mr-2 h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <CalendarDays className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          {!isMobile && (
            <TabsTrigger value="advanced">
              <Target className="mr-2 h-4 w-4" />
              Advanced
            </TabsTrigger>
          )}
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ListFilter className="h-5 w-5 mr-2" />
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="auto-division">Division for Scheduling</Label>
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
                    <SelectItem value={Division.INITIAL}>Initial</SelectItem>
                    <SelectItem value={Division.OPEN}>Open</SelectItem>
                    <SelectItem value={Division.MENS}>Men's</SelectItem>
                    <SelectItem value={Division.WOMENS}>Women's</SelectItem>
                    <SelectItem value={Division.MIXED}>Mixed</SelectItem>
                    <SelectItem value={Division.JUNIORS}>Juniors</SelectItem>
                    <SelectItem value={Division.SENIORS}>Seniors</SelectItem>
                    <SelectItem value={Division.BEGINNER}>Beginner</SelectItem>
                    <SelectItem value={Division.INTERMEDIATE}>Intermediate</SelectItem>
                    <SelectItem value={Division.ADVANCED}>Advanced</SelectItem>
                    <SelectItem value={Division.PRO}>Pro</SelectItem>
                    <SelectItem value={Division.CUSTOM}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-2"
              )}>
                <div className="space-y-2">
                  <Label htmlFor="auto-date">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      id="auto-date"
                      value={autoScheduleDate}
                      onChange={(e) => handleScheduleTimeChange(e.target.value, autoScheduleTime, matchDuration)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-time">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      id="auto-time"
                      value={autoScheduleTime}
                      onChange={(e) => handleScheduleTimeChange(autoScheduleDate, e.target.value, matchDuration)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-duration">Match Duration</Label>
                  <Badge variant="outline">{matchDuration} minutes</Badge>
                </div>
                <Slider
                  id="match-duration"
                  min={30}
                  max={120}
                  step={15}
                  value={[matchDuration]}
                  onValueChange={(value) => handleScheduleTimeChange(autoScheduleDate, autoScheduleTime, value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30 min</span>
                  <span>120 min</span>
                </div>
              </div>

              {/* Scheduling Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Scheduling Preview</span>
                </h4>
                {scheduling.rounds === 0 ? (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">No available courts or matches to schedule.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Time:</p>
                      <p className="font-medium">{autoScheduleTime} on {format(new Date(autoScheduleDate), 'MMM dd')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated End:</p>
                      <p className="font-medium">{format(scheduling.endTime, 'HH:mm')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Rounds:</p>
                      <p className="font-medium">{scheduling.rounds}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Matches per Round:</p>
                      <p className="font-medium">{scheduling.matchesPerRound}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <SuggestedMatchPairs
            suggestedPairs={suggestedPairs}
            onRefreshSuggestions={onGenerateSuggestedPairs}
          />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex space-x-1 overflow-x-auto",
              isMobile && "flex-1"
            )}>
              {tournamentDates.map((date, index) => (
                <Button
                  key={index}
                  variant={format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className="flex-shrink-0"
                >
                  {format(date, 'MMM dd')}
                </Button>
              ))}
            </div>

            {!isMobile && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'timeline' ? 'grid' : 'timeline')}
                >
                  {viewMode === 'timeline' ? 'Grid View' : 'Timeline View'}
                </Button>
              </div>
            )}
          </div>

          <MatchTimeline
            tournament={tournament}
            matches={matches}
            courts={courts}
            date={selectedDate}
            onMatchUpdate={onMatchUpdate}
          />
        </TabsContent>

        {/* Advanced Tab */}
        {!isMobile && (
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Advanced Scheduling Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="preferences">
                    <AccordionTrigger>Scheduling Preferences</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Prioritize Load Balancing</Label>
                          <p className="text-sm text-muted-foreground">
                            Distribute matches evenly across courts
                          </p>
                        </div>
                        <Switch
                          checked={preferences.prioritizeBalance}
                          onCheckedChange={(checked) => handlePreferences('prioritizeBalance', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Simultaneous Matches</Label>
                          <p className="text-sm text-muted-foreground">
                            Teams can play multiple categories
                          </p>
                        </div>
                        <Switch
                          checked={preferences.allowSimultaneous}
                          onCheckedChange={(checked) => handlePreferences('allowSimultaneous', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Minimum Break Time (minutes)</Label>
                        <Slider
                          value={[preferences.minimumBreakTime]}
                          onValueChange={(value) => handlePreferences('minimumBreakTime', value[0])}
                          min={5}
                          max={60}
                          step={5}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5 min</span>
                          <span>{preferences.minimumBreakTime} min</span>
                          <span>60 min</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="court-preferences">
                    <AccordionTrigger>Court Preferences</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {courts.map((court) => (
                          <div key={court.id} className="flex items-center justify-between">
                            <div>
                              <Label>{court.name}</Label>
                              <p className="text-sm text-muted-foreground">
                                Status: {court.status}
                              </p>
                            </div>
                            <Switch
                              checked={preferences.courtPreferences[court.id] !== false}
                              onCheckedChange={(checked) =>
                                handlePreferences('courtPreferences', {
                                  ...preferences.courtPreferences,
                                  [court.id]: checked
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Scheduling Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium">Ready to Schedule</p>
                <p className="text-muted-foreground">
                  {suggestedPairs.length} matches • {courtStats.available} courts
                </p>
              </div>

              {isScheduling && (
                <div className="flex items-center space-x-2">
                  <Progress value={schedulingProgress} className="w-24" />
                  <span className="text-sm text-muted-foreground">
                    {schedulingProgress}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isScheduling}
              >
                Cancel
              </Button>

              <Button
                onClick={handleAdvancedSchedule}
                disabled={suggestedPairs.length === 0 || isScheduling || courtStats.available === 0}
                className="min-w-[140px]"
              >
                {isScheduling ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Smart Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Tips */}
      {isMobile && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Mobile Scheduling Tips:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Use smart suggestions for optimal timing</li>
                <li>Preview schedules before applying</li>
                <li>Check court availability first</li>
                <li>Allow buffer time between matches</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoScheduleTab;