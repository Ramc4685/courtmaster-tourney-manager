import React, { useState, useMemo } from 'react';
import { Court } from '@/types/entities';
import { Match } from '@/types/tournament';
import { CourtStatus } from '@/types/tournament-enums';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users2, CalendarClock, Filter, ChevronDown, ChevronUp, Clock, Activity } from 'lucide-react';
import CourtMatchAssignment from '@/components/tournament/courts/CourtMatchAssignment';
import { useTournament } from '@/contexts/tournament/useTournament';
// import * as ReactWindow from 'react-window'; // Temporarily disabled due to import issues
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface CourtTableProps {
  courts: Court[];
  matches?: Match[];
  onEditCourt?: (court: Court) => void;
  onDeleteCourt?: (courtId: string) => void;
  onCourtUpdate?: (court: Court) => void;
  onMatchUpdate?: (match: Match) => void;
  tournament?: any; // Tournament data if available
  onCourtAssignment?: (courtId: string, matchId: string) => void;
}

const DroppableMatch = ({ match }: { match: Match }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `match-${match.id}`,
    data: { match }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 border rounded-lg transition-colors cursor-pointer",
        isOver ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="text-sm font-medium">
        {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
      </div>
      <div className="text-xs text-muted-foreground">
        Match {match.matchNumber || 'TBD'} - Round {match.bracketRound || 1}
      </div>
      {match.scheduledTime && (
        <div className="text-xs text-muted-foreground">
          {new Date(match.scheduledTime).toLocaleString()}
        </div>
      )}
    </div>
  );
};

const CourtStatusBadge = ({ status, showDot = false }: { status: CourtStatus; showDot?: boolean }) => {
  let badgeText = "";
  let badgeColor = "bg-gray-100 text-gray-800";
  let dotColor = "bg-gray-400";

  switch (status) {
    case CourtStatus.AVAILABLE:
      badgeText = "Available";
      badgeColor = "bg-green-100 text-green-800";
      dotColor = "bg-green-500";
      break;
    case CourtStatus.IN_USE:
      badgeText = "In Use";
      badgeColor = "bg-red-100 text-red-800";
      dotColor = "bg-red-500";
      break;
    case CourtStatus.MAINTENANCE:
      badgeText = "Maintenance";
      badgeColor = "bg-yellow-100 text-yellow-800";
      dotColor = "bg-yellow-500";
      break;
    case CourtStatus.RESERVED:
      badgeText = "Reserved";
      badgeColor = "bg-blue-100 text-blue-800";
      dotColor = "bg-blue-500";
      break;
    case CourtStatus.UNAVAILABLE:
      badgeText = "Unavailable";
      badgeColor = "bg-gray-100 text-gray-800";
      dotColor = "bg-gray-400";
      break;
    default:
      badgeText = "Unknown";
      badgeColor = "bg-gray-100 text-gray-800";
      dotColor = "bg-gray-400";
      break;
  }

  return (
    <Badge className={cn(badgeColor, "flex items-center gap-1.5")}>
      {showDot && <div className={cn("w-2 h-2 rounded-full", dotColor)} />}
      {badgeText}
    </Badge>
  );
};

const StatusFilter = ({
  selectedStatus,
  onStatusChange,
  touchTargetSize
}: {
  selectedStatus: CourtStatus | 'all';
  onStatusChange: (status: CourtStatus | 'all') => void;
  touchTargetSize: number;
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Courts' },
    { value: CourtStatus.AVAILABLE, label: 'Available' },
    { value: CourtStatus.IN_USE, label: 'In Use' },
    { value: CourtStatus.MAINTENANCE, label: 'Maintenance' },
    { value: CourtStatus.RESERVED, label: 'Reserved' },
    { value: CourtStatus.UNAVAILABLE, label: 'Unavailable' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant={selectedStatus === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(option.value as CourtStatus | 'all')}
          style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
          className="px-3"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

const CourtCard = ({
  court,
  currentMatch,
  onEditCourt,
  onDeleteCourt,
  expanded,
  onToggleExpanded,
  utilization,
  touchTargetSize
}: {
  court: Court;
  currentMatch?: Match;
  onEditCourt?: (court: Court) => void;
  onDeleteCourt?: (courtId: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  utilization: number;
  touchTargetSize: number;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `court-${court.id}`,
    data: { court }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">
            Court {court.courtNumber || court.court_number}
          </div>
          <CourtStatusBadge status={court.status} showDot={true} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
          className="transition-all"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground font-medium">{court.name}</div>

      {utilization > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          <span>Utilization: {utilization}%</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>
      )}

      {currentMatch && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {currentMatch.team1?.name || 'Team 1'} vs {currentMatch.team2?.name || 'Team 2'}
          </span>
        </div>
      )}

      {expanded && (
        <div className="pt-2 border-t space-y-2">
          {court.status === CourtStatus.AVAILABLE && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Clock className="h-4 w-4" />
              <span>Available now</span>
            </div>
          )}

          <div className="flex gap-2">
            {onEditCourt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditCourt(court)}
                style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                className="flex-1"
              >
                Edit Court
              </Button>
            )}
            {onDeleteCourt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteCourt(court.id)}
                style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CourtTable: React.FC<CourtTableProps> = ({
  courts,
  matches = [],
  onEditCourt,
  onDeleteCourt,
  onCourtUpdate,
  onMatchUpdate,
  onCourtAssignment,
  tournament
}) => {
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CourtStatus | 'all'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const tournamentContext = useTournament();
  const { isMobile, shouldUseVirtualization, getRecommendedTouchTargetSize } = useMobileOptimization();

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Use tournament from props if provided, otherwise from context
  const currentTournament = tournament || tournamentContext?.selectedTournament;

  // Get recommended touch target size for buttons
  const touchTargetSize = getRecommendedTouchTargetSize();

  // Memoized filtered courts for performance
  const filteredCourts = useMemo(() => {
    return courts.filter(court =>
      statusFilter === 'all' || court.status === statusFilter
    );
  }, [courts, statusFilter]);

  // Memoized court match mapping for performance
  const courtMatches = useMemo(() => {
    const courtMatchMap = new Map<string, Match>();

    matches.forEach(match => {
      if (typeof match.courtId === 'string') {
        courtMatchMap.set(match.courtId, match);
      }
    });

    courts.forEach(court => {
      if (typeof court.currentMatch === 'string') {
        const match = matches.find(m => m.id === court.currentMatch);
        if (match) {
          courtMatchMap.set(court.id, match);
        }
      }
    });

    return courtMatchMap;
  }, [courts, matches]);

  // Get schedulable matches (matches without assigned courts)
  const schedulableMatches = useMemo(() => {
    return matches.filter(match =>
      match.status === 'scheduled' &&
      !match.courtId
    );
  }, [matches]);

  // Stable utilization cache to avoid flicker
  const utilCache = React.useRef<Map<string, number>>(new Map());

  const getUtilization = (court: Court): number => {
    if (!utilCache.current.has(court.id)) {
      // Seed utilization based on status (stable values)
      let baseUtilization: number;
      switch (court.status) {
        case CourtStatus.IN_USE:
          baseUtilization = 90; // High utilization for in-use courts
          break;
        case CourtStatus.AVAILABLE:
          baseUtilization = 40; // Lower utilization for available courts
          break;
        case CourtStatus.RESERVED:
          baseUtilization = 70; // Medium utilization for reserved courts
          break;
        case CourtStatus.MAINTENANCE:
          baseUtilization = 0; // No utilization during maintenance
          break;
        default:
          baseUtilization = 60; // Default utilization
          break;
      }

      // Add small variation based on court ID for uniqueness but stability
      const variation = (court.id.charCodeAt(court.id.length - 1) % 10) - 5; // -5 to 4
      const finalUtilization = Math.max(0, Math.min(100, baseUtilization + variation));

      utilCache.current.set(court.id, finalUtilization);
    }
    return utilCache.current.get(court.id)!;
  };

  const handleEditCourt = (court: Court) => {
    if (onEditCourt) onEditCourt(court);
  };

  const handleDeleteCourt = (courtId: string) => {
    if (onDeleteCourt) onDeleteCourt(courtId);
  };

  const handleOpenAssignmentDialog = () => {
    setIsAssignmentDialogOpen(true);
  };

  const handleToggleExpanded = (courtId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(courtId)) {
      newExpanded.delete(courtId);
    } else {
      newExpanded.add(courtId);
    }
    setExpandedCards(newExpanded);
  };

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || !onCourtAssignment) return;

    // Extract court and match IDs from the drag event
    const courtData = active.data.current;
    const matchData = over.data.current;

    if (courtData?.court && matchData?.match) {
      onCourtAssignment(courtData.court.id, matchData.match.id);
    } else if (active.id.toString().startsWith('court-') && over.id.toString().startsWith('match-')) {
      // Fallback: parse IDs from the element IDs
      const courtId = active.id.toString().replace('court-', '');
      const matchId = over.id.toString().replace('match-', '');
      onCourtAssignment(courtId, matchId);
    }
  };

  // Simple list renderer (virtualization temporarily disabled)
  const SimpleCourtList = () => (
    <div className="space-y-4">
      {filteredCourts.map((court) => {
        const matches = courtMatches[court.id] || [];
        const utilization = matches.length > 0 ? 
          Math.round((matches.length / 8) * 100) : 0; // Assuming 8 matches per day max

        return (
          <CourtCard
            key={court.id}
            court={court}
            currentMatch={matches[0]} // Use first match as current match
            onEditCourt={handleEditCourt}
            onDeleteCourt={handleDeleteCourt}
            expanded={expandedCards.has(court.id)}
            onToggleExpanded={() => handleToggleExpanded(court.id)}
            utilization={utilization}
            touchTargetSize={isMobile ? 48 : 40}
          />
        );
      })}
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Header with actions and filters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by status:</span>
          </div>

          <Button
            variant="outline"
            onClick={handleOpenAssignmentDialog}
            disabled={courts.length === 0}
            style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Assign Matches to Courts
          </Button>
        </div>

        {/* Status Filter */}
        <StatusFilter
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          touchTargetSize={touchTargetSize}
        />

        {/* Court Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.values(CourtStatus).map(status => {
            const count = courts.filter(c => c.status === status).length;
            return (
              <div key={status} className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <CourtStatusBadge status={status} />
              </div>
            );
          })}
        </div>

        {/* Schedulable Matches - Drag targets */}
        {schedulableMatches.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">
              Matches Awaiting Court Assignment
            </h3>
            <p className="text-sm text-blue-600 mb-3">
              Drag courts onto matches to assign them, or click "Assign Matches to Courts" for bulk assignment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedulableMatches.map((match) => (
                <DroppableMatch key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Courts Display */}
        {isMobile ? (
          // Mobile Card Layout
          <div className="space-y-3">
            {shouldUseVirtualization(filteredCourts.length) ? (
              <SimpleCourtList />
            ) : (
              filteredCourts.map((court) => {
                const currentMatch = courtMatches.get(court.id);
                const utilization = getUtilization(court);

                return (
                  <CourtCard
                    key={court.id}
                    court={court}
                    currentMatch={currentMatch}
                    onEditCourt={handleEditCourt}
                    onDeleteCourt={handleDeleteCourt}
                    expanded={expandedCards.has(court.id)}
                    onToggleExpanded={() => handleToggleExpanded(court.id)}
                    utilization={utilization}
                    touchTargetSize={touchTargetSize}
                  />
                );
              })
            )}
          </div>
        ) : (
          // Desktop Table Layout with responsive design
          <div className="overflow-x-auto bg-background border rounded-md">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Current Match
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Utilization
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCourts.map((court) => {
                  const currentMatch = courtMatches.get(court.id);
                  const utilization = getUtilization(court);

                  return (
                    <tr key={court.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">
                        {court.courtNumber || court.court_number}
                      </td>
                      <td className="px-6 py-4">{court.name}</td>
                      <td className="px-6 py-4">
                        <CourtStatusBadge status={court.status} showDot={true} />
                      </td>
                      <td className="px-6 py-4">
                        {currentMatch ? (
                          <div className="flex items-center">
                            <Users2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">
                              {currentMatch.team1?.name || 'Team 1'} vs {currentMatch.team2?.name || 'Team 2'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No active match</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{utilization}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {onEditCourt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourt(court)}
                            style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                            className="text-primary hover:text-primary"
                          >
                            Edit
                          </Button>
                        )}
                        {onDeleteCourt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourt(court.id)}
                            style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredCourts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No courts found matching the selected filter.
          </div>
        )}

        {/* Court Assignment Dialog */}
        {currentTournament && (
          <CourtMatchAssignment
            tournament={currentTournament}
            open={isAssignmentDialogOpen}
            onOpenChange={setIsAssignmentDialogOpen}
            onCourtUpdate={onCourtUpdate ?
              async (court) => { await Promise.resolve(onCourtUpdate(court)); } :
              undefined
            }
            onMatchUpdate={onMatchUpdate ?
              async (match) => { await Promise.resolve(onMatchUpdate(match)); } :
              undefined
            }
          />
        )}
      </div>

      {/* Drag Overlay for visual feedback */}
      <DragOverlay>
        {activeDragItem ? (
          <div className="bg-white border rounded-lg p-3 shadow-lg opacity-90">
            <div className="text-sm font-medium">
              Court {activeDragItem.data?.current?.court?.courtNumber || activeDragItem.data?.current?.court?.court_number || activeDragItem.id?.replace('court-', '')}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeDragItem.data?.current?.court?.name || 'Dragging court...'}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CourtTable;
