
import React, { useState } from "react";
import { Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import { Tournament, ScoringSettings as ScoringSettingsType } from "@/types/tournament";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

interface TournamentScoringSettingsSectionProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
}

const TournamentScoringSettingsSection: React.FC<TournamentScoringSettingsSectionProps> = ({
  tournament,
  onUpdateTournament
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Use tournament scoring settings or defaults
  const scoringSettings = tournament.scoringSettings || getDefaultScoringSettings();
  
  const handleUpdateScoringSettings = (newSettings: ScoringSettingsType) => {
    const updatedTournament = {
      ...tournament,
      scoringSettings: newSettings,
      updatedAt: new Date()
    };
    onUpdateTournament(updatedTournament);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Badminton Scoring Rules
          </CardTitle>
          <CardDescription>
            Configure scoring rules for all matches in this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Scoring Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <ScoringSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={scoringSettings}
        onSettingsChange={handleUpdateScoringSettings}
        title="Tournament Scoring Settings"
        description="Configure scoring rules for all matches in this tournament"
      />
    </>
  );
};

export default TournamentScoringSettingsSection;
