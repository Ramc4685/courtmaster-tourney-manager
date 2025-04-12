
import React, { useState, useEffect } from 'react';
import { Court, CourtStatus } from '@/types/entities'; // Use the entity type
import { courtService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface CourtConfigurationProps {
  tournamentId: string;
}

export const CourtConfiguration: React.FC<CourtConfigurationProps> = ({ tournamentId }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // --- Fetch Courts ---
  const fetchCourts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCourts = await courtService.listCourts(tournamentId);
      setCourts(fetchedCourts);
    } catch (err) {
      console.error("Failed to fetch courts:", err);
      setError(err instanceof Error ? err.message : 'Failed to load courts');
      toast({ variant: "destructive", title: "Error", description: "Could not load courts." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchCourts();
    }
  }, [tournamentId]);

  // --- Add Court Logic ---
  const handleAddCourt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const court_number_str = formData.get('court_number') as string;

    if (!name || !court_number_str) {
      toast({ variant: "destructive", title: "Error", description: "Court Name and Number are required." });
      return;
    }
    
    const court_number = parseInt(court_number_str, 10);
    if (isNaN(court_number)) {
        toast({ variant: "destructive", title: "Error", description: "Court Number must be a valid number." });
        return;
    }

    try {
      const newCourtData = {
        tournament_id: tournamentId,
        name,
        description: description || null,
        status: CourtStatus.AVAILABLE, // Use enum value
        number: court_number, // Use 'number' property
        court_number, // Keep for backward compatibility
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await courtService.createCourt(newCourtData);
      toast({ title: "Success", description: "Court added successfully." });
      setIsAddDialogOpen(false);
      fetchCourts(); // Refresh list
    } catch (err) {
      console.error("Failed to add court:", err);
      setError(err instanceof Error ? err.message : 'Failed to add court');
      toast({ variant: "destructive", title: "Error", description: "Could not add court." });
    }
  };

  // --- Edit Court Logic ---
  const handleEditCourt = (court: Court) => {
    setEditingCourt({ ...court }); // Clone court to edit
  };

  const handleCancelEdit = () => {
    setEditingCourt(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCourt) return;
    try {
      // Ensure status is a valid CourtStatus
      const status = editingCourt.status as CourtStatus;

      // Only pass fields that can be updated
      const updateData: Partial<Omit<Court, "id" | "createdAt" | "updatedAt">> = {
         name: editingCourt.name,
         description: editingCourt.description,
         status: status,
         number: editingCourt.number || editingCourt.court_number, // Use number field
         court_number: editingCourt.court_number, // Keep for compatibility
         tournament_id: editingCourt.tournament_id
      };
      await courtService.updateCourt(editingCourt.id, updateData);
      toast({ title: "Success", description: "Court updated successfully." });
      setEditingCourt(null);
      fetchCourts(); // Refresh list
    } catch (err) {
      console.error("Failed to update court:", err);
      setError(err instanceof Error ? err.message : 'Failed to update court');
      toast({ variant: "destructive", title: "Error", description: "Could not update court." });
    }
  };

  const handleEditInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingCourt) return;
    const { name, value } = event.target;
    setEditingCourt({ ...editingCourt, [name]: value });
  };

  const handleEditStatusChange = (newStatus: CourtStatus) => {
     if (!editingCourt) return;
     setEditingCourt({ ...editingCourt, status: newStatus });
  }

  // --- Delete Court Logic ---
  const handleDeleteCourt = async (courtId: string) => {
    if (!window.confirm('Are you sure you want to delete this court? This action cannot be undone.')) {
      return;
    }
    try {
      await courtService.deleteCourt(courtId);
      toast({ title: "Success", description: "Court deleted successfully." });
      fetchCourts(); // Refresh list
    } catch (err) {
      console.error("Failed to delete court:", err);
      setError(err instanceof Error ? err.message : 'Failed to delete court');
      toast({ variant: "destructive", title: "Error", description: "Could not delete court." });
    }
  };

  // --- Render Logic ---
  if (isLoading) return <div>Loading courts...</div>;
  // Keep displaying table even if there's an error adding/editing/deleting
  // if (error) return <div className="text-red-500">Error: {error}</div>; 

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Court Configuration</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Court
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Court</DialogTitle>
              <DialogDescription>
Enter the details for the new court.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCourt} className="space-y-4">
               <div>
                 <Label htmlFor="court_number">Court Number <span className="text-red-500">*</span></Label>
                 <Input id="court_number" name="court_number" type="number" required />
               </div>
              <div>
                <Label htmlFor="name">Court Name <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" />
              </div>
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                 </DialogClose>
                <Button type="submit">Add Court</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
       {error && <div className="text-red-500">Error: {error}</div>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No courts configured yet.</TableCell>
              </TableRow>
            )}
            {courts.map((court) => (
              <TableRow key={court.id}>
                {editingCourt?.id === court.id ? (
                  <>
                    {/* Edit Mode */}
                    <TableCell>
                       <Input 
                          type="number" 
                          name="court_number" 
                          value={editingCourt.court_number}
                          onChange={handleEditInputChange} 
                          className="h-8"
                       />
                    </TableCell>
                    <TableCell>
                      <Input 
                        name="name" 
                        value={editingCourt.name}
                        onChange={handleEditInputChange} 
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                       <Textarea 
                          name="description" 
                          value={editingCourt.description || ''} 
                          onChange={handleEditInputChange} 
                          className="h-8 text-sm" // Adjust height and text size
                          rows={1}
                       />
                    </TableCell>
                    <TableCell>
                       <Select 
                         value={editingCourt.status} 
                         onValueChange={(value) => handleEditStatusChange(value as CourtStatus)}
                       >
                         <SelectTrigger className="h-8">
                           <SelectValue placeholder="Status" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value={CourtStatus.AVAILABLE}>Available</SelectItem>
                           <SelectItem value={CourtStatus.IN_USE}>In Use</SelectItem>
                           <SelectItem value={CourtStatus.MAINTENANCE}>Maintenance</SelectItem>
                           <SelectItem value={CourtStatus.RESERVED}>Reserved</SelectItem>
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="h-8 w-8 mr-1">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <TableCell>{court.court_number}</TableCell>
                    <TableCell>{court.name}</TableCell>
                    <TableCell>{court.description || '-'}</TableCell>
                    <TableCell>{court.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditCourt(court)} className="h-8 w-8 mr-1">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteCourt(court.id)} className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
