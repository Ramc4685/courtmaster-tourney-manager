
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScoringSettings } from "@/types/tournament";

interface TournamentScoringFormProps {
  scoringSettings: ScoringSettings;
  onSettingsChange: (settings: ScoringSettings) => void;
}

const TournamentScoringForm: React.FC<TournamentScoringFormProps> = ({ 
  scoringSettings,
  onSettingsChange
}) => {
  // Handle input changes
  const handleMaxPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onSettingsChange({
        ...scoringSettings,
        maxPoints: value
      });
    }
  };

  const handleMaxSetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onSettingsChange({
        ...scoringSettings,
        maxSets: value
      });
    }
  };

  const handleTwoPointLeadChange = (checked: boolean) => {
    onSettingsChange({
      ...scoringSettings,
      requireTwoPointLead: checked
    });
  };

  const handleMaxTwoPointLeadScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onSettingsChange({
        ...scoringSettings,
        maxTwoPointLeadScore: value
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Scoring Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxPoints">Points to Win a Set</Label>
            <Input
              id="maxPoints"
              type="number"
              min="1"
              value={scoringSettings.maxPoints}
              onChange={handleMaxPointsChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxSets">Sets to Win a Match</Label>
            <Input
              id="maxSets"
              type="number"
              min="1"
              value={scoringSettings.maxSets}
              onChange={handleMaxSetsChange}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="requireTwoPointLead"
            checked={scoringSettings.requireTwoPointLead}
            onCheckedChange={handleTwoPointLeadChange}
          />
          <Label htmlFor="requireTwoPointLead">Require Two-Point Lead to Win</Label>
        </div>
        
        {scoringSettings.requireTwoPointLead && (
          <div className="space-y-2">
            <Label htmlFor="maxTwoPointLeadScore">
              Maximum Score (when Two-Point Lead Required)
            </Label>
            <Input
              id="maxTwoPointLeadScore"
              type="number"
              min={scoringSettings.maxPoints + 1}
              value={scoringSettings.maxTwoPointLeadScore || scoringSettings.maxPoints + 10}
              onChange={handleMaxTwoPointLeadScoreChange}
            />
            <p className="text-sm text-muted-foreground">
              If the score reaches this value, the player with this score wins regardless of point difference.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentScoringForm;
