/**
 * Announcement Manager Component for CourtMaster Tournament Management System
 * 
 * Provides an admin interface for creating and managing tournament announcements.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Calendar, Clock, Filter, Send, Volume2, Eye, Users, Wifi } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { NotificationPriority } from '@/services/notification/NotificationService';
import { useToast } from '../../hooks/use-toast';
import { databases, COLLECTIONS, APPWRITE_DATABASE_ID } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { useAuth } from '../../contexts/auth/AuthContext';
import { notificationService, TournamentAnnouncement } from '../../services/notificationService';
import { realtimeTournamentService } from '../../services/realtime/RealtimeTournamentService';
import eventBus, { EventType } from '@/events/eventBus';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  createdAt: Date;
  displayStart?: Date;
  displayEnd?: Date;
  targetAudience?: string;
  targetDivisionId?: string;
  isActive: boolean;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
  createdBy?: string;
}

interface AnnouncementFormValues {
  title: string;
  message: string;
  priority: NotificationPriority;
  targetAudience: string;
  targetDivisionId?: string;
  isActive: boolean;
  scheduleAnnouncement: boolean;
  displayStart?: string;
  displayEnd?: string;
  pushNotification: boolean;
  previewMode: boolean;
}

interface Division {
  id: string;
  name: string;
}

interface AnnouncementManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onAnnouncementCreated?: (announcement: Announcement) => void;
  onAnnouncementUpdated?: (announcement: Announcement) => void;
  onAnnouncementDeleted?: (announcementId: string) => void;
}

/**
 * Component for managing tournament announcements
 */
export const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({
  isOpen,
  onClose,
  tournamentId,
  onAnnouncementCreated,
  onAnnouncementUpdated,
  onAnnouncementDeleted
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [formValues, setFormValues] = useState<AnnouncementFormValues>({
    title: '',
    message: '',
    priority: NotificationPriority.NORMAL,
    targetAudience: 'all',
    isActive: true,
    scheduleAnnouncement: false,
    pushNotification: false,
    previewMode: false
  });

  // Filter states
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  // Template states
  const [templates] = useState([
    { id: 'lunch', title: 'Lunch Break', message: 'Tournament will break for lunch at {time}. Play will resume at {resume_time}.' },
    { id: 'weather', title: 'Weather Delay', message: 'Due to weather conditions, matches are temporarily suspended. Updates will follow.' },
    { id: 'results', title: 'Match Results', message: 'Congratulations to {winner} for advancing to the next round!' },
    { id: 'schedule', title: 'Schedule Update', message: 'The {division} matches have been rescheduled to {new_time}.' }
  ]);
  
  // Load announcements on mount
  useEffect(() => {
    fetchAnnouncements();
    fetchDivisions();
  }, [tournamentId]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!formOpen) {
      resetForm();
    }
  }, [formOpen]);
  
  const fetchAnnouncements = async () => {
    setIsLoading(true);

    try {
      // Fetch real announcements from notification service
      const response = await notificationService.getTournamentAnnouncements(tournamentId);

      const fetchedAnnouncements: Announcement[] = response.map((announcement: TournamentAnnouncement) => ({
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        priority: announcement.priority,
        createdBy: announcement.createdBy,
        createdAt: announcement.createdAt,
        displayStart: announcement.displayStart,
        displayEnd: announcement.displayEnd,
        targetAudience: announcement.targetAudience,
        targetDivisionId: announcement.targetDivisionId,
        isActive: announcement.status === 'ACTIVE',
        category: announcement.category,
        status: announcement.status
      }));

      setAnnouncements(fetchedAnnouncements);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setConnectionStatus('disconnected');
      toast({
        title: 'Error',
        description: 'Failed to load announcements. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };
  
  const fetchDivisions = async () => {
    try {
      // In a real implementation, this would fetch from Appwrite
      // For now, we'll use mock data
      const mockDivisions: Division[] = [
        { id: 'div1', name: "Men's Singles" },
        { id: 'div2', name: "Women's Singles" },
        { id: 'div3', name: "Mixed Doubles" }
      ];
      
      setDivisions(mockDivisions);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: keyof AnnouncementFormValues, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'priority' ? (value as NotificationPriority) : value
    }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };

  const formatDateTimeInput = (date?: Date) =>
    date ? new Date(date).toISOString().slice(0, 16) : undefined;

  const resetForm = () => {
    setSelectedAnnouncement(null);
    setFormValues({
      title: '',
      message: '',
      priority: NotificationPriority.NORMAL,
      targetAudience: 'all',
      isActive: true,
      scheduleAnnouncement: false,
      displayStart: undefined,
      displayEnd: undefined,
      pushNotification: false,
      previewMode: false
    });
  };
  
  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    
    // Set form values from announcement
    setFormValues({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience || 'all',
      targetDivisionId: announcement.targetDivisionId,
      isActive: announcement.isActive,
      scheduleAnnouncement: !!(announcement.displayStart || announcement.displayEnd),
      displayStart: formatDateTimeInput(announcement.displayStart),
      displayEnd: formatDateTimeInput(announcement.displayEnd),
      pushNotification: false,
      previewMode: false
    });
    
    setFormOpen(true);
  };
  
  const handlePreviewAnnouncement = () => {
    if (!formValues.title || !formValues.message) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both title and message.',
        variant: 'destructive'
      });
      return;
    }
    setPreviewOpen(true);
  };

  const handleCreateAnnouncement = async () => {
    if (!formValues.title || !formValues.message) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both title and message.',
        variant: 'destructive'
      });
      return;
    }

    setBroadcasting(true);

    try {
      // Create announcement options
      const options = {
        priority: formValues.priority,
        targetAudience: formValues.targetAudience,
        targetDivisionId: formValues.targetDivisionId,
        displayStart: formValues.scheduleAnnouncement && formValues.displayStart
          ? new Date(formValues.displayStart)
          : undefined,
        displayEnd: formValues.scheduleAnnouncement && formValues.displayEnd
          ? new Date(formValues.displayEnd)
          : undefined,
        category: 'tournament'
      };

      // Create announcement directly in database
      const response = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ANNOUNCEMENTS,
        ID.unique(),
        {
          tournament_id: tournamentId,
          title: formValues.title,
          message: formValues.message,
          priority: formValues.priority,
          status: formValues.scheduleAnnouncement ? 'SCHEDULED' : 'ACTIVE',
          target_audience: formValues.targetAudience,
          target_division_id: formValues.targetDivisionId,
          display_start: options.displayStart?.toISOString(),
          display_end: options.displayEnd?.toISOString(),
          category: options.category,
          created_by: user?.id || 'unknown'
        }
      );

      // Map response to our interface
      const newAnnouncement: Announcement = {
        id: response.$id,
        title: response.title,
        message: response.message,
        priority: response.priority,
        createdBy: response.created_by,
        createdAt: new Date(response.$createdAt),
        targetAudience: response.target_audience,
        targetDivisionId: response.target_division_id,
        isActive: response.status === 'ACTIVE',
        category: response.category,
        status: response.status || 'ACTIVE',
        displayStart: response.display_start ? new Date(response.display_start) : undefined,
        displayEnd: response.display_end ? new Date(response.display_end) : undefined
      };

      // Real-time broadcasting
      await realtimeTournamentService.publishTournamentUpdate(tournamentId, {
        type: 'announcement',
        data: newAnnouncement
      });

      // Emit event for real-time updates
      eventBus.emit(EventType.ANNOUNCEMENT_CREATED, {
        announcementId: newAnnouncement.id,
        tournamentId,
        title: formValues.title,
        message: formValues.message,
        priority: formValues.priority
      });

      // Update local state
      setAnnouncements(prev => [newAnnouncement, ...prev]);

      // Send push notification if requested
      if (formValues.pushNotification) {
        const targetAudience = formValues.targetAudience;
        try {
          await notificationService.sendTournamentAnnouncement(
            tournamentId,
            formValues.title,
            formValues.message
          );
        } catch (pushError) {
          console.warn('Push notification failed:', pushError);
        }
      }

      toast({
        title: 'Success',
        description: 'Announcement created and broadcasted successfully.',
      });

      setFormOpen(false);
      setConnectionStatus('connected');

      if (onAnnouncementCreated) {
        onAnnouncementCreated(newAnnouncement);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setConnectionStatus('disconnected');
      toast({
        title: 'Error',
        description: 'Failed to create announcement. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setBroadcasting(false);
    }
  };
  
  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement) return;
    
    try {
      // In a real implementation, this would update in Appwrite
      // For now, we'll simulate it
      const displayStart = formValues.scheduleAnnouncement && formValues.displayStart
        ? new Date(formValues.displayStart)
        : undefined;
      const displayEnd = formValues.scheduleAnnouncement && formValues.displayEnd
        ? new Date(formValues.displayEnd)
        : undefined;

      const updatedAnnouncement: Announcement = {
        ...selectedAnnouncement,
        title: formValues.title,
        message: formValues.message,
        priority: formValues.priority,
        targetAudience: formValues.targetAudience,
        targetDivisionId: formValues.targetDivisionId,
        isActive: formValues.isActive,
        displayStart,
        displayEnd
      };
      
      setAnnouncements(prev => 
        prev.map(a => a.id === selectedAnnouncement.id ? updatedAnnouncement : a)
      );
      
      toast({
        title: 'Success',
        description: 'Announcement updated successfully.',
      });
      
      setFormOpen(false);
      
      if (onAnnouncementUpdated) {
        onAnnouncementUpdated(updatedAnnouncement);
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    try {
      // In a real implementation, this would delete from Appwrite
      // For now, we'll simulate it
      
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully.',
      });
      
      if (onAnnouncementDeleted) {
        onAnnouncementDeleted(announcementId);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Apply filters to announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    if (filterPriority !== 'all' && announcement.priority !== (filterPriority as NotificationPriority)) {
      return false;
    }

    if (filterStatus === 'active' && !announcement.isActive) {
      return false;
    }

    if (filterStatus === 'inactive' && announcement.isActive) {
      return false;
    }

    return true;
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Tournament Announcements
            <div className="flex items-center gap-1 ml-auto">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <Wifi className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Create New Announcement</h3>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formValues.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formValues.message}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Enter announcement message"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select
                  value={formValues.priority}
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NotificationPriority.LOW}>Low</SelectItem>
                    <SelectItem value={NotificationPriority.NORMAL}>Normal</SelectItem>
                    <SelectItem value={NotificationPriority.HIGH}>High</SelectItem>
                    <SelectItem value={NotificationPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAudience" className="text-right">
                  Target Audience
                </Label>
                <Select
                  value={formValues.targetAudience}
                  onValueChange={(value) => handleSelectChange('targetAudience', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Participants</SelectItem>
                    <SelectItem value="players">Players Only</SelectItem>
                    <SelectItem value="staff">Staff Only</SelectItem>
                    <SelectItem value="division">Specific Division</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formValues.targetAudience === 'division' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="targetDivisionId" className="text-right">
                    Division
                  </Label>
                  <Select
                    value={formValues.targetDivisionId}
                    onValueChange={(value) => handleSelectChange('targetDivisionId', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map(division => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="isActive"
                    checked={formValues.isActive}
                    onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive" className="ml-2">
                    {formValues.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="scheduleAnnouncement" className="text-right">
                  Schedule
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="scheduleAnnouncement"
                    checked={formValues.scheduleAnnouncement}
                    onCheckedChange={(checked) => handleSwitchChange('scheduleAnnouncement', checked)}
                  />
                  <Label htmlFor="scheduleAnnouncement" className="ml-2">
                    Schedule Announcement
                  </Label>
                </div>
              </div>
              
              {formValues.scheduleAnnouncement && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="displayStart" className="text-right">
                      Start Time
                    </Label>
                    <Input
                      id="displayStart"
                      name="displayStart"
                      type="datetime-local"
                      value={formValues.displayStart || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="displayEnd" className="text-right">
                      End Time
                    </Label>
                    <Input
                      id="displayEnd"
                      name="displayEnd"
                      type="datetime-local"
                      value={formValues.displayEnd || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                </>
              )}

              {/* Real-time Broadcasting Options */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pushNotification" className="text-right">
                  Push Notification
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="pushNotification"
                    checked={formValues.pushNotification}
                    onCheckedChange={(checked) => handleSwitchChange('pushNotification', checked)}
                  />
                  <Label htmlFor="pushNotification" className="ml-2">
                    Send push notification to mobile devices
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handlePreviewAnnouncement}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={selectedAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                disabled={broadcasting}
              >
                {broadcasting ? (
                  <>
                    <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {selectedAnnouncement ? 'Update & Broadcast' : 'Create & Broadcast'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manage Announcements</CardTitle>
            <div className="flex space-x-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No announcements found. Create a new announcement to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell>
                        <Badge variant={
                          announcement.priority === 'urgent' ? 'destructive' :
                          announcement.priority === 'high' ? 'default' :
                          announcement.priority === 'normal' ? 'secondary' :
                          'outline'
                        }>
                          {announcement.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{announcement.targetAudience || 'All'}</TableCell>
                      <TableCell>{announcement.createdAt.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={announcement.isActive ? 'default' : 'outline'}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditAnnouncement(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementManager;
