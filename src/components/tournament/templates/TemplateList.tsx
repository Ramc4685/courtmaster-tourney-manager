/**
 * Tournament Template List Component for CourtMaster Tournament Management System
 * 
 * Displays a list of available tournament templates with filtering and selection capabilities.
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, ArrowUpDown, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { TournamentTemplate } from '../../../services/tournament/TemplateService';
import { useUser } from '../../../contexts/auth/useAuth';

interface TemplateListProps {
  onSelectTemplate?: (template: TournamentTemplate) => void;
  onCreateTemplate?: () => void;
  selectedTemplateId?: string;
  sportType?: string;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  onSelectTemplate,
  onCreateTemplate,
  selectedTemplateId,
  sportType
}) => {
  const { user } = useUser();

  const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSport, setFilterSport] = useState<string>(sportType || 'all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sportTypes, setSportTypes] = useState<string[]>([]);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [sportType]);

  // For demo purposes, this is a mock implementation
  const fetchTemplates = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would fetch from Appwrite
      // For now, we'll simulate it with mock data
      setTimeout(() => {
        const mockTemplates: TournamentTemplate[] = [
          {
            id: 'template1',
            name: 'Standard Badminton Tournament',
            description: 'A standard badminton tournament template with singles and doubles divisions',
            sport_type: 'badminton',
            created_by: 'admin',
            settings: {
              divisions: [
                {
                  name: "Men's Singles",
                  type: 'singles',
                  gender: 'male'
                },
                {
                  name: "Women's Singles",
                  type: 'singles',
                  gender: 'female'
                },
                {
                  name: "Mixed Doubles",
                  type: 'doubles',
                  gender: 'mixed'
                }
              ],
              scoring_rules: {
                points_per_set: 21,
                sets_to_win: 2,
                points_to_win_set: 21,
                point_differential: 2
              },
              schedule_settings: {
                court_count: 4,
                match_duration_minutes: 30,
                break_between_matches_minutes: 10
              },
              registration_settings: {
                allow_self_registration: true,
                registration_deadline_days_before: 2,
                require_waiver: true
              }
            },
            format: 'elimination',
            categories: ['singles', 'doubles', 'beginner', 'intermediate', 'advanced'],
            is_public: true,
            usage_count: 15,
            tags: ['badminton', 'standard', 'popular'],
            created_at: '2023-09-15T14:00:00.000Z',
            updated_at: '2023-10-05T09:30:00.000Z'
          },
          {
            id: 'template2',
            name: 'Tennis Pro Circuit',
            description: 'Professional tennis tournament structure with advanced scoring rules',
            sport_type: 'tennis',
            created_by: 'coach1',
            settings: {
              divisions: [
                {
                  name: "Men's Singles Pro",
                  type: 'singles',
                  gender: 'male'
                },
                {
                  name: "Women's Singles Pro",
                  type: 'singles',
                  gender: 'female'
                }
              ],
              scoring_rules: {
                points_per_set: 6,
                sets_to_win: 3,
                points_to_win_set: 6,
                point_differential: 2,
                tiebreaker_rules: {
                  enabled: true,
                  at_games: 6,
                  points: 7
                }
              },
              schedule_settings: {
                court_count: 2,
                match_duration_minutes: 90,
                break_between_matches_minutes: 20
              }
            },
            format: 'elimination',
            categories: ['singles', 'professional'],
            is_public: true,
            usage_count: 8,
            tags: ['tennis', 'pro', 'advanced'],
            created_at: '2023-08-10T10:15:00.000Z',
            updated_at: '2023-09-22T16:45:00.000Z'
          },
          {
            id: 'template3',
            name: 'Volleyball Round Robin',
            description: 'Round robin tournament format for volleyball teams',
            sport_type: 'volleyball',
            created_by: 'admin',
            settings: {
              divisions: [
                {
                  name: "Men's Team",
                  type: 'team',
                  gender: 'male'
                },
                {
                  name: "Women's Team",
                  type: 'team',
                  gender: 'female'
                },
                {
                  name: "Mixed Team",
                  type: 'team',
                  gender: 'mixed'
                }
              ],
              scoring_rules: {
                points_per_set: 25,
                sets_to_win: 2,
                points_to_win_set: 25,
                point_differential: 2
              },
              schedule_settings: {
                court_count: 2,
                match_duration_minutes: 60,
                break_between_matches_minutes: 15
              }
            },
            format: 'round_robin',
            categories: ['team', 'recreational', 'competitive'],
            is_public: true,
            usage_count: 12,
            tags: ['volleyball', 'round robin', 'team sport'],
            created_at: '2023-07-22T08:30:00.000Z',
            updated_at: '2023-08-15T11:20:00.000Z'
          },
          {
            id: 'template4',
            name: 'Badminton Youth Tournament',
            description: 'Tailored for younger players with age divisions and simplified rules',
            sport_type: 'badminton',
            created_by: user?.id || 'unknown',
            settings: {
              divisions: [
                {
                  name: "Under 12 Singles",
                  type: 'singles',
                  max_age: 12
                },
                {
                  name: "Under 16 Singles",
                  type: 'singles',
                  max_age: 16
                }
              ],
              scoring_rules: {
                points_per_set: 15,
                sets_to_win: 2,
                points_to_win_set: 15,
                point_differential: 2
              }
            },
            format: 'elimination',
            categories: ['youth', 'singles', 'beginners'],
            is_public: false,
            usage_count: 3,
            tags: ['badminton', 'youth', 'beginner'],
            created_at: '2023-10-01T09:00:00.000Z',
            updated_at: '2023-10-01T09:00:00.000Z'
          }
        ];
        
        setTemplates(mockTemplates);
        
        // Extract unique sport types
        const sports = Array.from(new Set(mockTemplates.map(t => t.sport_type)));
        setSportTypes(sports);
        
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Apply filtering and sorting
  const filteredAndSortedTemplates = templates
    .filter(template => {
      // Filter by search term
      if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !template.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // Filter by sport type
      if (filterSport !== 'all' && template.sport_type !== filterSport) {
        return false;
      }
      
      // Filter by owner
      if (filterOwner === 'mine' && template.created_by !== user?.id) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Get values based on sort field
      switch (sortField) {
        case 'name':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'sport_type':
          valueA = a.sport_type;
          valueB = b.sport_type;
          break;
        case 'usage_count':
          valueA = a.usage_count;
          valueB = b.usage_count;
          break;
        case 'created_at':
        default:
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
      }
      
      // Apply sort direction
      const sortMultiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortMultiplier * valueA.localeCompare(valueB);
      }
      
      return sortMultiplier * (valueA - valueB);
    });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <CardTitle>Tournament Templates</CardTitle>
          {onCreateTemplate && (
            <Button onClick={onCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" /> New Template
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterSport} onValueChange={setFilterSport}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map((sport) => (
                  <SelectItem key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="mine">My Templates</SelectItem>
                <SelectItem value="public">Public Templates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Templates table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No templates found matching your criteria.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button variant="ghost" onClick={() => handleSort('name')} className="flex items-center p-0">
                        Name
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('sport_type')} className="flex items-center p-0">
                        Sport
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Format</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" onClick={() => handleSort('usage_count')} className="flex items-center p-0">
                        Usage
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Tags</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTemplates.map((template) => (
                    <TableRow 
                      key={template.id}
                      className={selectedTemplateId === template.id ? 'bg-muted/50' : undefined}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div>{template.name}</div>
                          <div className="text-xs text-muted-foreground hidden md:block">{template.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.sport_type.charAt(0).toUpperCase() + template.sport_type.slice(1)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {template.format.charAt(0).toUpperCase() + template.format.slice(1)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {template.usage_count} uses
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={selectedTemplateId === template.id ? "default" : "outline"}
                          onClick={() => onSelectTemplate && onSelectTemplate(template)}
                          size="sm"
                        >
                          {selectedTemplateId === template.id ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateList;
