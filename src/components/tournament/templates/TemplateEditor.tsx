/**
 * Tournament Template Editor Component for CourtMaster Tournament Management System
 * 
 * Provides an interface for creating and editing tournament templates.
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Save, 
  Trash, 
  Users, 
  Settings, 
  Calendar, 
  ClipboardCheck, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Switch } from '../../../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { TournamentTemplate } from '../../../services/tournament/TemplateService';
import SportRulesFactory from '../../../services/rules/SportRulesFactory';
import { useToast } from '../../../hooks/useToast';
import { useUser } from '../../../contexts/auth/useAuth';

interface TemplateEditorProps {
  template?: TournamentTemplate;
  onSave?: (template: TournamentTemplate) => Promise<boolean>;
  onCancel?: () => void;
}

interface DivisionForm {
  id?: string;
  name: string;
  type: string;
  gender?: string;
  skill_level?: string;
  min_age?: number;
  max_age?: number;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    sport_type: 'badminton',
    format: 'elimination',
    is_public: true,
    tags: '',
    points_per_set: 21,
    sets_to_win: 2,
    points_to_win_set: 21,
    point_differential: 2,
    court_count: 4,
    match_duration_minutes: 30,
    break_between_matches_minutes: 10,
    allow_self_registration: true,
    registration_deadline_days_before: 2,
    max_participants_per_division: 32,
    waiting_list_enabled: true,
    require_waiver: true
  });
  
  const [divisions, setDivisions] = useState<DivisionForm[]>([]);
  const [newDivision, setNewDivision] = useState<DivisionForm>({
    name: '',
    type: 'singles'
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSports, setAvailableSports] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    // Load available sports from SportRulesFactory
    const sports = SportRulesFactory.getAvailableSports();
    setAvailableSports(sports.map(sport => ({ 
      id: sport.id, 
      name: sport.name 
    })));
    
    // If editing existing template, populate the form
    if (template) {
      populateFormFromTemplate();
    }
  }, [template]);
  
  const populateFormFromTemplate = () => {
    if (!template) return;
    
    setFormValues({
      name: template.name,
      description: template.description,
      sport_type: template.sport_type,
      format: template.format || 'elimination',
      is_public: template.is_public,
      tags: template.tags.join(', '),
      points_per_set: template.settings.scoring_rules?.points_per_set || 21,
      sets_to_win: template.settings.scoring_rules?.sets_to_win || 2,
      points_to_win_set: template.settings.scoring_rules?.points_to_win_set || 21,
      point_differential: template.settings.scoring_rules?.point_differential || 2,
      court_count: template.settings.schedule_settings?.court_count || 4,
      match_duration_minutes: template.settings.schedule_settings?.match_duration_minutes || 30,
      break_between_matches_minutes: template.settings.schedule_settings?.break_between_matches_minutes || 10,
      allow_self_registration: template.settings.registration_settings?.allow_self_registration ?? true,
      registration_deadline_days_before: template.settings.registration_settings?.registration_deadline_days_before || 2,
      max_participants_per_division: template.settings.registration_settings?.max_participants_per_division || 32,
      waiting_list_enabled: template.settings.registration_settings?.waiting_list_enabled ?? true,
      require_waiver: template.settings.registration_settings?.require_waiver ?? true
    });
    
    // Set divisions
    if (template.settings.divisions && template.settings.divisions.length > 0) {
      setDivisions(template.settings.divisions.map((div, index) => ({
        id: `existing-${index}`,
        name: div.name,
        type: div.type,
        gender: div.gender,
        skill_level: div.skill_level,
        min_age: div.min_age,
        max_age: div.max_age
      })));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : Number(value);
    setFormValues(prev => ({ ...prev, [name]: numValue }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleNewDivisionChange = (field: keyof DivisionForm, value: any) => {
    setNewDivision(prev => ({ ...prev, [field]: value }));
  };
  
  const addDivision = () => {
    if (!newDivision.name) {
      toast({
        title: 'Error',
        description: 'Division name is required',
        variant: 'destructive'
      });
      return;
    }
    
    setDivisions(prev => [...prev, { ...newDivision, id: `new-${Date.now()}` }]);
    setNewDivision({ name: '', type: 'singles' });
  };
  
  const removeDivision = (id?: string) => {
    if (!id) return;
    setDivisions(prev => prev.filter(div => div.id !== id));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!formValues.sport_type) {
      newErrors.sport_type = 'Sport type is required';
    }
    
    if (!formValues.format) {
      newErrors.format = 'Tournament format is required';
    }
    
    if (divisions.length === 0) {
      newErrors.divisions = 'At least one division is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveTemplate = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const tags = formValues.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
      
      const templateData: TournamentTemplate = {
        id: template?.id || '',
        name: formValues.name,
        description: formValues.description,
        sport_type: formValues.sport_type,
        created_by: user?.id || 'unknown',
        settings: {
          divisions: divisions.map(div => ({
            name: div.name,
            type: div.type,
            gender: div.gender,
            skill_level: div.skill_level,
            min_age: div.min_age,
            max_age: div.max_age
          })),
          scoring_rules: {
            points_per_set: Number(formValues.points_per_set),
            sets_to_win: Number(formValues.sets_to_win),
            points_to_win_set: Number(formValues.points_to_win_set),
            point_differential: Number(formValues.point_differential)
          },
          schedule_settings: {
            court_count: Number(formValues.court_count),
            match_duration_minutes: Number(formValues.match_duration_minutes),
            break_between_matches_minutes: Number(formValues.break_between_matches_minutes)
          },
          registration_settings: {
            allow_self_registration: formValues.allow_self_registration,
            registration_deadline_days_before: Number(formValues.registration_deadline_days_before),
            max_participants_per_division: Number(formValues.max_participants_per_division),
            waiting_list_enabled: formValues.waiting_list_enabled,
            require_waiver: formValues.require_waiver
          }
        },
        format: formValues.format,
        categories: [],
        is_public: formValues.is_public,
        usage_count: template?.usage_count || 0,
        tags,
        created_at: template?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (onSave) {
        const success = await onSave(templateData);
        
        if (success) {
          toast({
            title: 'Success',
            description: `Template ${template ? 'updated' : 'created'} successfully`
          });
        } else {
          throw new Error('Failed to save template');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: `Failed to ${template ? 'update' : 'create'} template. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {template ? 'Edit Tournament Template' : 'Create Tournament Template'}
        </h2>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="basic">
                <Settings className="h-4 w-4 mr-2" /> Basic
              </TabsTrigger>
              <TabsTrigger value="divisions">
                <Users className="h-4 w-4 mr-2" /> Divisions
              </TabsTrigger>
              <TabsTrigger value="scoring">
                <Settings className="h-4 w-4 mr-2" /> Scoring
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Calendar className="h-4 w-4 mr-2" /> Settings
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">
                    Template Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="Template name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formValues.description}
                    onChange={handleInputChange}
                    placeholder="Template description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sport_type">
                      Sport Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formValues.sport_type}
                      onValueChange={(value) => handleSelectChange('sport_type', value)}
                    >
                      <SelectTrigger id="sport_type" className={errors.sport_type ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select sport type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSports.map(sport => (
                          <SelectItem key={sport.id} value={sport.id}>
                            {sport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sport_type && (
                      <p className="text-sm text-destructive mt-1">{errors.sport_type}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="format">
                      Tournament Format <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formValues.format}
                      onValueChange={(value) => handleSelectChange('format', value)}
                    >
                      <SelectTrigger id="format" className={errors.format ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select tournament format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elimination">Single Elimination</SelectItem>
                        <SelectItem value="double_elimination">Double Elimination</SelectItem>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="group_stage">Group Stage + Playoffs</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.format && (
                      <p className="text-sm text-destructive mt-1">{errors.format}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formValues.tags}
                    onChange={handleInputChange}
                    placeholder="Enter tags separated by commas"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter tags separated by commas (e.g., beginner, doubles, youth)
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formValues.is_public}
                    onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
                  />
                  <Label htmlFor="is_public">Public template (visible to all users)</Label>
                </div>
              </div>
            </TabsContent>
            
            {/* Divisions Tab */}
            <TabsContent value="divisions" className="space-y-4 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tournament Divisions</h3>
                
                {errors.divisions && (
                  <div className="bg-destructive/10 p-3 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                    <p className="text-sm text-destructive">{errors.divisions}</p>
                  </div>
                )}
                
                {divisions.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Age/Skill</TableHead>
                          <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {divisions.map((division) => (
                          <TableRow key={division.id}>
                            <TableCell className="font-medium">{division.name}</TableCell>
                            <TableCell>{division.type}</TableCell>
                            <TableCell>{division.gender || 'Any'}</TableCell>
                            <TableCell>
                              {division.skill_level ? `${division.skill_level}` : ''}
                              {division.min_age || division.max_age ? ' | ' : ''}
                              {division.min_age && division.max_age
                                ? `${division.min_age}-${division.max_age}`
                                : division.min_age
                                ? `${division.min_age}+`
                                : division.max_age
                                ? `Under ${division.max_age}`
                                : ''}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDivision(division.id)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 text-center text-muted-foreground">
                    No divisions added yet. Use the form below to add divisions.
                  </div>
                )}
                
                <Separator />
                
                <h4 className="text-sm font-medium">Add Division</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="division-name">Name</Label>
                    <Input
                      id="division-name"
                      value={newDivision.name}
                      onChange={(e) => handleNewDivisionChange('name', e.target.value)}
                      placeholder="Division name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="division-type">Type</Label>
                    <Select
                      value={newDivision.type}
                      onValueChange={(value) => handleNewDivisionChange('type', value)}
                    >
                      <SelectTrigger id="division-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="singles">Singles</SelectItem>
                        <SelectItem value="doubles">Doubles</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="division-gender">Gender</Label>
                    <Select
                      value={newDivision.gender || 'any'}
                      onValueChange={(value) => handleNewDivisionChange('gender', value === 'any' ? undefined : value)}
                    >
                      <SelectTrigger id="division-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="division-skill">Skill Level</Label>
                    <Select
                      value={newDivision.skill_level || 'any'}
                      onValueChange={(value) => handleNewDivisionChange('skill_level', value === 'any' ? undefined : value)}
                    >
                      <SelectTrigger id="division-skill">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={addDivision} className="w-full">
                      <Plus className="h-4 w-4 mr-1" /> Add Division
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Scoring Rules</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points_per_set">Points Per Set</Label>
                    <Input
                      id="points_per_set"
                      name="points_per_set"
                      type="number"
                      value={formValues.points_per_set}
                      onChange={handleNumberInputChange}
                      min={1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sets_to_win">Sets to Win Match</Label>
                    <Input
                      id="sets_to_win"
                      name="sets_to_win"
                      type="number"
                      value={formValues.sets_to_win}
                      onChange={handleNumberInputChange}
                      min={1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="points_to_win_set">Points to Win Set</Label>
                    <Input
                      id="points_to_win_set"
                      name="points_to_win_set"
                      type="number"
                      value={formValues.points_to_win_set}
                      onChange={handleNumberInputChange}
                      min={1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="point_differential">Point Differential</Label>
                    <Input
                      id="point_differential"
                      name="point_differential"
                      type="number"
                      value={formValues.point_differential}
                      onChange={handleNumberInputChange}
                      min={1}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum point difference required to win a set
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="court_count">Court Count</Label>
                    <Input
                      id="court_count"
                      name="court_count"
                      type="number"
                      value={formValues.court_count}
                      onChange={handleNumberInputChange}
                      min={1}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="match_duration_minutes">Match Duration (minutes)</Label>
                    <Input
                      id="match_duration_minutes"
                      name="match_duration_minutes"
                      type="number"
                      value={formValues.match_duration_minutes}
                      onChange={handleNumberInputChange}
                      min={5}
                      step={5}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="break_between_matches_minutes">Break Between Matches (minutes)</Label>
                    <Input
                      id="break_between_matches_minutes"
                      name="break_between_matches_minutes"
                      type="number"
                      value={formValues.break_between_matches_minutes}
                      onChange={handleNumberInputChange}
                      min={0}
                      step={5}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Registration Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow_self_registration"
                        checked={formValues.allow_self_registration}
                        onCheckedChange={(checked) => handleSwitchChange('allow_self_registration', checked)}
                      />
                      <Label htmlFor="allow_self_registration">Allow self-registration</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="waiting_list_enabled"
                        checked={formValues.waiting_list_enabled}
                        onCheckedChange={(checked) => handleSwitchChange('waiting_list_enabled', checked)}
                      />
                      <Label htmlFor="waiting_list_enabled">Enable waiting list</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="require_waiver"
                        checked={formValues.require_waiver}
                        onCheckedChange={(checked) => handleSwitchChange('require_waiver', checked)}
                      />
                      <Label htmlFor="require_waiver">Require digital waiver</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="registration_deadline_days_before">Registration Deadline (days before)</Label>
                      <Input
                        id="registration_deadline_days_before"
                        name="registration_deadline_days_before"
                        type="number"
                        value={formValues.registration_deadline_days_before}
                        onChange={handleNumberInputChange}
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Days before tournament start when registration closes (0 for no deadline)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="max_participants_per_division">Max Participants per Division</Label>
                      <Input
                        id="max_participants_per_division"
                        name="max_participants_per_division"
                        type="number"
                        value={formValues.max_participants_per_division}
                        onChange={handleNumberInputChange}
                        min={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button onClick={handleSaveTemplate} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                {template ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {template ? 'Update Template' : 'Create Template'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TemplateEditor;
