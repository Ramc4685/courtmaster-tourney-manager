import React, { useState } from 'react';
import { Court, Match, Tournament } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleCourtTable } from './SimpleCourtTable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CourtStatus } from '@/types/tournament-enums';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Users, AlertTriangle } from 'lucide-react';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface CourtMatchAssignmentProps {
  tournament: Tournament;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourtUpdate?: (court: Court) => Promise<void>;
  onMatchUpdate?: (match: Match) => Promise<void>;
}

export const CourtMatchAssignment: React.FC<CourtMatchAssignmentProps> = ({
  tournament,
  open,
  onOpenChange,
  onCourtUpdate,
  onMatchUpdate
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('drag-drop');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { courts, matches, updateCourt, updateMatch } = useTournament();

  // Helper to get available courts
  const getAvailableCourts = (): Court[] => {
    return courts.filter(court => 
      court.status === CourtStatus.AVAILABLE || 
      court.status === CourtStatus.OCCUPIED
    );
  };

  // Helper to get unassigned matches
  const getUnassignedMatches = (): Match[] => {
    return matches.filter(match => !match.courtId && !match.completed);
  };

  // Helper to get matches that need scheduling
  const getNeedSchedulingMatches = (): Match[] => {
    return matches.filter(match => !match.startTime && !match.completed);
  };

  // Update a court
  const handleCourtUpdate = async (court: Court): Promise<void> => {
    try {
      setIsUpdating(true);
      if (onCourtUpdate) {
        await onCourtUpdate(court);
      } else if (updateCourt) {
        await updateCourt(court);
      }
    } catch (error) {
      console.error('Failed to update court:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update a match
  const handleMatchUpdate = async (match: Match): Promise<void> => {
    try {
      setIsUpdating(true);
      if (onMatchUpdate) {
        await onMatchUpdate(match);
      } else if (updateMatch) {
        await updateMatch(match);
      }
    } catch (error) {
      console.error('Failed to update match:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Clear a court (remove match assignment)
  const handleClearCourt = async (courtId: string): Promise<void> => {
    try {
      setIsUpdating(true);
      
      // Find the court
      const court = courts.find(c => c.id === courtId);
      if (!court) return;
      
      // Find the match assigned to this court
      const match = matches.find(m => m.id === court.currentMatchId);
      
      // Update the court
      const updatedCourt = {
        ...court,
        currentMatchId: null,
        status: CourtStatus.AVAILABLE
      };
      
      // Update the match if it exists
      if (match) {
        const updatedMatch = {
          ...match,
          courtId: null
        };
        
        await handleMatchUpdate(updatedMatch);
      }
      
      await handleCourtUpdate(updatedCourt);
    } catch (error) {
      console.error('Failed to clear court:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Manual court assignment
  const handleManualAssign = async (matchId: string, courtId: string): Promise<void> => {
    try {
      setIsUpdating(true);
      
      // Find the match and court
      const match = matches.find(m => m.id === matchId);
      const court = courts.find(c => c.id === courtId);
      
      if (!match || !court) return;
      
      // Update the match
      const updatedMatch = {
        ...match,
        courtId: court.id,
        startTime: match.startTime || new Date().toISOString(),
      };
      
      // Update the court
      const updatedCourt = {
        ...court,
        currentMatchId: match.id,
        status: CourtStatus.OCCUPIED
      };
      
      await Promise.all([
        handleMatchUpdate(updatedMatch),
        handleCourtUpdate(updatedCourt)
      ]);
    } catch (error) {
      console.error('Failed to assign match to court:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Court & Match Assignment</DialogTitle>
          <DialogDescription>
            Assign matches to courts using drag and drop or manual selection
          </DialogDescription>
        </DialogHeader>
        
        <Tabs
          defaultValue="drag-drop"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="flex-grow flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 w-[400px] mx-auto">
            <TabsTrigger value="drag-drop">Drag & Drop</TabsTrigger>
            <TabsTrigger value="manual">Manual Assignment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drag-drop" className="flex-grow overflow-auto">
            {getAvailableCourts().length === 0 ? (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Available Courts</AlertTitle>
                <AlertDescription>
                  There are no available courts for assignment. Make sure courts are added and set to Available status.
                </AlertDescription>
              </Alert>
            ) : getUnassignedMatches().length === 0 ? (
              <Alert className="mb-4">
                <AlertTitle>No Unassigned Matches</AlertTitle>
                <AlertDescription>
                  All matches have been assigned to courts.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="pr-4">
                <DraggableCourtTable 
                  courts={getAvailableCourts()}
                  matches={matches}
                  onCourtUpdate={handleCourtUpdate}
                  onMatchUpdate={handleMatchUpdate}
                  onClearCourt={handleClearCourt}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="flex-grow overflow-auto">
            <div className="space-y-6 pr-4">
              <div className="grid gap-6">
                {getNeedSchedulingMatches().map(match => (
                  <div key={match.id} className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="font-medium">
                        {match.teams.map(team => team.name).join(' vs. ')}
                      </h3>
                      <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="mr-1 h-4 w-4" />
                          {match.teams.length} teams
                        </div>
                        {match.startTime && (
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {formatDistanceToNow(new Date(match.startTime), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`court-${match.id}`}>Assign Court</Label>
                        <Select
                          onValueChange={(courtId) => handleManualAssign(match.id, courtId)}
                          value={match.courtId || ''}
                        >
                          <SelectTrigger id={`court-${match.id}`}>
                            <SelectValue placeholder="Select a court" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {getAvailableCourts().map(court => (
                                <SelectItem key={court.id} value={court.id}>
                                  {court.name} {court.status === CourtStatus.OCCUPIED ? '(Occupied)' : ''}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {match.courtId && (
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleClearCourt(match.courtId as string)}
                          >
                            Remove Assignment
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {getNeedSchedulingMatches().length === 0 && (
                  <div className="text-center p-6 border rounded-lg">
                    <p>All matches have been scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourtMatchAssignment;
