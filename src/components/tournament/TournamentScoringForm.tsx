
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScoringSettings } from "@/types/tournament";

// Updated interface to support both ways of using the component
interface TournamentScoringFormProps {
  // Original props for backward compatibility
  scoringSettings?: ScoringSettings;
  onSettingsChange?: (settings: ScoringSettings) => void;
  
  // Individual props (used in TournamentCreate.tsx)
  maxPoints?: number;
  maxSets?: number;
  requireTwoPointLead?: boolean;
  maxTwoPointLeadScore?: number;
  onMaxPointsChange?: (value: number) => void;
  onMaxSetsChange?: (value: number) => void;
  onRequireTwoPointLeadChange?: (value: boolean) => void;
  onMaxTwoPointLeadScoreChange?: (value: number) => void;
}

const TournamentScoringForm: React.FC<TournamentScoringFormProps> = (props) => {
  // Determine which prop set to use (individual or object-based)
  const isUsingIndividualProps = props.maxPoints !== undefined;
  
  // Get values from appropriate prop source
  const maxPoints = isUsingIndividualProps 
    ? props.maxPoints 
    : props.scoringSettings?.maxPoints ?? 21;
    
  const maxSets = isUsingIndividualProps 
    ? props.maxSets 
    : props.scoringSettings?.maxSets ?? 3;
    
  const requireTwoPointLead = isUsingIndividualProps 
    ? props.requireTwoPointLead 
    : props.scoringSettings?.requireTwoPointLead ?? true;
    
  const maxTwoPointLeadScore = isUsingIndividualProps 
    ? props.maxTwoPointLeadScore 
    : props.scoringSettings?.maxTwoPointLeadScore;

  // Handle input changes based on prop pattern
  const handleMaxPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      if (isUsingIndividualProps && props.onMaxPointsChange) {
        props.onMaxPointsChange(value);
      } else if (props.onSettingsChange && props.scoringSettings) {
        props.onSettingsChange({
          ...props.scoringSettings,
          maxPoints: value
        });
      }
    }
  };

  const handleMaxSetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      if (isUsingIndividualProps && props.onMaxSetsChange) {
        props.onMaxSetsChange(value);
      } else if (props.onSettingsChange && props.scoringSettings) {
        props.onSettingsChange({
          ...props.scoringSettings,
          maxSets: value
        });
      }
    }
  };

  const handleTwoPointLeadChange = (checked: boolean) => {
    if (isUsingIndividualProps && props.onRequireTwoPointLeadChange) {
      props.onRequireTwoPointLeadChange(checked);
    } else if (props.onSettingsChange && props.scoringSettings) {
      props.onSettingsChange({
        ...props.scoringSettings,
        requireTwoPointLead: checked
      });
    }
  };

  const handleMaxTwoPointLeadScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      if (isUsingIndividualProps && props.onMaxTwoPointLeadScoreChange) {
        props.onMaxTwoPointLeadScoreChange(value);
      } else if (props.onSettingsChange && props.scoringSettings) {
        props.onSettingsChange({
          ...props.scoringSettings,
          maxTwoPointLeadScore: value
        });
      }
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
              value={maxPoints}
              onChange={handleMaxPointsChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxSets">Sets to Win a Match</Label>
            <Input
              id="maxSets"
              type="number"
              min="1"
              value={maxSets}
              onChange={handleMaxSetsChange}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="requireTwoPointLead"
            checked={requireTwoPointLead}
            onCheckedChange={handleTwoPointLeadChange}
          />
          <Label htmlFor="requireTwoPointLead">Require Two-Point Lead to Win</Label>
        </div>
        
        {requireTwoPointLead && (
          <div className="space-y-2">
            <Label htmlFor="maxTwoPointLeadScore">
              Maximum Score (when Two-Point Lead Required)
            </Label>
            <Input
              id="maxTwoPointLeadScore"
              type="number"
              min={maxPoints + 1}
              value={maxTwoPointLeadScore || maxPoints + 10}
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
