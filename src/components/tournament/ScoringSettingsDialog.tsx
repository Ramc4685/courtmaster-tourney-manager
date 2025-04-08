
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tournament, ScoringSettings } from '@/types/tournament';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/use-toast';
import { useTournament } from '@/contexts/tournament/useTournament';

interface ScoringSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
}

export const ScoringSettingsDialog: React.FC<ScoringSettingsDialogProps> = ({
  open,
  onOpenChange,
  tournament
}) => {
  const { updateTournament } = useTournament();
  
  // Parse the current scoring settings or use defaults
  const currentSettings = tournament.scoringRules ? 
    JSON.parse(tournament.scoringRules as string) : 
    { pointsToWin: 21, mustWinByTwo: true, maxPoints: 30 };
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      pointsToWin: currentSettings.pointsToWin || 21,
      mustWinByTwo: currentSettings.mustWinByTwo ?? true,
      maxPoints: currentSettings.maxPoints || 30,
      maxSets: currentSettings.maxSets || 3
    }
  });

  const mustWinByTwo = watch('mustWinByTwo');

  const onSubmit = async (data: any) => {
    try {
      // Update the tournament with new scoring settings
      await updateTournament(tournament.id, {
        scoringRules: JSON.stringify(data),
        updatedAt: new Date()
      });

      toast({
        title: "Settings Updated",
        description: "Scoring settings have been updated successfully."
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update scoring settings:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the scoring settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scoring Settings</DialogTitle>
          <DialogDescription>
            Configure how scoring works for this tournament
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pointsToWin">Points to Win</Label>
            <Input
              id="pointsToWin"
              type="number"
              {...register('pointsToWin', { 
                required: "Points to win is required",
                min: { value: 1, message: "Must be at least 1" }
              })}
            />
            {errors.pointsToWin && <p className="text-sm text-red-500">{errors.pointsToWin.message?.toString()}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="mustWinByTwo"
              {...register('mustWinByTwo')}
            />
            <Label htmlFor="mustWinByTwo">Must win by 2 points</Label>
          </div>
          
          {mustWinByTwo && (
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Maximum Points</Label>
              <Input
                id="maxPoints"
                type="number"
                {...register('maxPoints', { 
                  required: "Maximum points is required when 'must win by 2' is enabled",
                  min: { value: 1, message: "Must be at least 1" }
                })}
              />
              {errors.maxPoints && <p className="text-sm text-red-500">{errors.maxPoints.message?.toString()}</p>}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="maxSets">Maximum Sets</Label>
            <Input
              id="maxSets"
              type="number"
              {...register('maxSets', { 
                required: "Maximum sets is required",
                min: { value: 1, message: "Must be at least 1" },
                max: { value: 7, message: "Must not exceed 7" }
              })}
            />
            {errors.maxSets && <p className="text-sm text-red-500">{errors.maxSets.message?.toString()}</p>}
          </div>

          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScoringSettingsDialog;
