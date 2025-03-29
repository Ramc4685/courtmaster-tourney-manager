
import React, { useState } from "react";
import { Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import { Tournament, TournamentCategory, ScoringSettings as ScoringSettingsType } from "@/types/tournament";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

interface CategoryScoringRulesProps {
  tournament: Tournament;
  category: TournamentCategory;
  onUpdateCategory: (updatedCategory: TournamentCategory) => void;
  onUpdateTournament: (updatedTournament: Tournament) => void;
}

const CategoryScoringRules: React.FC<CategoryScoringRulesProps> = ({
  tournament,
  category,
  onUpdateCategory,
  onUpdateTournament
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Determine if this category uses custom scoring settings
  const usesCustomScoring = !!category.scoringSettings;
  
  // Get the appropriate scoring settings
  const scoringSettings = category.scoringSettings || tournament.scoringSettings || getDefaultScoringSettings();
  
  const handleToggleCustomScoring = (enabled: boolean) => {
    if (enabled) {
      // When enabling custom scoring, copy the tournament's scoring settings as a starting point
      const updatedCategory = {
        ...category,
        scoringSettings: { ...(tournament.scoringSettings || getDefaultScoringSettings()) }
      };
      onUpdateCategory(updatedCategory);
    } else {
      // When disabling custom scoring, remove the category's scoring settings
      const { scoringSettings, ...categoryWithoutScoring } = category;
      onUpdateCategory(categoryWithoutScoring as TournamentCategory);
    }
  };
  
  const handleUpdateScoringSettings = (newSettings: ScoringSettingsType) => {
    if (usesCustomScoring) {
      // Update category-specific settings
      const updatedCategory = {
        ...category,
        scoringSettings: newSettings
      };
      onUpdateCategory(updatedCategory);
    } else {
      // Update tournament-wide settings
      const updatedTournament = {
        ...tournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      onUpdateTournament(updatedTournament);
    }
  };
  
  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <Trophy className="h-5 w-5 mr-2" />
              Scoring Rules {usesCustomScoring && "• Custom"}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="use-custom-scoring" className="text-sm">
                Use Different Scoring Rules
              </Label>
              <Switch
                id="use-custom-scoring"
                checked={usesCustomScoring}
                onCheckedChange={handleToggleCustomScoring}
              />
            </div>
          </div>
          <CardDescription>
            {usesCustomScoring 
              ? `Custom scoring rules for ${category.name} matches` 
              : `Using tournament default scoring rules`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Points per Set</p>
                <p className="text-lg font-semibold">{scoringSettings.maxPoints}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Sets per Match</p>
                <p className="text-lg font-semibold">Best of {scoringSettings.maxSets}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Two-Point Lead</p>
                <p className="text-lg font-semibold">{scoringSettings.requireTwoPointLead ? "Required" : "Not Required"}</p>
              </div>
              {scoringSettings.requireTwoPointLead && scoringSettings.maxTwoPointLeadScore && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Maximum Score Cap</p>
                  <p className="text-lg font-semibold">{scoringSettings.maxTwoPointLeadScore}</p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Scoring Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Scoring Settings Dialog */}
      <ScoringSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={scoringSettings}
        onSettingsChange={handleUpdateScoringSettings}
        title={usesCustomScoring ? `${category.name} Scoring Settings` : "Tournament Scoring Settings"}
        description={
          usesCustomScoring 
            ? `Configure custom scoring rules for ${category.name}` 
            : "Configure default scoring rules for all tournament matches"
        }
      />
    </>
  );
};

export default CategoryScoringRules;
