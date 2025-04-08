import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match, MatchScore } from '@/types/tournament';
import { ScoringSettings } from '@/types/scoring';
import { countSetsWon } from '@/utils/matchUtils';

interface NewSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  match: Match | null;
  scoringSettings: ScoringSettings;
}

export const NewSetDialog: React.FC<NewSetDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  match,
  scoringSettings,
}) => {
  if (!match) return null;

  const team1Name = match.team1?.name || 'Team 1';
  const team2Name = match.team2?.name || 'Team 2';

  // Use the countSetsWon function to determine score status
  const team1Sets = match.scores ? countSetsWon(match.scores, "team1") : 0;
  const team2Sets = match.scores ? countSetsWon(match.scores, "team2") : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Set</DialogTitle>
          <DialogDescription>
            Current score: {team1Name} {team1Sets} - {team2Sets} {team2Name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to start a new set?</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current set will be saved and a new set will be started.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}>
            Start New Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CompleteMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  match: Match | null;
  scoringSettings: ScoringSettings;
}

export const CompleteMatchDialog: React.FC<CompleteMatchDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  match,
  scoringSettings,
}) => {
  if (!match) return null;

  const team1Name = match.team1?.name || 'Team 1';
  const team2Name = match.team2?.name || 'Team 2';

  // Use the countSetsWon function to determine score status
  const team1Sets = match.scores ? countSetsWon(match.scores, "team1") : 0;
  const team2Sets = match.scores ? countSetsWon(match.scores, "team2") : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Match</DialogTitle>
          <DialogDescription>
            Current score: {team1Name} {team1Sets} - {team2Sets} {team2Name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to complete this match?</p>
          <p className="text-sm text-muted-foreground mt-2">
            The match will be marked as completed and no further changes can be made.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}>
            Complete Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
