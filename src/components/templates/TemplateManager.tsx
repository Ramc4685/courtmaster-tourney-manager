import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Save,
  X,
  Trophy,
  Users,
  Calendar,
  Settings
} from 'lucide-react';

interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  sportType: string;
  format: string;
  categories: string[];
  isPublic: boolean;
  usageCount: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  settings: {
    maxParticipants?: number;
    defaultDuration?: string;
    scoringSystem?: string;
    allowLateRegistration?: boolean;
    requireWaivers?: boolean;
  };
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: TournamentTemplate) => void;
  showActions?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  showActions = true
}) => {
  const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TournamentTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sportType: '',
    format: '',
    categories: [] as string[],
    isPublic: false,
    tags: [] as string[],
    settings: {
      maxParticipants: 32,
      defaultDuration: '1 day',
      scoringSystem: 'standard',
      allowLateRegistration: false,
      requireWaivers: true
    }
  });

  // Mock templates data
  const mockTemplates: TournamentTemplate[] = [
    {
      id: '1',
      name: 'Single Elimination Tennis',
      description: 'Classic single elimination format for tennis tournaments',
      sportType: 'tennis',
      format: 'single-elimination',
      categories: ['competitive', 'standard'],
      isPublic: true,
      usageCount: 125,
      tags: ['popular', 'fast'],
      createdBy: 'system',
      createdAt: '2024-01-01T00:00:00Z',
      settings: {
        maxParticipants: 64,
        defaultDuration: '1 day',
        scoringSystem: 'standard',
        allowLateRegistration: false,
        requireWaivers: true
      }
    },
    {
      id: '2',
      name: 'Round Robin Pickleball',
      description: 'Round robin format ensuring every player plays every other player',
      sportType: 'pickleball',
      format: 'round-robin',
      categories: ['recreational', 'inclusive'],
      isPublic: true,
      usageCount: 89,
      tags: ['fair', 'social'],
      createdBy: 'user123',
      createdAt: '2024-01-15T00:00:00Z',
      settings: {
        maxParticipants: 16,
        defaultDuration: '2 days',
        scoringSystem: 'rally',
        allowLateRegistration: true,
        requireWaivers: false
      }
    }
  ];

  useEffect(() => {
    // Simulate loading templates
    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 500);
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sportType: '',
      format: '',
      categories: [],
      isPublic: false,
      tags: [],
      settings: {
        maxParticipants: 32,
        defaultDuration: '1 day',
        scoringSystem: 'standard',
        allowLateRegistration: false,
        requireWaivers: true
      }
    });
  };

  const handleCreateTemplate = () => {
    const newTemplate: TournamentTemplate = {
      id: Date.now().toString(),
      ...formData,
      usageCount: 0,
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    };

    setTemplates([...templates, newTemplate]);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEditTemplate = (template: TournamentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      sportType: template.sportType,
      format: template.format,
      categories: template.categories,
      isPublic: template.isPublic,
      tags: template.tags,
      settings: template.settings
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplate: TournamentTemplate = {
      ...editingTemplate,
      ...formData
    };

    setTemplates(templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    setEditingTemplate(null);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleDuplicateTemplate = (template: TournamentTemplate) => {
    const duplicatedTemplate: TournamentTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    };

    setTemplates([...templates, duplicatedTemplate]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'tennis': return '🎾';
      case 'pickleball': return '🏓';
      case 'chess': return '♟️';
      case 'basketball': return '🏀';
      default: return '🏆';
    }
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'single-elimination': return 'bg-red-100 text-red-800';
      case 'double-elimination': return 'bg-orange-100 text-orange-800';
      case 'round-robin': return 'bg-green-100 text-green-800';
      case 'swiss-system': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Manager</h2>
          <p className="text-gray-600">Create and manage tournament templates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Tournament Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update template settings' : 'Create a reusable tournament template'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Tournament template name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sport Type</label>
                  <Select
                    value={formData.sportType}
                    onValueChange={(value) => setFormData({...formData, sportType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="pickleball">Pickleball</SelectItem>
                      <SelectItem value="chess">Chess</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Template description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tournament Format</label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData({...formData, format: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-elimination">Single Elimination</SelectItem>
                      <SelectItem value="double-elimination">Double Elimination</SelectItem>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                      <SelectItem value="swiss-system">Swiss System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Participants</label>
                  <Input
                    type="number"
                    value={formData.settings.maxParticipants}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {...formData.settings, maxParticipants: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Default Duration</label>
                  <Select
                    value={formData.settings.defaultDuration}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      settings: {...formData.settings, defaultDuration: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 day">1 Day</SelectItem>
                      <SelectItem value="2 days">2 Days</SelectItem>
                      <SelectItem value="3 days">3 Days</SelectItem>
                      <SelectItem value="1 week">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Scoring System</label>
                  <Select
                    value={formData.settings.scoringSystem}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      settings: {...formData.settings, scoringSystem: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="rally">Rally</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Public Template</label>
                    <p className="text-xs text-gray-500">Allow others to use this template</p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Allow Late Registration</label>
                    <p className="text-xs text-gray-500">Allow registration after deadline</p>
                  </div>
                  <Switch
                    checked={formData.settings.allowLateRegistration}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      settings: {...formData.settings, allowLateRegistration: checked}
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Require Waivers</label>
                    <p className="text-xs text-gray-500">Require signed waivers for participation</p>
                  </div>
                  <Switch
                    checked={formData.settings.requireWaivers}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      settings: {...formData.settings, requireWaivers: checked}
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingTemplate(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getSportIcon(template.sportType)}</span>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      {template.sportType.charAt(0).toUpperCase() + template.sportType.slice(1)}
                    </CardDescription>
                  </div>
                </div>
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onTemplateSelect && (
                        <DropdownMenuItem onClick={() => onTemplateSelect(template)}>
                          <Trophy className="h-4 w-4 mr-2" />
                          Use Template
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Format:</span>
                  <Badge className={getFormatBadgeColor(template.format)}>
                    {template.format.replace('-', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Max Participants:</span>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{template.settings.maxParticipants}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{template.settings.defaultDuration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Used:</span>
                  <span className="text-sm text-gray-600">{template.usageCount} times</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visibility:</span>
                  <Badge variant={template.isPublic ? "default" : "secondary"}>
                    {template.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates</h3>
            <p className="text-gray-500 mb-4">Create your first tournament template to get started</p>
            <Button onClick={() => {
              setEditingTemplate(null);
              resetForm();
              setIsCreateDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};