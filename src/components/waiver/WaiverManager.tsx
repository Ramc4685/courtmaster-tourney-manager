/**
 * Waiver Manager Component for CourtMaster Tournament Management System
 * 
 * Provides an interface for tournament organizers to create, edit,
 * and manage digital waiver templates.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Copy, FileText, Eye, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { useToast } from '../../hooks/useToast';
import { useUser } from '../../contexts/auth/useAuth';
import { ID } from 'appwrite';
import { databases, COLLECTIONS } from '../../lib/appwrite';

// Rich text editor would be imported here in a real implementation
// import { RichTextEditor } from '../../components/ui/rich-text-editor';

interface Waiver {
  id: string;
  title: string;
  content: string;
  tournament_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_default: boolean;
  version: number;
  signatures_count?: number;
}

interface WaiverManagerProps {
  tournamentId?: string;
  onWaiverSelected?: (waiver: Waiver) => void;
  canCreateWaiver?: boolean;
}

export const WaiverManager: React.FC<WaiverManagerProps> = ({
  tournamentId,
  onWaiverSelected,
  canCreateWaiver = true
}) => {
  const { toast } = useToast();
  const { user } = useUser();

  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [viewWaiver, setViewWaiver] = useState<Waiver | null>(null);

  // Form state
  const [formValues, setFormValues] = useState({
    title: '',
    content: '',
    is_default: false
  });

  // Fetch waivers on mount
  useEffect(() => {
    fetchWaivers();
  }, [tournamentId]);

  const fetchWaivers = async () => {
    setIsLoading(true);

    try {
      // In a real implementation, this would fetch from Appwrite
      // For now, we'll use mock data
      setTimeout(() => {
        const mockWaivers: Waiver[] = [
          {
            id: '1',
            title: 'Standard Liability Waiver',
            content: `<h2>Standard Liability Waiver</h2>
            <p>By signing this waiver, I acknowledge the risks associated with participation in athletic events...</p>
            <p>I release the tournament organizers, venue operators, and all staff from any liability...</p>`,
            created_by: 'admin',
            created_at: '2023-09-01T10:30:00.000Z',
            updated_at: '2023-09-01T10:30:00.000Z',
            is_active: true,
            is_default: true,
            version: 1,
            signatures_count: 28
          },
          {
            id: '2',
            title: 'Youth Participant Waiver',
            content: `<h2>Youth Participant Waiver</h2>
            <p>This waiver must be signed by a parent or legal guardian of participants under 18 years of age.</p>
            <p>I, the undersigned parent/guardian, consent to my child's participation...</p>`,
            created_by: 'admin',
            created_at: '2023-09-10T14:15:00.000Z',
            updated_at: '2023-09-12T09:20:00.000Z',
            is_active: true,
            is_default: false,
            version: 2,
            signatures_count: 12
          },
          {
            id: '3',
            title: 'Medical Consent Form',
            content: `<h2>Medical Consent Form</h2>
            <p>I authorize the tournament medical staff to administer first aid and arrange for medical transport if necessary...</p>
            <p>Please list any medical conditions, allergies, or medications...</p>`,
            tournament_id: tournamentId,
            created_by: user?.id || 'unknown',
            created_at: '2023-10-05T16:45:00.000Z',
            updated_at: '2023-10-05T16:45:00.000Z',
            is_active: true,
            is_default: false,
            version: 1,
            signatures_count: 5
          }
        ];

        // Filter by tournament if specified
        const filteredWaivers = tournamentId
          ? mockWaivers.filter(waiver => waiver.tournament_id === tournamentId || waiver.is_default)
          : mockWaivers;

        setWaivers(filteredWaivers);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching waivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load waivers. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setFormValues(prev => ({ ...prev, content }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setFormValues({
      title: '',
      content: '',
      is_default: false
    });
    setSelectedWaiver(null);
  };

  const handleEditWaiver = (waiver: Waiver) => {
    setSelectedWaiver(waiver);
    setFormValues({
      title: waiver.title,
      content: waiver.content,
      is_default: waiver.is_default
    });
    setIsEditing(true);
  };

  const handleCreateWaiver = async () => {
    if (!formValues.title || !formValues.content) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both title and content.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // In a real implementation, this would create in Appwrite
      // For now, we'll simulate it
      const newWaiver: Waiver = {
        id: ID.unique(),
        title: formValues.title,
        content: formValues.content,
        tournament_id: tournamentId,
        created_by: user?.id || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_default: formValues.is_default,
        version: 1
      };

      setWaivers(prev => [newWaiver, ...prev]);

      toast({
        title: 'Success',
        description: 'Waiver created successfully.',
      });

      resetForm();
      setIsEditing(false);
    } catch (error) {
      console.error('Error creating waiver:', error);
      toast({
        title: 'Error',
        description: 'Failed to create waiver. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateWaiver = async () => {
    if (!selectedWaiver) return;

    try {
      // In a real implementation, this would update in Appwrite
      // For now, we'll simulate it
      const updatedWaiver: Waiver = {
        ...selectedWaiver,
        title: formValues.title,
        content: formValues.content,
        is_default: formValues.is_default,
        updated_at: new Date().toISOString(),
        version: selectedWaiver.version + 1
      };

      setWaivers(prev => 
        prev.map(w => w.id === selectedWaiver.id ? updatedWaiver : w)
      );

      toast({
        title: 'Success',
        description: 'Waiver updated successfully.',
      });

      resetForm();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating waiver:', error);
      toast({
        title: 'Error',
        description: 'Failed to update waiver. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteWaiver = async (waiverId: string) => {
    if (!window.confirm('Are you sure you want to delete this waiver?')) {
      return;
    }

    try {
      // In a real implementation, this would delete from Appwrite
      // For now, we'll simulate it
      setWaivers(prev => prev.filter(w => w.id !== waiverId));

      toast({
        title: 'Success',
        description: 'Waiver deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting waiver:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete waiver. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDuplicateWaiver = async (waiver: Waiver) => {
    try {
      const duplicatedWaiver: Waiver = {
        ...waiver,
        id: ID.unique(),
        title: `${waiver.title} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_default: false,
        version: 1,
        signatures_count: 0
      };

      setWaivers(prev => [duplicatedWaiver, ...prev]);

      toast({
        title: 'Success',
        description: 'Waiver duplicated successfully.',
      });
    } catch (error) {
      console.error('Error duplicating waiver:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate waiver. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Digital Waivers</h2>
        {canCreateWaiver && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Waiver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedWaiver ? 'Edit Waiver' : 'Create New Waiver'}
                </DialogTitle>
                <DialogDescription>
                  {selectedWaiver 
                    ? 'Update the waiver information below.'
                    : 'Create a new waiver template for participants to sign.'}
                </DialogDescription>
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
                    placeholder="Enter waiver title"
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right pt-2">
                    Content
                  </Label>
                  <div className="col-span-3">
                    {/* In a real implementation, this would be a rich text editor */}
                    <Textarea
                      id="content"
                      name="content"
                      value={formValues.content}
                      onChange={handleInputChange}
                      placeholder="Enter waiver content"
                      rows={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can use HTML tags to format the content.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <Label htmlFor="is_default">Default</Label>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formValues.is_default}
                      onChange={(e) => handleCheckboxChange('is_default', e.target.checked)}
                    />
                    <Label htmlFor="is_default">
                      Make this a default waiver (available for all tournaments)
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={selectedWaiver ? handleUpdateWaiver : handleCreateWaiver}>
                  {selectedWaiver ? 'Update Waiver' : 'Create Waiver'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* View waiver dialog */}
      <Dialog open={!!viewWaiver} onOpenChange={(open) => !open && setViewWaiver(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewWaiver?.title}</DialogTitle>
            <DialogDescription>
              Version {viewWaiver?.version} · Last updated {viewWaiver && new Date(viewWaiver.updated_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-md p-4 bg-muted/30">
            <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: viewWaiver?.content || '' }} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewWaiver(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Available Waivers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : waivers.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No waivers found</p>
              {canCreateWaiver && (
                <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Waiver
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waivers.map((waiver) => (
                  <TableRow key={waiver.id}>
                    <TableCell className="font-medium">
                      {waiver.title}
                      {waiver.is_default && (
                        <Badge variant="outline" className="ml-2">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {waiver.is_active ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>v{waiver.version}</TableCell>
                    <TableCell>{waiver.signatures_count || 0}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewWaiver(waiver)}
                        title="View Waiver"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canCreateWaiver && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWaiver(waiver)}
                            title="Edit Waiver"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateWaiver(waiver)}
                            title="Duplicate Waiver"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWaiver(waiver.id)}
                            title="Delete Waiver"
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {onWaiverSelected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onWaiverSelected(waiver)}
                          className="ml-2"
                        >
                          <Check className="h-4 w-4 mr-1" /> Select
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Digital waivers are stored securely and can be reviewed at any time.
        </CardFooter>
      </Card>
    </div>
  );
};

export default WaiverManager;
