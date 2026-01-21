import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentTemplateSelector } from '@/components/templates/TournamentTemplateSelector';
import {
  Check,
  Zap,
  Settings,
  Sparkles
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

interface TemplateSelectionStepProps {
  selectedTemplate: TournamentTemplate | null;
  selectedSport: string;
  onTemplateSelect: (template: TournamentTemplate | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  selectedTemplate,
  selectedSport,
  onTemplateSelect,
  onNext,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'templates' | 'custom'>('quick');

  // Quick start options based on selected sport
  const getQuickStartOptions = () => {
    const baseOptions = [
      {
        id: 'quick-single-elim',
        name: 'Single Elimination',
        description: 'Classic bracket tournament - fast and competitive',
        icon: '⚡',
        pros: ['Quick tournament', 'Clear winner', 'Exciting knockouts'],
        cons: ['Early elimination', 'No second chances'],
        bestFor: 'Competitive tournaments with time constraints',
        maxParticipants: 64,
        estimatedDuration: '1-2 days'
      },
      {
        id: 'quick-round-robin',
        name: 'Round Robin',
        description: 'Everyone plays everyone - fair and inclusive',
        icon: '🔄',
        pros: ['Everyone plays multiple games', 'Fair ranking', 'No early elimination'],
        cons: ['Longer tournament', 'More matches needed'],
        bestFor: 'Social tournaments and skill development',
        maxParticipants: 16,
        estimatedDuration: '2-3 days'
      },
      {
        id: 'quick-double-elim',
        name: 'Double Elimination',
        description: 'Second chance tournament - competitive but forgiving',
        icon: '🏆',
        pros: ['Second chance for players', 'More matches', 'Fair outcomes'],
        cons: ['Complex bracket', 'Longer duration'],
        bestFor: 'Competitive tournaments with skilled players',
        maxParticipants: 32,
        estimatedDuration: '2-3 days'
      }
    ];

    // Customize based on sport
    if (selectedSport === 'chess') {
      baseOptions.push({
        id: 'quick-swiss',
        name: 'Swiss System',
        description: 'Pair players with similar scores - strategic and balanced',
        icon: '♟️',
        pros: ['Balanced matches', 'No elimination', 'Strategic pairing'],
        cons: ['Complex scoring', 'Requires planning'],
        bestFor: 'Chess tournaments and skill-based competitions',
        maxParticipants: 50,
        estimatedDuration: '3-5 days'
      });
    }

    return baseOptions;
  };

  const quickStartOptions = getQuickStartOptions();

  const handleQuickStart = (optionId: string) => {
    const option = quickStartOptions.find(opt => opt.id === optionId);
    if (!option) return;

    // Create a template from quick start option
    const quickTemplate: TournamentTemplate = {
      id: optionId,
      name: `${option.name} - ${selectedSport}`,
      description: option.description,
      sportType: selectedSport,
      format: optionId.replace('quick-', '').replace('-elim', '-elimination'),
      categories: ['quick-start'],
      isPublic: false,
      usageCount: 0,
      tags: ['quick-start'],
      createdBy: 'wizard',
      settings: {
        maxParticipants: option.maxParticipants,
        defaultDuration: option.estimatedDuration,
        scoringSystem: 'standard'
      }
    };

    onTemplateSelect(quickTemplate);
  };

  const handleCustomSetup = () => {
    // Create a blank template for custom setup
    const customTemplate: TournamentTemplate = {
      id: 'custom-setup',
      name: `Custom ${selectedSport} Tournament`,
      description: 'Custom tournament setup',
      sportType: selectedSport,
      format: 'custom',
      categories: ['custom'],
      isPublic: false,
      usageCount: 0,
      tags: ['custom'],
      createdBy: 'wizard',
      settings: {
        maxParticipants: 32,
        defaultDuration: '2 days',
        scoringSystem: 'standard'
      }
    };

    onTemplateSelect(customTemplate);
  };

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      tennis: '🎾',
      pickleball: '🏓',
      chess: '♟️',
      basketball: '🏀',
      badminton: '🏸',
      volleyball: '🏐',
      golf: '⛳'
    };
    return icons[sport] || '🏆';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Choose Tournament Setup</h2>
        <p className="text-gray-600 mt-2">
          Select how you want to set up your {selectedSport} tournament
        </p>
        <div className="flex items-center justify-center mt-3">
          <span className="text-2xl mr-2">{getSportIcon(selectedSport)}</span>
          <span className="text-lg font-medium capitalize">{selectedSport}</span>
        </div>
      </div>

      {/* Setup Options */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">
            <Zap className="h-4 w-4 mr-2" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Settings className="h-4 w-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* Quick Start Tab */}
        <TabsContent value="quick" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">Quick Start Options</h3>
            <p className="text-gray-600">Get started quickly with popular tournament formats</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickStartOptions.map((option) => {
              const isSelected = selectedTemplate?.id === option.id;

              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  onClick={() => handleQuickStart(option.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{option.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {option.estimatedDuration}
                          </CardDescription>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{option.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Max Players:</span>
                        <br />
                        <span>{option.maxParticipants}</span>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <br />
                        <span>{option.estimatedDuration}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Pros:</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        {option.pros.map((pro, index) => (
                          <li key={index}>• {pro}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-orange-700 mb-1">Cons:</p>
                      <ul className="text-xs text-orange-600 space-y-1">
                        {option.cons.map((con, index) => (
                          <li key={index}>• {con}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-gray-700">Best for:</p>
                      <p className="text-xs text-gray-600">{option.bestFor}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <TournamentTemplateSelector
            selectedSport={selectedSport}
            onSelect={onTemplateSelect}
          />
        </TabsContent>

        {/* Custom Tab */}
        <TabsContent value="custom" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">Custom Tournament Setup</h3>
            <p className="text-gray-600">Build your tournament from scratch with full control</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>Custom Tournament Builder</CardTitle>
                  <CardDescription>
                    Full control over all tournament settings and rules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">What you can customize:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Tournament format and rules</li>
                    <li>• Scoring system and match settings</li>
                    <li>• Registration requirements</li>
                    <li>• Court assignments and scheduling</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Advanced features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Custom bracket structures</li>
                    <li>• Multi-stage tournaments</li>
                    <li>• Special seeding rules</li>
                    <li>• Custom point systems</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">💡</div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Recommended for experienced organizers
                    </p>
                    <p className="text-xs text-blue-700">
                      Custom setup gives you complete control but requires more configuration time.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCustomSetup}
                className="w-full"
                variant={selectedTemplate?.id === 'custom-setup' ? 'default' : 'outline'}
              >
                {selectedTemplate?.id === 'custom-setup' && (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Start Custom Setup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Selected: {selectedTemplate.name}</h4>
                <p className="text-sm text-green-700">{selectedTemplate.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedTemplate}
        >
          Next: Tournament Details
        </Button>
      </div>
    </div>
  );
};