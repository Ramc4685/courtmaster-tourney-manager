import React, { useState } from 'react';
import { Court, Match } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTournament } from '@/contexts/tournament/useTournament';
import { useDndMonitor, useDroppable, useDraggable } from '@dnd-kit/core';
import { 
  DragItemType, 
  DragItem, 
  DropZone, 
  DragState,
  DropResult 
} from '@/types/drag-drop';
import { 
  GripHorizontal, 
  Calendar, 
  X,
  Clock,
  Users,
  Info,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CourtStatus } from '@/types/tournament-enums';

interface DraggableCourtTableProps {
  courts: Court[];
  matches: Match[];
  onCourtUpdate: (court: Court) => Promise<void>;
  onMatchUpdate: (match: Match) => Promise<void>;
  onClearCourt: (courtId: string) => Promise<void>;
}

export const DraggableCourtTable: React.FC<DraggableCourtTableProps> = ({
  courts,
  matches,
  onCourtUpdate,
  onMatchUpdate,
  onClearCourt
}) => {
  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [dragState, setDragState] = useState<DragState>(DragState.IDLE);
  const { currentTournament } = useTournament();

  // Function to get unassigned matches
  const getUnassignedMatches = (): Match[] => {
    return matches.filter(match => !match.courtId && !match.completed);
  };

  // Handle when a drag ends
  const handleDragEnd = (result: DropResult) => {
    setDragState(DragState.IDLE);
    setActiveDrag(null);
    
    if (!result.over || !result.active) {
      return;
    }

    const draggedMatchId = result.active.id as string;
    const targetCourtId = result.over.id as string;
    
    const match = matches.find(m => m.id === draggedMatchId);
    const court = courts.find(c => c.id === targetCourtId);
    
    if (match && court) {
      // Update the match with the court ID
      const updatedMatch = {
        ...match,
        courtId: court.id,
        startTime: new Date().toISOString(),
      };
      
      // Update the court with the match ID
      const updatedCourt = {
        ...court,
        currentMatchId: match.id,
        status: CourtStatus.OCCUPIED
      };
      
      Promise.all([
        onMatchUpdate(updatedMatch),
        onCourtUpdate(updatedCourt)
      ]).catch(error => {
        console.error('Error updating match or court:', error);
      });
    }
  };

  // Handle when a drag starts
  const handleDragStart = (event: any) => {
    const { active } = event;
    const draggedMatch = matches.find(m => m.id === active.id);
    
    if (draggedMatch) {
      setActiveDrag({
        id: draggedMatch.id,
        type: DragItemType.MATCH,
        data: draggedMatch
      });
      
      setDragState(DragState.DRAGGING);
    }
  };

  // Render a draggable match
  const DraggableMatch: React.FC<{ match: Match }> = ({ match }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: match.id,
      data: {
        type: DragItemType.MATCH,
        match
      }
    });
    
    const startTime = match.startTime ? new Date(match.startTime) : null;
    
    return (
      <div 
        ref={setNodeRef}
        {...attributes}
        className={`p-3 mb-2 bg-white rounded-lg border shadow-sm cursor-move ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <GripHorizontal className="mr-2 h-4 w-4 text-gray-400" />
            <span className="font-medium">{match.teams.map(team => team.name).join(' vs. ')}</span>
          </div>
          {match.startTime && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(match.startTime), { addSuffix: true })}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scheduled: {new Date(match.startTime).toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {match.teams.map((team) => (
            <div key={team.id} className="flex items-center">
              <Badge variant="secondary" className="text-xs">
                <Users className="mr-1 h-3 w-3" />
                {team.name}
              </Badge>
            </div>
          ))}
        </div>
        <div {...listeners} className="absolute inset-0 cursor-grab" />
      </div>
    );
  };

  // Render a droppable court
  const DroppableCourt: React.FC<{ court: Court }> = ({ court }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: court.id,
      data: {
        type: DragItemType.COURT,
        court
      }
    });
    
    const assignedMatch = matches.find(m => m.id === court.currentMatchId);
    
    return (
      <div 
        ref={setNodeRef}
        className={`border p-4 rounded-lg ${
          isOver ? 'bg-primary/10 border-primary' : 'bg-card'
        } ${
          court.status === CourtStatus.OCCUPIED ? 'border-green-500' : 
          court.status === CourtStatus.MAINTENANCE ? 'border-red-500' : 
          'border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{court.name}</h3>
          <Badge 
            variant={
              court.status === CourtStatus.AVAILABLE ? 'outline' :
              court.status === CourtStatus.OCCUPIED ? 'default' :
              'destructive'
            }
          >
            {court.status}
          </Badge>
        </div>
        
        {assignedMatch ? (
          <div className="p-3 bg-primary/10 rounded border border-primary/30">
            <div className="flex justify-between">
              <span className="font-medium">
                {assignedMatch.teams.map(team => team.name).join(' vs. ')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5" 
                onClick={() => onClearCourt(court.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {assignedMatch.startTime && (
              <div className="mt-2 text-xs text-muted-foreground">
                <Clock className="inline-block mr-1 h-3 w-3" />
                Started {formatDistanceToNow(new Date(assignedMatch.startTime), { addSuffix: true })}
              </div>
            )}
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded">
            {isOver ? 'Drop match here' : 'Drag a match here'}
          </div>
        )}
      </div>
    );
  };

  // Render a match for the drag overlay
  const MatchOverlay: React.FC<{ match: Match }> = ({ match }) => {
    return (
      <div className="p-3 bg-white rounded-lg border shadow-md w-64">
        <div className="flex items-center">
          <span className="font-medium">{match.teams.map(team => team.name).join(' vs. ')}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {match.teams.map((team) => (
            <Badge key={team.id} variant="secondary" className="text-xs">
              {team.name}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Court Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courts.map(court => (
                <DroppableCourt key={court.id} court={court} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {getUnassignedMatches().length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>All matches have been assigned to courts</p>
                  </div>
                ) : (
                  getUnassignedMatches().map(match => (
                    <DraggableMatch key={match.id} match={match} />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Drag overlay for visual feedback */}
        <DragOverlay>
          {activeDrag && activeDrag.type === DragItemType.MATCH && (
            <MatchOverlay match={activeDrag.data as Match} />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default DraggableCourtTable;
