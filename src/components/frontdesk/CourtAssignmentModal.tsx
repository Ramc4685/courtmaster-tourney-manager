import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Wrench,
  Play,
  Square,
  ArrowRightLeft
} from 'lucide-react';
import { courtService, CourtAssignmentError } from '../../services/tournament/CourtService';
import { matchService } from '../../services/tournament/MatchService';
import { tournamentService } from '../../services/tournament/TournamentService';
import eventBus, { EventType } from '@/events/eventBus';
import { Court, Match, Tournament } from '../../types/entities';

interface CourtAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

interface CourtWithStatus extends Court {
  currentMatch?: Match;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  lastActivity?: Date;
}

interface PendingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  scheduledTime?: Date;
  category: string;
  estimatedDuration: number;
  priority: 'high' | 'normal' | 'low';
}

export const CourtAssignmentModal: React.FC<CourtAssignmentModalProps> = ({
  isOpen,
  onClose,
  tournamentId
}) => {
  const [courts, setCourts] = useState<CourtWithStatus[]>([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<CourtWithStatus | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<PendingMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draggedMatch, setDraggedMatch] = useState<PendingMatch | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tournament, scheduledMatches, activeMatches] = await Promise.all([
        tournamentService.getTournament(tournamentId),
        matchService.getMatchesByStatus(tournamentId, 'SCHEDULED'),
        matchService.getMatchesByStatus(tournamentId, 'IN_PROGRESS')
      ]);

      // Process courts with current status
      const courtsWithStatus: CourtWithStatus[] = (tournament?.courts || []).map(court => {
        const activeMatch = activeMatches.find(match => match.courtId === court.id);
        return {
          ...court,
          currentMatch: activeMatch,
          status: activeMatch ? 'IN_USE' : (court.status as any) || 'AVAILABLE',
          lastActivity: activeMatch?.startTime
        };
      });

      // Process pending matches (scheduled matches without court assignment)
      const pending: PendingMatch[] = scheduledMatches
        .filter(match => !match.courtId)
        .map(match => {
          const isPriority = match.scheduledTime &&
            Math.abs(match.scheduledTime.getTime() - Date.now()) < 3600000; // Within 1 hour

          return {
            id: match.id,
            homeTeam: match.homeTeam?.name || 'TBD',
            awayTeam: match.awayTeam?.name || 'TBD',
            scheduledTime: match.scheduledTime,
            category: match.category || 'General',
            estimatedDuration: match.estimatedDuration || 45,
            priority: isPriority ? 'high' : 'normal'
          };
        })
        .sort((a, b) => {
          // Sort by priority first, then by scheduled time
          if (a.priority !== b.priority) {
            return a.priority === 'high' ? -1 : 1;
          }
          return (a.scheduledTime?.getTime() || 0) - (b.scheduledTime?.getTime() || 0);
        });

      setCourts(courtsWithStatus);
      setPendingMatches(pending);
    } catch (err) {
      console.error('Error loading court assignment data:', err);
      setError('Failed to load court and match data');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  const assignMatchToCourt = async (matchId: string, courtId: string) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await courtService.assignCourt(tournamentId, matchId, courtId);

      // Emit event for real-time updates
      eventBus.emit(EventType.COURT_ASSIGNED, {
        matchId,
        courtId,
        tournamentId
      });

      setSuccess('Match assigned to court successfully!');

      // Reload data to reflect changes
      await loadData();

      // Clear selections
      setSelectedCourt(null);
      setSelectedMatch(null);
    } catch (err) {
      console.error('Error assigning court:', err);
      if (err instanceof CourtAssignmentError) {
        switch (err.code) {
          case 'MATCH_ALREADY_ASSIGNED':
            setError('This match is already assigned to another court. Release it before reassigning.');
            break;
          case 'COURT_IN_MAINTENANCE':
            setError('Selected court is under maintenance. Choose a different court.');
            break;
          case 'COURT_IN_USE':
            setError('Selected court is currently in use. Please select an available court.');
            break;
          default:
            setError(err.message || 'Failed to assign court. Please try again.');
        }
      } else {
        setError('Failed to assign court. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const releaseCourtAssignment = async (courtId: string) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const court = courts.find(c => c.id === courtId);
      if (court?.currentMatch) {
        await courtService.releaseCourt(tournamentId, court.currentMatch.id);

        // Emit event for real-time updates
        eventBus.emit(EventType.COURT_RELEASED, {
          matchId: court.currentMatch.id,
          courtId,
          tournamentId
        });

        setSuccess('Court released successfully!');
        await loadData();
      }
    } catch (err) {
      console.error('Error releasing court:', err);
      if (err instanceof CourtAssignmentError) {
        setError(err.message || 'Failed to release court. Please try again.');
      } else {
        setError('Failed to release court. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const updateCourtStatus = async (courtId: string, status: 'AVAILABLE' | 'MAINTENANCE') => {
    setActionLoading(true);
    setError(null);

    try {
      // This would typically update court status in the service
      // For now, we'll just emit an event and reload
      eventBus.emit(EventType.COURT_STATUS_UPDATED, {
        courtId,
        status,
        tournamentId
      });

      await loadData();
      setSuccess(`Court status updated to ${status.toLowerCase()}`);
    } catch (err) {
      console.error('Error updating court status:', err);
      setError('Failed to update court status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickAssign = async () => {
    if (!selectedMatch || !selectedCourt) return;
    await assignMatchToCourt(selectedMatch.id, selectedCourt.id);
  };

  const handleAutoAssign = async () => {
    setActionLoading(true);
    setError(null);

    try {
      // Auto-assign available matches to available courts
      const availableCourts = courts.filter(court => court.status === 'AVAILABLE');
      const matches = pendingMatches.slice(0, availableCourts.length);

      for (let i = 0; i < matches.length; i++) {
        await courtService.assignCourt(tournamentId, matches[i].id, availableCourts[i].id);
      }

      setSuccess(`Auto-assigned ${matches.length} matches to courts`);
      await loadData();
    } catch (err) {
      console.error('Error with auto-assignment:', err);
      setError('Failed to auto-assign courts');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getCourtStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'IN_USE':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getMatchPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Drag and drop handlers
  const handleDragStart = (match: PendingMatch) => {
    setDraggedMatch(match);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, court: CourtWithStatus) => {
    e.preventDefault();
    if (draggedMatch && court.status === 'AVAILABLE') {
      await assignMatchToCourt(draggedMatch.id, court.id);
    }
    setDraggedMatch(null);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Reset state when modal closes
      setSelectedCourt(null);
      setSelectedMatch(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, loadData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Court Assignment
          </DialogTitle>
          <DialogDescription>
            Assign scheduled matches to available courts or manage court status.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Assignment Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>Select Match</Label>
                <Select
                  value={selectedMatch?.id || ''}
                  onValueChange={(value) => {
                    const match = pendingMatches.find(m => m.id === value);
                    setSelectedMatch(match || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a match to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingMatches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.homeTeam} vs {match.awayTeam}
                        {match.scheduledTime && ` • ${formatTime(match.scheduledTime)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Court</Label>
                <Select
                  value={selectedCourt?.id || ''}
                  onValueChange={(value) => {
                    const court = courts.find(c => c.id === value);
                    setSelectedCourt(court || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available court..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courts
                      .filter(court => court.status === 'AVAILABLE')
                      .map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleQuickAssign}
                disabled={!selectedMatch || !selectedCourt || actionLoading}
                className="flex items-center gap-2"
              >
                {actionLoading ? <Spinner className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                Assign Selected
              </Button>
              <Button
                variant="outline"
                onClick={handleAutoAssign}
                disabled={pendingMatches.length === 0 || courts.filter(c => c.status === 'AVAILABLE').length === 0 || actionLoading}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Auto Assign
              </Button>
            </div>

            {/* Courts Grid */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Courts ({courts.length})</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => (
                  <div
                    key={court.id}
                    className={`p-4 border-2 rounded-lg transition-colors ${getCourtStatusColor(court.status)} ${
                      court.status === 'AVAILABLE' ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, court)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{court.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {court.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {court.currentMatch && (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">
                          {court.currentMatch.homeTeam?.name} vs {court.currentMatch.awayTeam?.name}
                        </div>
                        <div className="text-xs opacity-75">
                          Started: {court.lastActivity && formatTime(court.lastActivity)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => releaseCourtAssignment(court.id)}
                          disabled={actionLoading}
                          className="w-full mt-2"
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Release Court
                        </Button>
                      </div>
                    )}

                    {court.status === 'AVAILABLE' && (
                      <div className="space-y-2">
                        <div className="text-sm text-green-700">Ready for assignment</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCourtStatus(court.id, 'MAINTENANCE')}
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          Set Maintenance
                        </Button>
                      </div>
                    )}

                    {court.status === 'MAINTENANCE' && (
                      <div className="space-y-2">
                        <div className="text-sm text-yellow-700">Under maintenance</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCourtStatus(court.id, 'AVAILABLE')}
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Available
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Matches */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">
                Pending Matches ({pendingMatches.length})
              </Label>
              {pendingMatches.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No matches waiting for court assignment
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pendingMatches.map((match) => (
                    <div
                      key={match.id}
                      draggable
                      onDragStart={() => handleDragStart(match)}
                      className={`p-3 border-l-4 rounded-lg cursor-move transition-opacity ${getMatchPriorityColor(match.priority)} ${
                        draggedMatch?.id === match.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {match.homeTeam} vs {match.awayTeam}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.category}
                            {match.scheduledTime && ` • Scheduled: ${formatTime(match.scheduledTime)}`}
                            {match.priority === 'high' && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Priority
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ~{match.estimatedDuration}min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={actionLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
