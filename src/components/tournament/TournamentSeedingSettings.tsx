
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TournamentStageEnum } from "@/types/tournament-enums";

interface TournamentSeedingSettingsProps {
  useSeeding: boolean;
  onUseSeedingChange: (value: boolean) => void;
  stagesToSeed: string[];
  onStagesToSeedChange: (stages: string[]) => void;
}

const stageOptions: { value: string; label: string }[] = [
  { value: TournamentStageEnum.INITIAL_ROUND, label: "Initial Round" },
  { value: TournamentStageEnum.DIVISION_PLACEMENT, label: "Division Placement" },
  { value: TournamentStageEnum.PLAYOFF_KNOCKOUT, label: "Playoff Knockout" }
];

const TournamentSeedingSettings: React.FC<TournamentSeedingSettingsProps> = ({
  useSeeding,
  onUseSeedingChange,
  stagesToSeed,
  onStagesToSeedChange
}) => {
  const toggleStageSeeding = (stage: string) => {
    if (stagesToSeed.includes(stage)) {
      onStagesToSeedChange(stagesToSeed.filter(s => s !== stage));
    } else {
      onStagesToSeedChange([...stagesToSeed, stage]);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Tournament Seeding</CardTitle>
        <CardDescription>
          Configure how players are seeded throughout the tournament stages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="use-seeding">Use Player Seeding</Label>
            <p className="text-sm text-muted-foreground">
              Seed players 1-38 based on their initial ranking
            </p>
          </div>
          <Switch
            id="use-seeding"
            checked={useSeeding}
            onCheckedChange={onUseSeedingChange}
          />
        </div>

        {useSeeding && (
          <>
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label>Stages to Apply Seeding</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select which tournament stages should use player seeding
              </p>
              
              <div className="space-y-2">
                {stageOptions.map(stage => (
                  <div key={stage.value} className="flex items-center justify-between">
                    <span>{stage.label}</span>
                    <Badge 
                      variant={stagesToSeed.includes(stage.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleStageSeeding(stage.value)}
                    >
                      {stagesToSeed.includes(stage.value) ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> For the multi-stage tournament with 38 players, 
                seeding is required for proper progression through divisions.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentSeedingSettings;
