
import React from 'react';
import { Match } from '@/types/tournament';
import ScoringContainer from './ScoringContainer';
import ScoringMatchDetail from './ScoringMatchDetail';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface StandaloneMatchScoringProps {
  isLoading: boolean;
  match: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  scoringSettings: any;
  setNewSetDialogOpen: (open: boolean) => void;
  newSetDialogOpen: boolean;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  onSave: () => void;
  isPending?: boolean;
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
  onCourtChange?: (courtNumber: number) => void;
}

const StandaloneMatchScoring: React.FC<StandaloneMatchScoringProps> = ({
  isLoading,
  match,
  currentSet,
  setCurrentSet,
  settingsOpen,
  setSettingsOpen,
  scoringSettings,
  setNewSetDialogOpen,
  newSetDialogOpen,
  completeMatchDialogOpen,
  setCompleteMatchDialogOpen,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  onSave,
  isPending = false,
  scorerName,
  onScorerNameChange,
  onCourtChange
}) => {
  if (isLoading) {
    return <ScoringContainer isLoading />;
  }

  if (!match) {
    return <ScoringContainer errorMessage="Match not found" />;
  }

  // Create a handler for onScoreChange to prevent nested state updates
  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
    // Use requestAnimationFrame instead of setTimeout for better performance
    requestAnimationFrame(() => {
      onScoreChange(team, increment);
    });
  };

  return (
    <ScoringContainer>
      {/* Top action bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Match Scoring</h1>
        <Button onClick={onSave} disabled={isPending} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Match
        </Button>
      </div>
      
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Match ID</span>
            <div className="font-medium">{match.id}</div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status</span>
            <div className="font-medium">{match.status}</div>
          </div>
        </div>
      </Card>
      
      <Separator className="my-4" />
      
      {/* Scoring interface */}
      <ScoringMatchDetail
        match={match}
        onScoreChange={handleScoreChange}
        onNewSet={onNewSet}
        onCompleteMatch={onCompleteMatch}
        currentSet={currentSet}
        onSetChange={setCurrentSet}
        isPending={isPending}
        scorerName={scorerName}
        onScorerNameChange={onScorerNameChange}
        onCourtChange={onCourtChange}
      />
      
      {/* New Set Dialog */}
      <Dialog open={newSetDialogOpen} onOpenChange={setNewSetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Set</DialogTitle>
          </DialogHeader>
          <p>The current set has been completed. Would you like to start a new set?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSetDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              onNewSet();
              setNewSetDialogOpen(false);
            }}>Start New Set</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Complete Match Dialog */}
      <Dialog open={completeMatchDialogOpen} onOpenChange={setCompleteMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Match</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to complete this match? This will finalize the scores and determine the winner.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteMatchDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              onCompleteMatch();
              setCompleteMatchDialogOpen(false);
            }}>Complete Match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScoringContainer>
  );
};

export default StandaloneMatchScoring;
