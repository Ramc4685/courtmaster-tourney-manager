import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Waiver {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  version: string;
  createdAt: string;
  signedCount: number;
  totalPlayers: number;
}

interface WaiverSignature {
  id: string;
  waiverId: string;
  playerName: string;
  playerEmail: string;
  signedAt: string;
  ipAddress: string;
}

export const WaiverManagementPage: React.FC = () => {
  const { id: tournamentId } = useParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null);
  const [newWaiver, setNewWaiver] = useState({
    title: '',
    content: '',
    isRequired: true,
    version: '1.0'
  });

  // Mock waivers data
  const [waivers, setWaivers] = useState<Waiver[]>([
    {
      id: '1',
      title: 'General Liability Waiver',
      content: 'I hereby waive and release any claims against the tournament organizers...',
      isRequired: true,
      version: '1.0',
      createdAt: '2024-01-15T08:00:00Z',
      signedCount: 45,
      totalPlayers: 60
    },
    {
      id: '2',
      title: 'Photography Release',
      content: 'I grant permission for the use of photographs taken during the tournament...',
      isRequired: false,
      version: '1.0',
      createdAt: '2024-01-15T08:00:00Z',
      signedCount: 38,
      totalPlayers: 60
    }
  ]);

  // Mock signature data
  const mockSignatures: WaiverSignature[] = [
    {
      id: '1',
      waiverId: '1',
      playerName: 'John Doe',
      playerEmail: 'john@example.com',
      signedAt: '2024-01-15T09:30:00Z',
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      waiverId: '1',
      playerName: 'Jane Smith',
      playerEmail: 'jane@example.com',
      signedAt: '2024-01-15T09:45:00Z',
      ipAddress: '192.168.1.101'
    }
  ];

  const handleCreateWaiver = () => {
    const waiver: Waiver = {
      id: Date.now().toString(),
      ...newWaiver,
      createdAt: new Date().toISOString(),
      signedCount: 0,
      totalPlayers: 60
    };

    setWaivers([...waivers, waiver]);
    setNewWaiver({
      title: '',
      content: '',
      isRequired: true,
      version: '1.0'
    });
    setIsCreateDialogOpen(false);
  };

  const deleteWaiver = (id: string) => {
    setWaivers(waivers.filter(waiver => waiver.id !== id));
  };

  const getSigningStatus = (waiver: Waiver) => {
    const percentage = Math.round((waiver.signedCount / waiver.totalPlayers) * 100);
    if (percentage >= 90) return { color: 'bg-green-100 text-green-800', label: 'Complete' };
    if (percentage >= 70) return { color: 'bg-yellow-100 text-yellow-800', label: 'Good' };
    return { color: 'bg-red-100 text-red-800', label: 'Needs Attention' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waiver Management</h1>
          <p className="text-gray-600">Manage tournament waivers and signatures</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Waiver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Waiver</DialogTitle>
              <DialogDescription>
                Create a new waiver for tournament participants
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newWaiver.title}
                  onChange={(e) => setNewWaiver({...newWaiver, title: e.target.value})}
                  placeholder="Waiver title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newWaiver.content}
                  onChange={(e) => setNewWaiver({...newWaiver, content: e.target.value})}
                  placeholder="Waiver content and terms"
                  rows={6}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Required for participation</label>
                  <p className="text-xs text-gray-500">Players must sign this waiver to participate</p>
                </div>
                <Switch
                  checked={newWaiver.isRequired}
                  onCheckedChange={(checked) => setNewWaiver({...newWaiver, isRequired: checked})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Version</label>
                <Input
                  value={newWaiver.version}
                  onChange={(e) => setNewWaiver({...newWaiver, version: e.target.value})}
                  placeholder="1.0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWaiver}>
                  Create Waiver
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Waivers List */}
      <div className="space-y-4">
        {waivers.map((waiver) => {
          const status = getSigningStatus(waiver);
          return (
            <Card key={waiver.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{waiver.title}</CardTitle>
                      <CardDescription>Version {waiver.version}</CardDescription>
                    </div>
                    {waiver.isRequired && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWaiver(waiver.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{waiver.signedCount}</div>
                    <div className="text-sm text-gray-500">Signed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{waiver.totalPlayers - waiver.signedCount}</div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((waiver.signedCount / waiver.totalPlayers) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Completion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{waiver.totalPlayers}</div>
                    <div className="text-sm text-gray-500">Total Players</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-3">{waiver.content}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signatures</CardTitle>
          <CardDescription>
            Latest waiver signatures from tournament participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Waiver</TableHead>
                <TableHead>Signed At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSignatures.map((signature) => {
                const waiver = waivers.find(w => w.id === signature.waiverId);
                return (
                  <TableRow key={signature.id}>
                    <TableCell className="font-medium">{signature.playerName}</TableCell>
                    <TableCell>{signature.playerEmail}</TableCell>
                    <TableCell>{waiver?.title}</TableCell>
                    <TableCell>{new Date(signature.signedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Signed</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {waivers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Waivers</h3>
            <p className="text-gray-500 mb-4">Create your first tournament waiver</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Waiver
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};