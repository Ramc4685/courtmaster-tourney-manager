import React, { useState, useEffect, useMemo } from 'react';
import { Match, Court } from '@/types/entities';
import { matchService, courtService, notificationService, emailService, profileService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from 'date-fns';
import { CalendarIcon, ClockIcon, Edit } from 'lucide-react';

interface MatchSchedulerProps {
  tournamentId: string;
}

interface EditableMatch extends Match {
  // Helper fields for editing time/date separately
  editDate?: string; 
  editTime?: string;
}

export const MatchScheduler: React.FC<MatchSchedulerProps> = ({ tournamentId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<EditableMatch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // --- Fetch Data ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedMatches, fetchedCourts] = await Promise.all([
        matchService.listMatches({ tournament_id: tournamentId }),
        courtService.listCourts(tournamentId)
      ]);
      setMatches(fetchedMatches);
      setCourts(fetchedCourts);
    } catch (err) {
      console.error("Failed to fetch matches or courts:", err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule data');
      toast({ variant: "destructive", title: "Error", description: "Could not load schedule data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  // --- Edit Logic ---
  const handleEditClick = (match: Match) => {
    // Pre-populate edit fields from scheduled_time
    const scheduled = match.scheduled_time ? parseISO(match.scheduled_time) : null;
    setEditingMatch({
      ...match,
      editDate: scheduled ? format(scheduled, 'yyyy-MM-dd') : '',
      editTime: scheduled ? format(scheduled, 'HH:mm') : '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingMatch(null); // Clear editing state
  };

  const handleEditInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingMatch) return;
    const { name, value } = event.target;
    setEditingMatch({ ...editingMatch, [name]: value });
  };

  const handleSaveEdit = async () => {
    if (!editingMatch) return;

    let newScheduledTime: string | null = null;
    if (editingMatch.editDate && editingMatch.editTime) {
      try {
        newScheduledTime = new Date(`${editingMatch.editDate}T${editingMatch.editTime}:00`).toISOString();
      } catch (e) {
        toast({ variant: "destructive", title: "Invalid Date/Time", description: "Please enter a valid date and time." });
        return;
      }
    }
    
    const oldScheduledTime = editingMatch.scheduled_time;
    const oldCourtId = editingMatch.court_id;

    try {
      const updatePayload: Partial<Match> = {
        scheduled_time: newScheduledTime,
        court_id: editingMatch.court_id || null,
      };
      // Save the update
      const updatedMatch = await matchService.updateMatch(editingMatch.id, updatePayload);
      toast({ title: "Success", description: "Match schedule updated." });
      handleEditDialogClose();
      fetchData(); // Refresh list

      // --- Send Notifications --- 
      const hasTimeChanged = newScheduledTime !== oldScheduledTime;
      const hasCourtChanged = updatedMatch.court_id !== oldCourtId;
      const courtAssigned = !!updatedMatch.court_id;
      const timeAssigned = !!newScheduledTime;
      
      // Send notification if time or court was assigned/changed
      if ((hasTimeChanged || hasCourtChanged) && courtAssigned && timeAssigned) {
         // Get participant IDs (simplified, assumes player IDs are available or teams can be resolved)
         const participantIds = [
            updatedMatch.player1_id,
            updatedMatch.player2_id,
            // TODO: Resolve team members if team IDs are present
            // updatedMatch.team1_id -> resolve members -> get user IDs
            // updatedMatch.team2_id -> resolve members -> get user IDs
         ].filter(id => !!id) as string[];

         if (participantIds.length > 0) {
            const courtName = courts.find(c => c.id === updatedMatch.court_id)?.name || 'Unknown Court';
            const scheduledTimeFormatted = format(parseISO(newScheduledTime!), 'Pp'); // Use non-null assertion as timeAssigned is true
            
            // Construct message based on what changed
            let message = `Match Update (${updatedMatch.round_number}-${updatedMatch.match_number}): Scheduled for ${scheduledTimeFormatted} on ${courtName}.`;
            let title = 'Match Scheduled';
            if (hasTimeChanged && !hasCourtChanged) {
                message = `Match Time Update (${updatedMatch.round_number}-${updatedMatch.match_number}): Now scheduled for ${scheduledTimeFormatted} on ${courtName}.`;
                title = 'Match Time Updated';
            } else if (!hasTimeChanged && hasCourtChanged) {
                message = `Court Assignment Update (${updatedMatch.round_number}-${updatedMatch.match_number}): Assigned to ${courtName} at ${scheduledTimeFormatted}.`;
                title = 'Court Assigned';
            } else { // Both changed or initially assigned
                 message = `Match Scheduled (${updatedMatch.round_number}-${updatedMatch.match_number}): You are scheduled for ${scheduledTimeFormatted} on ${courtName}.`;
                 title = 'Match Scheduled';
            }
            
            // Send notifications (In-App and Email based on prefs)
            for (const userId of participantIds) {
              // 1. In-App Notification
              notificationService.createNotification({
                 user_id: userId,
                 title: title,
                 message: message,
                 type: 'match_schedule_update',
                 read: false,
              }).catch(err => console.error(`Failed to create in-app notification for ${userId}:`, err));

              // 2. Email Notification (check preferences)
              profileService.getProfile(userId).then(profile => {
                 if (profile?.preferences?.notifications?.match_reminders && profile.email) {
                    emailService.sendEmail({
                       to: profile.email,
                       subject: title,
                       html: `<p>${message}</p>` // Basic HTML
                    }).catch(err => console.error(`Failed to send schedule email to ${profile.email}:`, err));
                 } else {
                    console.log(`Email notifications disabled or no email for user ${userId}`);
                 }
              }).catch(err => console.error(`Failed to get profile for ${userId} for email notification:`, err));
            }
         }
      }
      // --- End Notifications ---

    } catch (err) {
      console.error("Failed to update match schedule:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not update schedule." });
    }
  };
  
   const availableCourts = useMemo(() => courts.filter(c => c.status === 'AVAILABLE'), [courts]);

  // --- Render Logic ---
  if (isLoading) return <div>Loading matches...</div>;
  // Don't block rendering if error occurred during fetch
  // if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Manual Match Scheduling</h3>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {/* TODO: Add Filtering/Sorting Controls */} 
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Round</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Time</TableHead>
              <TableHead>Court</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No matches generated yet.</TableCell>
              </TableRow>
            )}
            {matches.sort((a,b) => a.round_number - b.round_number || a.match_number - b.match_number).map((match) => (
              <TableRow key={match.id}>
                <TableCell>{match.round_number}</TableCell>
                <TableCell>{match.match_number}</TableCell>
                <TableCell>
                  {/* TODO: Display player/team names based on IDs */}
                  P1: {match.player1_id || match.team1_id || 'TBD'} <br />
                  P2: {match.player2_id || match.team2_id || 'TBD'}
                </TableCell>
                <TableCell>{match.status}</TableCell>
                <TableCell>
                  {match.scheduled_time ? format(parseISO(match.scheduled_time), 'Pp') : 'Not Scheduled'}
                </TableCell>
                <TableCell>
                   {match.court_id ? courts.find(c => c.id === match.court_id)?.name : 'Not Assigned'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(match)}>
                    <Edit className="mr-1 h-3 w-3" /> Schedule
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Match</DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <div className="space-y-4 py-2">
               {/* Simplified display of participants */}
               <p className="text-sm text-muted-foreground">
                 Match: {editingMatch.round_number}-{editingMatch.match_number} (ID: {editingMatch.id}) <br/>
                 Participants: {editingMatch.player1_id || editingMatch.team1_id || 'TBD'} vs {editingMatch.player2_id || editingMatch.team2_id || 'TBD'}
               </p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <Label htmlFor="editDate">Date</Label>
                   <Input 
                     id="editDate"
                     name="editDate"
                     type="date" 
                     value={editingMatch.editDate}
                     onChange={handleEditInputChange} 
                   />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="editTime">Time</Label>
                   <Input 
                     id="editTime"
                     name="editTime"
                     type="time" 
                     value={editingMatch.editTime}
                     onChange={handleEditInputChange} 
                   />
                 </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="court_id">Court</Label>
                <Select 
                  name="court_id"
                  value={editingMatch.court_id || ''} 
                  onValueChange={(value) => handleEditInputChange({ target: { name: 'court_id', value } } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign Court" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Unassign --</SelectItem>
                    {availableCourts.map(court => (
                      <SelectItem key={court.id} value={court.id}>{court.name} (C{court.court_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleEditDialogClose}>Cancel</Button>
            <Button type="button" onClick={handleSaveEdit}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 