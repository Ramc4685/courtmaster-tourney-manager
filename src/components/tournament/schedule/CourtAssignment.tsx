import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Court, Tournament } from '@/types/tournament';
import { UIMatch, getParticipantNames, isSchedulable, isInProgress } from '@/utils/adapters/matchAdapter';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MapPin,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  Eye,
  Grid3X3,
  List,
  Timer,
  Wrench,
  Activity,
  Target,
  Info,
  RefreshCw,
  Maximize2,
  Minimize2,
  Move,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

interface CourtAssignmentProps {
  tournament: Tournament;
  courts: Court[];
  matches: UIMatch[];
  onCourtUpdate: (court: Court) => Promise<void>;
  onMatchUpdate: (match: UIMatch) => Promise<void>;
}

type CourtStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
type ViewMode = 'grid' | 'list' | 'timeline';

interface CourtWithMatches extends Court {
  currentMatch?: Match;
  nextMatch?: Match;
  matchQueue: Match[];
  utilization: number;
  lastActivity?: Date;
}

interface DragItem {
  id: string;
  type: 'match' | 'court';
  match?: Match;
  court?: Court;
}

export const CourtAssignment: React.FC<CourtAssignmentProps> = ({
  tournament,
  courts,
  matches,
  onCourtUpdate,
  onMatchUpdate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const { isMobile } = useMobileOptimization();
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [autoAssignMode, setAutoAssignMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CourtStatus | 'all'>('all');
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { toast } = useToast();


  // Auto-refresh court status
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        // Simulate real-time updates - in production this would sync with backend
        console.log('Refreshing court status...');
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Enhanced courts with match information
  const enhancedCourts: CourtWithMatches[] = useMemo(() => {
    return courts.map(court => {
      const courtMatches = matches.filter(match =>
        match.courtId === court.id && match.status !== 'COMPLETED'
      );

      const currentMatch = courtMatches.find(match =>
        match.status === 'IN_PROGRESS' || match.status === 'READY'
      );

      const queuedMatches = courtMatches
        .filter(match => match.status === 'SCHEDULED')
        .sort((a, b) => {
          if (!a.scheduledTime || !b.scheduledTime) return 0;
          return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
        });

      const nextMatch = queuedMatches[0];
      const matchQueue = queuedMatches.slice(1);

      // Calculate utilization (matches assigned / available time slots)
      const totalTimeSlots = 10; // Assume 10 time slots per day
      const assignedSlots = courtMatches.length;
      const utilization = Math.min((assignedSlots / totalTimeSlots) * 100, 100);

      return {
        ...court,
        currentMatch,
        nextMatch,
        matchQueue,
        utilization,
        lastActivity: currentMatch?.updatedAt ? new Date(currentMatch.updatedAt) : undefined
      };
    });
  }, [courts, matches]);

  // Filter courts based on status
  const filteredCourts = useMemo(() => {
    if (filterStatus === 'all') return enhancedCourts;
    return enhancedCourts.filter(court => court.status === filterStatus);
  }, [enhancedCourts, filterStatus]);

  // Unassigned matches
  const unassignedMatches = useMemo(() => {
    return matches.filter(match => !match.courtId && match.status === 'SCHEDULED');
  }, [matches]);

  // Court statistics
  const courtStats = useMemo(() => {
    const total = enhancedCourts.length;
    const available = enhancedCourts.filter(c => c.status === 'AVAILABLE').length;
    const occupied = enhancedCourts.filter(c => c.status === 'OCCUPIED').length;
    const maintenance = enhancedCourts.filter(c => c.status === 'MAINTENANCE').length;
    const reserved = enhancedCourts.filter(c => c.status === 'RESERVED').length;

    const averageUtilization = total > 0
      ? enhancedCourts.reduce((sum, court) => sum + court.utilization, 0) / total
      : 0;

    const totalAssignedMatches = enhancedCourts.reduce((sum, court) =>
      sum + (court.currentMatch ? 1 : 0) + court.matchQueue.length, 0);

    return {
      total,
      available,
      occupied,
      maintenance,
      reserved,
      averageUtilization,
      totalAssignedMatches,
      unassignedMatches: unassignedMatches.length
    };
  }, [enhancedCourts, unassignedMatches]);

  const getStatusConfig = (status: CourtStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'Available' };
      case 'OCCUPIED':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Occupied' };
      case 'MAINTENANCE':
        return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Maintenance' };
      case 'RESERVED':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Reserved' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const handleCourtStatusChange = async (courtId: string, newStatus: CourtStatus) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;

    const updatedCourt = { ...court, status: newStatus, updatedAt: new Date() };

    try {
      await onCourtUpdate(updatedCourt);
      toast({
        title: "Court Status Updated",
        description: `${court.name} is now ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update court status. Please try again.",
      });
    }
  };

  const handleMatchAssignment = async (matchId: string, courtId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const updatedMatch = { ...match, courtId, updatedAt: new Date() };

    try {
      await onMatchUpdate(updatedMatch);
      toast({
        title: "Match Assigned",
        description: `Match assigned to ${courts.find(c => c.id === courtId)?.name}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: "Failed to assign match. Please try again.",
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Handle match to court assignment
    if (source.droppableId === 'unassigned' && destination.droppableId.startsWith('court-')) {
      const courtId = destination.droppableId.replace('court-', '');
      handleMatchAssignment(draggableId, courtId);
      return;
    }

    // Handle match reordering within court queue
    if (source.droppableId === destination.droppableId && source.droppableId.startsWith('court-')) {
      const courtId = source.droppableId.replace('court-', '');
      handleMatchReordering(draggableId, courtId, source.index, destination.index);
      return;
    }

    // Handle moving match between courts
    if (source.droppableId.startsWith('court-') && destination.droppableId.startsWith('court-') &&
        source.droppableId !== destination.droppableId) {
      const newCourtId = destination.droppableId.replace('court-', '');
      handleMatchAssignment(draggableId, newCourtId);
    }
  };

  const handleMatchReordering = async (matchId: string, courtId: string, fromIndex: number, toIndex: number) => {
    const court = enhancedCourts.find(c => c.id === courtId);
    if (!court) return;

    // Get all matches for this court (including current and next)
    const allCourtMatches = [
      ...(court.currentMatch ? [court.currentMatch] : []),
      ...(court.nextMatch ? [court.nextMatch] : []),
      ...court.matchQueue
    ];

    // Find the match being reordered
    const draggedMatch = allCourtMatches.find(m => m.id === matchId);
    if (!draggedMatch) return;

    try {
      // For now, we'll update the match with a priority/order field
      // In a real implementation, you'd need to:
      // 1. Update the queue_index or priority field in the database
      // 2. Potentially adjust scheduled times based on new order
      // 3. Update all affected matches

      const updatedMatch = {
        ...draggedMatch,
        // Add a queue_index field if your match model supports it
        queue_index: toIndex,
        updatedAt: new Date()
      };

      await onMatchUpdate(updatedMatch);

      toast({
        title: "Match Reordered",
        description: `Match moved to position ${toIndex + 1} in queue.`,
      });

      // Optionally, you could emit an event to refresh the match list
      // or update other matches' queue positions

    } catch (error) {
      console.error('Failed to reorder match:', error);
      toast({
        variant: "destructive",
        title: "Reorder Failed",
        description: "Failed to reorder match in queue. Please try again.",
      });
    }
  };

  const autoAssignMatches = () => {
    const availableCourts = enhancedCourts.filter(court =>
      court.status === 'AVAILABLE' && !court.currentMatch
    );

    if (availableCourts.length === 0 || unassignedMatches.length === 0) {
      toast({
        variant: "destructive",
        title: "Auto-assignment Failed",
        description: "No available courts or unassigned matches.",
      });
      return;
    }

    // Simple round-robin assignment
    unassignedMatches.forEach((match, index) => {
      const court = availableCourts[index % availableCourts.length];
      handleMatchAssignment(match.id, court.id);
    });

    toast({
      title: "Auto-assignment Complete",
      description: `${unassignedMatches.length} matches assigned automatically.`,
    });
  };

  const renderCourtCard = (court: CourtWithMatches) => {
    const statusConfig = getStatusConfig(court.status);
    const isSelected = selectedCourt === court.id;

    return (
      <Card
        key={court.id}
        className={cn(
          "transition-all cursor-pointer hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          court.status === 'MAINTENANCE' && "opacity-75"
        )}
        onClick={() => setSelectedCourt(isSelected ? null : court.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className={cn("h-10 w-10", statusConfig.bg)}>
                <AvatarFallback className={statusConfig.color}>
                  {court.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{court.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {court.utilization.toFixed(0)}% utilized
                  </Badge>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCourtStatusChange(court.id, 'AVAILABLE')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Available
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCourtStatusChange(court.id, 'OCCUPIED')}>
                  <Play className="h-4 w-4 mr-2" />
                  Mark Occupied
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCourtStatusChange(court.id, 'MAINTENANCE')}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Mark Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCourtStatusChange(court.id, 'RESERVED')}>
                  <Timer className="h-4 w-4 mr-2" />
                  Mark Reserved
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Droppable droppableId={`court-${court.id}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "space-y-2 min-h-[100px] p-2 border-2 border-dashed rounded-lg transition-colors",
                  snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-muted"
                )}
              >
                {/* Current Match */}
                {court.currentMatch && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Current Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {court.currentMatch.team1?.name} vs {court.currentMatch.team2?.name}
                    </p>
                  </div>
                )}

                {/* Next Match */}
                {court.nextMatch && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Next Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {court.nextMatch.team1?.name} vs {court.nextMatch.team2?.name}
                    </p>
                  </div>
                )}

                {/* Match Queue */}
                {court.matchQueue.map((match, index) => (
                  <Draggable key={match.id} draggableId={match.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "p-2 bg-muted rounded border text-sm",
                          snapshot.isDragging && "rotate-2 shadow-lg"
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <Move className="h-3 w-3 text-muted-foreground" />
                          <span>{match.team1?.name} vs {match.team2?.name}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {!court.currentMatch && !court.nextMatch && court.matchQueue.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-muted-foreground">
                    <div className="text-center">
                      <MapPin className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">Drop matches here</p>
                    </div>
                  </div>
                )}

                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Utilization Progress */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Utilization</span>
              <span>{court.utilization.toFixed(0)}%</span>
            </div>
            <Progress value={court.utilization} className="h-1" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={cn("space-y-6", isMobile && "space-y-4")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-primary" />
              <span>Court Assignment</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage court availability and assign matches visually
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5"
        )}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courts</p>
                  <p className="text-2xl font-bold">{courtStats.total}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{courtStats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Play className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold">{courtStats.occupied}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Utilization</p>
                  <p className="text-2xl font-bold">{courtStats.averageUtilization.toFixed(0)}%</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                  <p className="text-2xl font-bold">{courtStats.unassignedMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className={cn(
              "flex flex-wrap items-center gap-4",
              isMobile && "flex-col space-y-3"
            )}>
              {/* View Mode */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>

              {/* Filters */}
              <Select value={filterStatus} onValueChange={(value: CourtStatus | 'all') => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courts</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                </SelectContent>
              </Select>

              {/* Auto-assign */}
              <Button
                variant="outline"
                size="sm"
                onClick={autoAssignMatches}
                disabled={unassignedMatches.length === 0}
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto-assign ({unassignedMatches.length})
              </Button>

              {/* Refresh Interval */}
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No refresh</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unassigned Matches */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Unassigned Matches</span>
                  <Badge variant="secondary">{unassignedMatches.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-2 min-h-[200px]",
                        snapshot.isDraggingOver && "bg-muted/50"
                      )}
                    >
                      {unassignedMatches.map((match, index) => (
                        <Draggable key={match.id} draggableId={match.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "p-3 border rounded-lg cursor-move transition-all",
                                snapshot.isDragging ? "shadow-lg rotate-2 bg-card" : "hover:shadow-md"
                              )}
                            >
                              <div className="flex items-center space-x-2">
                                <Move className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {match.team1?.name} vs {match.team2?.name}
                                  </p>
                                  {match.scheduledTime && (
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(match.scheduledTime).toLocaleTimeString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {unassignedMatches.length === 0 && (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                          <div className="text-center">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">All matches assigned!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          {/* Courts Grid */}
          <div className="lg:col-span-3">
            {viewMode === 'grid' ? (
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}>
                {filteredCourts.map(renderCourtCard)}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourts.map(renderCourtCard)}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tips */}
        {isMobile && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Court Management Tips:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Drag matches from unassigned to courts</li>
                  <li>Tap court cards to view details</li>
                  <li>Use auto-assign for quick setup</li>
                  <li>Monitor utilization for balance</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};