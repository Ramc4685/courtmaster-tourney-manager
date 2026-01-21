import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Check,
  Plus
} from 'lucide-react';

interface Sport {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  icon: string;
  supportedFormats: string[];
  defaultSettings: {
    matchDuration?: string;
    scoringSystem?: string;
    maxPlayers?: number;
  };
}

interface SportSelectionStepProps {
  selectedSport: string | null;
  onSportSelect: (sportId: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const SportSelectionStep: React.FC<SportSelectionStepProps> = ({
  selectedSport,
  onSportSelect,
  onNext,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomSport, setShowCustomSport] = useState(false);
  const [customSportName, setCustomSportName] = useState('');

  const sports: Sport[] = [
    {
      id: 'tennis',
      name: 'Tennis',
      description: 'Classic racquet sport with singles and doubles formats',
      category: 'Racquet Sports',
      popularity: 95,
      icon: '🎾',
      supportedFormats: ['single-elimination', 'double-elimination', 'round-robin'],
      defaultSettings: {
        matchDuration: '90 minutes',
        scoringSystem: 'sets',
        maxPlayers: 2
      }
    },
    {
      id: 'pickleball',
      name: 'Pickleball',
      description: 'Fast-growing paddle sport combining tennis, badminton, and ping pong',
      category: 'Racquet Sports',
      popularity: 90,
      icon: '🏓',
      supportedFormats: ['single-elimination', 'round-robin', 'swiss-system'],
      defaultSettings: {
        matchDuration: '45 minutes',
        scoringSystem: 'rally',
        maxPlayers: 4
      }
    },
    {
      id: 'badminton',
      name: 'Badminton',
      description: 'Racquet sport played with shuttlecocks',
      category: 'Racquet Sports',
      popularity: 75,
      icon: '🏸',
      supportedFormats: ['single-elimination', 'double-elimination', 'round-robin'],
      defaultSettings: {
        matchDuration: '60 minutes',
        scoringSystem: 'rally',
        maxPlayers: 4
      }
    },
    {
      id: 'table-tennis',
      name: 'Table Tennis',
      description: 'Indoor racquet sport also known as ping pong',
      category: 'Racquet Sports',
      popularity: 80,
      icon: '🏓',
      supportedFormats: ['single-elimination', 'round-robin', 'swiss-system'],
      defaultSettings: {
        matchDuration: '30 minutes',
        scoringSystem: 'sets',
        maxPlayers: 2
      }
    },
    {
      id: 'chess',
      name: 'Chess',
      description: 'Strategic board game between two players',
      category: 'Board Games',
      popularity: 85,
      icon: '♟️',
      supportedFormats: ['swiss-system', 'round-robin', 'single-elimination'],
      defaultSettings: {
        matchDuration: '120 minutes',
        scoringSystem: 'points',
        maxPlayers: 2
      }
    },
    {
      id: 'basketball',
      name: 'Basketball',
      description: 'Team sport played on a court with hoops',
      category: 'Team Sports',
      popularity: 88,
      icon: '🏀',
      supportedFormats: ['single-elimination', 'double-elimination'],
      defaultSettings: {
        matchDuration: '48 minutes',
        scoringSystem: 'points',
        maxPlayers: 10
      }
    },
    {
      id: 'volleyball',
      name: 'Volleyball',
      description: 'Team sport played with a net and volleyball',
      category: 'Team Sports',
      popularity: 70,
      icon: '🏐',
      supportedFormats: ['single-elimination', 'round-robin'],
      defaultSettings: {
        matchDuration: '90 minutes',
        scoringSystem: 'sets',
        maxPlayers: 12
      }
    },
    {
      id: 'golf',
      name: 'Golf',
      description: 'Individual sport played on courses with clubs and balls',
      category: 'Individual Sports',
      popularity: 65,
      icon: '⛳',
      supportedFormats: ['swiss-system', 'round-robin'],
      defaultSettings: {
        matchDuration: '4 hours',
        scoringSystem: 'strokes',
        maxPlayers: 4
      }
    }
  ];

  const filteredSports = sports.filter(sport =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sport.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sport.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSports = filteredSports.reduce((groups, sport) => {
    const category = sport.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(sport);
    return groups;
  }, {} as Record<string, Sport[]>);

  const handleCustomSportAdd = () => {
    if (customSportName.trim()) {
      const customSport: Sport = {
        id: `custom-${Date.now()}`,
        name: customSportName.trim(),
        description: 'Custom sport',
        category: 'Custom',
        popularity: 0,
        icon: '🏆',
        supportedFormats: ['single-elimination', 'round-robin'],
        defaultSettings: {
          matchDuration: '60 minutes',
          scoringSystem: 'points',
          maxPlayers: 2
        }
      };

      onSportSelect(customSport.id);
      setCustomSportName('');
      setShowCustomSport(false);
    }
  };

  const getPopularityBadge = (popularity: number) => {
    if (popularity >= 90) return { color: 'bg-green-100 text-green-800', label: 'Very Popular' };
    if (popularity >= 75) return { color: 'bg-blue-100 text-blue-800', label: 'Popular' };
    if (popularity >= 60) return { color: 'bg-yellow-100 text-yellow-800', label: 'Moderate' };
    return { color: 'bg-gray-100 text-gray-800', label: 'Niche' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Select Your Sport</h2>
        <p className="text-gray-600 mt-2">
          Choose the sport for your tournament. This will determine available formats and settings.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Sports Grid */}
      <div className="space-y-6">
        {Object.entries(groupedSports).map(([category, categorySpports]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySpports.map((sport) => {
                const isSelected = selectedSport === sport.id;
                const popularityBadge = getPopularityBadge(sport.popularity);

                return (
                  <Card
                    key={sport.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary border-primary' : ''
                    }`}
                    onClick={() => onSportSelect(sport.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{sport.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{sport.name}</CardTitle>
                            <Badge className={popularityBadge.color}>
                              {popularityBadge.label}
                            </Badge>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {sport.description}
                      </CardDescription>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">Supported Formats:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sport.supportedFormats.map((format) => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.replace('-', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Match Duration:</span>
                          <span>{sport.defaultSettings.matchDuration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Max Players:</span>
                          <span>{sport.defaultSettings.maxPlayers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Sport */}
      <div className="border-t pt-6">
        <div className="text-center">
          {!showCustomSport ? (
            <Button
              variant="outline"
              onClick={() => setShowCustomSport(true)}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Sport
            </Button>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-lg">Add Custom Sport</CardTitle>
                <CardDescription>
                  Create a tournament for a sport not listed above
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Sport name (e.g., Cornhole, Esports)"
                  value={customSportName}
                  onChange={(e) => setCustomSportName(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCustomSport(false);
                      setCustomSportName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCustomSportAdd} disabled={!customSportName.trim()}>
                    Add Sport
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {filteredSports.length === 0 && !showCustomSport && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sports Found</h3>
            <p className="text-gray-500 mb-4">
              No sports match your search criteria. Try a different search term or add a custom sport.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <Button
          onClick={onNext}
          disabled={!selectedSport}
        >
          Next: Choose Format
        </Button>
      </div>
    </div>
  );
};