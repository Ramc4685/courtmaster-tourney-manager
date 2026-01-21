import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Trophy,
  Users,
  Calendar,
  Star,
  Filter
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
  settings: {
    maxParticipants?: number;
    defaultDuration?: string;
    scoringSystem?: string;
  };
}

interface TournamentTemplateSelectorProps {
  onSelect: (template: TournamentTemplate) => void;
  onCreateNew?: () => void;
  selectedSport?: string;
}

export const TournamentTemplateSelector: React.FC<TournamentTemplateSelectorProps> = ({
  onSelect,
  onCreateNew,
  selectedSport
}) => {
  const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TournamentTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState<string>(selectedSport || 'all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

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
      settings: {
        maxParticipants: 64,
        defaultDuration: '1 day',
        scoringSystem: 'standard'
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
      createdBy: 'system',
      settings: {
        maxParticipants: 16,
        defaultDuration: '2 days',
        scoringSystem: 'rally'
      }
    },
    {
      id: '3',
      name: 'Swiss System Chess',
      description: 'Swiss system tournament for chess competitions',
      sportType: 'chess',
      format: 'swiss-system',
      categories: ['strategic', 'rated'],
      isPublic: true,
      usageCount: 67,
      tags: ['strategic', 'fair'],
      createdBy: 'system',
      settings: {
        maxParticipants: 32,
        defaultDuration: '3 days',
        scoringSystem: 'points'
      }
    },
    {
      id: '4',
      name: 'Double Elimination Basketball',
      description: 'Double elimination bracket for basketball tournaments',
      sportType: 'basketball',
      format: 'double-elimination',
      categories: ['team', 'competitive'],
      isPublic: true,
      usageCount: 45,
      tags: ['forgiving', 'team'],
      createdBy: 'system',
      settings: {
        maxParticipants: 16,
        defaultDuration: '2 days',
        scoringSystem: 'game'
      }
    }
  ];

  useEffect(() => {
    // Simulate loading templates
    setTimeout(() => {
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by sport
    if (sportFilter !== 'all') {
      filtered = filtered.filter(template => template.sportType === sportFilter);
    }

    // Filter by format
    if (formatFilter !== 'all') {
      filtered = filtered.filter(template => template.format === formatFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, sportFilter, formatFilter]);

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
          <h2 className="text-2xl font-bold text-gray-900">Tournament Templates</h2>
          <p className="text-gray-600">Choose a template to get started quickly</p>
        </div>
        {onCreateNew && (
          <Button variant="outline" onClick={onCreateNew}>
            Create Custom Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            <SelectItem value="tennis">Tennis</SelectItem>
            <SelectItem value="pickleball">Pickleball</SelectItem>
            <SelectItem value="chess">Chess</SelectItem>
            <SelectItem value="basketball">Basketball</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="single-elimination">Single Elimination</SelectItem>
            <SelectItem value="double-elimination">Double Elimination</SelectItem>
            <SelectItem value="round-robin">Round Robin</SelectItem>
            <SelectItem value="swiss-system">Swiss System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelect(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getSportIcon(template.sportType)}</span>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.sportType.charAt(0).toUpperCase() + template.sportType.slice(1)}
                    </CardDescription>
                  </div>
                </div>
                {template.usageCount > 50 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>

              <div className="space-y-3">
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

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-500 mb-4">
              No templates match your current filters. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSportFilter('all');
              setFormatFilter('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};