/**
 * Tournament Template Details Component for CourtMaster Tournament Management System
 * 
 * Displays detailed information about a tournament template and provides
 * functionality to apply the template to create a new tournament.
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Copy, 
  Edit, 
  Eye, 
  Info, 
  Settings, 
  Users, 
  Check, 
  Tag, 
  MapPin,
  ChevronDown,
  CopyPlus
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { TournamentTemplate } from '../../../services/tournament/TemplateService';
import { useToast } from '../../../hooks/useToast';

interface TemplateDetailsProps {
  template?: TournamentTemplate;
  onApplyTemplate?: (templateId: string, tournamentData: any) => Promise<string | null>;
  onEditTemplate?: (template: TournamentTemplate) => void;
  isEditable?: boolean;
}

interface NewTournamentFormValues {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: string;
}

export const TemplateDetails: React.FC<TemplateDetailsProps> = ({
  template,
  onApplyTemplate,
  onEditTemplate,
  isEditable = false
}) => {
  const { toast } = useToast();
  
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<NewTournamentFormValues>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    venue: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  if (!template) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Select a template to view details</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApplyTemplate = async () => {
    if (!formValues.name || !formValues.start_date || !formValues.end_date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (onApplyTemplate) {
        const result = await onApplyTemplate(template.id, formValues);
        
        if (result) {
          toast({
            title: 'Success',
            description: 'Tournament created successfully!'
          });
          setIsApplying(false);
        } else {
          throw new Error('Failed to create tournament');
        }
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{template.name}</CardTitle>
            <CardDescription className="mt-2">{template.description}</CardDescription>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">
                {template.sport_type.charAt(0).toUpperCase() + template.sport_type.slice(1)}
              </Badge>
              <Badge variant="outline">
                {template.format.charAt(0).toUpperCase() + template.format.slice(1)}
              </Badge>
              <Badge variant="secondary">
                {template.usage_count} uses
              </Badge>
              {template.is_public ? (
                <Badge>Public</Badge>
              ) : (
                <Badge variant="outline">Private</Badge>
              )}
            </div>
          </div>
          
          <div className="space-x-2">
            {isEditable && onEditTemplate && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditTemplate(template)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            
            {onApplyTemplate && (
              <Dialog open={isApplying} onOpenChange={setIsApplying}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <CopyPlus className="h-4 w-4 mr-1" /> Use Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create Tournament from Template</DialogTitle>
                    <DialogDescription>
                      Create a new tournament using "{template.name}" as a template.
                      Fill in the basic details below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formValues.name}
                        onChange={handleInputChange}
                        placeholder="Tournament name"
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formValues.description}
                        onChange={handleInputChange}
                        placeholder="Tournament description"
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="start_date" className="text-right">
                        Start Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={formValues.start_date}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="end_date" className="text-right">
                        End Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        value={formValues.end_date}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="venue" className="text-right">
                        Venue
                      </Label>
                      <Input
                        id="venue"
                        name="venue"
                        value={formValues.venue}
                        onChange={handleInputChange}
                        placeholder="Tournament venue"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApplying(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplyTemplate} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                          Creating...
                        </>
                      ) : (
                        <>Create Tournament</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="divisions">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="divisions">
              <Users className="h-4 w-4 mr-2" /> Divisions
            </TabsTrigger>
            <TabsTrigger value="scoring">
              <Settings className="h-4 w-4 mr-2" /> Scoring
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="registration">
              <Check className="h-4 w-4 mr-2" /> Registration
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="divisions" className="pt-4">
            <h3 className="text-lg font-medium mb-2">Tournament Divisions</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.settings.divisions ? (
                    template.settings.divisions.map((division, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{division.name}</TableCell>
                        <TableCell>{division.type}</TableCell>
                        <TableCell>{division.gender || 'Any'}</TableCell>
                        <TableCell>
                          {division.min_age && division.max_age
                            ? `${division.min_age}-${division.max_age}`
                            : division.min_age
                            ? `${division.min_age}+`
                            : division.max_age
                            ? `Under ${division.max_age}`
                            : 'All ages'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No divisions defined in this template
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="scoring" className="pt-4">
            <h3 className="text-lg font-medium mb-2">Scoring Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.settings.scoring_rules ? (
                <Card>
                  <CardContent className="pt-6">
                    <dl className="grid grid-cols-[1fr_2fr] gap-2">
                      <dt className="font-medium">Points per set:</dt>
                      <dd>{template.settings.scoring_rules.points_per_set}</dd>
                      
                      <dt className="font-medium">Sets to win:</dt>
                      <dd>{template.settings.scoring_rules.sets_to_win}</dd>
                      
                      <dt className="font-medium">Points to win set:</dt>
                      <dd>{template.settings.scoring_rules.points_to_win_set}</dd>
                      
                      <dt className="font-medium">Point differential:</dt>
                      <dd>{template.settings.scoring_rules.point_differential || '1'}</dd>
                      
                      {template.settings.scoring_rules.tiebreaker_rules && (
                        <>
                          <dt className="font-medium">Tiebreaker:</dt>
                          <dd>{template.settings.scoring_rules.tiebreaker_rules.enabled ? 'Enabled' : 'Disabled'}</dd>
                          
                          {template.settings.scoring_rules.tiebreaker_rules.enabled && (
                            <>
                              <dt className="font-medium">Tiebreaker points:</dt>
                              <dd>{template.settings.scoring_rules.tiebreaker_rules.points}</dd>
                            </>
                          )}
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              ) : (
                <div className="col-span-full p-4 border rounded-md text-center text-muted-foreground">
                  No scoring rules defined in this template
                </div>
              )}
              
              <div className="bg-muted/40 p-4 rounded-md">
                <h4 className="font-medium mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1" /> Format Details
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  This template uses a {template.format} tournament format.
                </p>
                <Badge variant="outline">
                  {template.sport_type.charAt(0).toUpperCase() + template.sport_type.slice(1)} Rules
                </Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="pt-4">
            <h3 className="text-lg font-medium mb-2">Schedule Settings</h3>
            {template.settings.schedule_settings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <dl className="grid grid-cols-[1fr_2fr] gap-2">
                      <dt className="font-medium">Court count:</dt>
                      <dd>{template.settings.schedule_settings.court_count}</dd>
                      
                      <dt className="font-medium">Match duration:</dt>
                      <dd>{template.settings.schedule_settings.match_duration_minutes} minutes</dd>
                      
                      <dt className="font-medium">Break between matches:</dt>
                      <dd>{template.settings.schedule_settings.break_between_matches_minutes} minutes</dd>
                      
                      {template.settings.schedule_settings.max_matches_per_player_per_day && (
                        <>
                          <dt className="font-medium">Max matches per player/day:</dt>
                          <dd>{template.settings.schedule_settings.max_matches_per_player_per_day}</dd>
                        </>
                      )}
                      
                      {template.settings.schedule_settings.start_time && (
                        <>
                          <dt className="font-medium">Daily start time:</dt>
                          <dd>{template.settings.schedule_settings.start_time}</dd>
                        </>
                      )}
                      
                      {template.settings.schedule_settings.end_time && (
                        <>
                          <dt className="font-medium">Daily end time:</dt>
                          <dd>{template.settings.schedule_settings.end_time}</dd>
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>
                
                {template.settings.schedule_settings.daily_schedule && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Daily Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        This template includes a predefined daily schedule.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="p-4 border rounded-md text-center text-muted-foreground">
                No schedule settings defined in this template
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="registration" className="pt-4">
            <h3 className="text-lg font-medium mb-2">Registration Settings</h3>
            {template.settings.registration_settings ? (
              <Card>
                <CardContent className="pt-6">
                  <dl className="grid grid-cols-[1fr_2fr] gap-2">
                    <dt className="font-medium">Self-registration:</dt>
                    <dd>
                      {template.settings.registration_settings.allow_self_registration ? 'Enabled' : 'Disabled'}
                    </dd>
                    
                    {template.settings.registration_settings.registration_deadline_days_before !== undefined && (
                      <>
                        <dt className="font-medium">Registration deadline:</dt>
                        <dd>{template.settings.registration_settings.registration_deadline_days_before} days before tournament</dd>
                      </>
                    )}
                    
                    {template.settings.registration_settings.max_participants_per_division !== undefined && (
                      <>
                        <dt className="font-medium">Max participants per division:</dt>
                        <dd>{template.settings.registration_settings.max_participants_per_division}</dd>
                      </>
                    )}
                    
                    <dt className="font-medium">Waiting list:</dt>
                    <dd>
                      {template.settings.registration_settings.waiting_list_enabled ? 'Enabled' : 'Disabled'}
                    </dd>
                    
                    <dt className="font-medium">Require waiver:</dt>
                    <dd>
                      {template.settings.registration_settings.require_waiver ? 'Yes' : 'No'}
                    </dd>
                    
                    {template.settings.registration_settings.custom_fields && (
                      <>
                        <dt className="font-medium">Custom fields:</dt>
                        <dd>{template.settings.registration_settings.custom_fields.length} custom field(s)</dd>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            ) : (
              <div className="p-4 border rounded-md text-center text-muted-foreground">
                No registration settings defined in this template
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start border-t pt-4">
        <div className="w-full flex flex-wrap gap-x-6 gap-y-2 mb-2 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>{' '}
            <span className="ml-1">{formatDate(template.created_at)}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>{' '}
            <span className="ml-1">{formatDate(template.updated_at)}</span>
          </div>
        </div>
        
        <div className="w-full">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Tag className="h-4 w-4 mr-1" /> Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TemplateDetails;
