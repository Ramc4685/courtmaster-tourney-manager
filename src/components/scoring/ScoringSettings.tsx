
import React from "react";
import { Trophy, Flag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface ScoringSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxPoints: number;
  setMaxPoints: (points: number) => void;
  maxSets: number;
  setMaxSets: (sets: number) => void;
}

const ScoringSettings: React.FC<ScoringSettingsProps> = ({
  open,
  onOpenChange,
  maxPoints,
  setMaxPoints,
  maxSets,
  setMaxSets
}) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (maxPoints < 1 || maxSets < 1) {
      toast({
        title: "Invalid settings",
        description: "Points per game and sets per match must be at least 1",
        variant: "destructive"
      });
      return;
    }
    
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
          <DialogTitle>Scoring Settings</DialogTitle>
          <DialogDescription>
            Configure match scoring rules
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
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(parseInt(e.target.value) || 21)}
                  min={1}
                  max={99}
                  className="w-24"
                />
                <p className="text-sm text-gray-500">
                  Points needed to win a set (requires 2-point lead)
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
                  value={maxSets}
                  onChange={(e) => setMaxSets(parseInt(e.target.value) || 3)}
                  min={1}
                  max={9}
                  className="w-24"
                />
                <p className="text-sm text-gray-500">
                  Best of {maxSets} sets to win a match
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScoringSettings;
