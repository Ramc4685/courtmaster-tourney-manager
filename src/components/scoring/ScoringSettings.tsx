
import React, { useState, useEffect } from "react";
import { Trophy, Flag, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ScoringSettings as ScoringSettingsType } from "@/types/tournament";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

interface ScoringSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ScoringSettingsType;
  onSettingsChange: (settings: ScoringSettingsType) => void;
  title?: string;
  description?: string;
}

const ScoringSettings: React.FC<ScoringSettingsProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  title = "Scoring Settings",
  description = "Configure match scoring rules"
}) => {
  // Use local state to track changes before submitting
  const [localSettings, setLocalSettings] = useState<ScoringSettingsType>(
    settings || getDefaultScoringSettings()
  );
  
  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSettings(settings || getDefaultScoringSettings());
    }
  }, [open, settings]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (localSettings.maxPoints < 1 || localSettings.maxSets < 1) {
      toast({
        title: "Invalid settings",
        description: "Points per game and sets per match must be at least 1",
        variant: "destructive"
      });
      return;
    }
    
    // Update parent state
    onSettingsChange(localSettings);
    
    toast({
      title: "Settings saved",
      description: "Scoring settings have been updated successfully"
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxPoints" className="flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                Points per Game
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="maxPoints"
                  type="number"
                  value={localSettings.maxPoints}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    maxPoints: parseInt(e.target.value) || 21
                  })}
                  min={1}
                  max={99}
                  className="w-24"
                />
                <p className="text-sm text-gray-500">
                  Points needed to win a set
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSets" className="flex items-center">
                <Flag className="h-4 w-4 mr-2" />
                Sets per Match
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="maxSets"
                  type="number"
                  value={localSettings.maxSets}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    maxSets: parseInt(e.target.value) || 3
                  })}
                  min={1}
                  max={9}
                  className="w-24"
                />
                <p className="text-sm text-gray-500">
                  Best of {localSettings.maxSets} sets to win a match
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twoPointLead" className="flex items-center">
                <Check className="h-4 w-4 mr-2" />
                Two-Point Lead Required
              </Label>
              <div className="flex items-center space-x-4">
                <Switch
                  id="twoPointLead"
                  checked={localSettings.requireTwoPointLead}
                  onCheckedChange={(checked) => setLocalSettings({
                    ...localSettings,
                    requireTwoPointLead: checked
                  })}
                />
                <p className="text-sm text-gray-500">
                  Player must win by 2 points (standard badminton rule)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-court-green hover:bg-court-green/90">
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScoringSettings;
