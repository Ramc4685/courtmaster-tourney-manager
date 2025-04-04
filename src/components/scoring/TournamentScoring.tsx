
import React from 'react';
import ScoringContainer from './ScoringContainer';
import { Tournament, Match, Court } from '@/types/tournament';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourtView from './tournament/CourtView';
import MatchView from './tournament/MatchView';
import { ArrowLeft } from 'lucide-react';
import { courtToCourtNumber, scoreChangeAdapter } from './adapters/scoringAdapters';

type ScoringView = "match" | "courts";

interface TournamentScoringProps {
  currentTournament: Tournament | null;
  tournamentId: string;
  activeView: ScoringView;
  selectedMatch: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  scoringSettings: any;
  newSetDialogOpen: boolean;
  setNewSetDialogOpen: (open: boolean) => void;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  onSelectMatch: (match: Match) => void;
  onSelectCourt: (court: Court) => void;
  courts: Court[];
  onScoreChange: (team1Score: number, team2Score: number) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  isPending?: boolean;
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
  setActiveView: (view: "courts") => void;
  onCourtChange?: (courtNumber: number) => void;
}

const TournamentScoring: React.FC<TournamentScoringProps> = ({
  currentTournament,
  tournamentId,
  activeView,
  selectedMatch,
  currentSet,
  setCurrentSet,
  settingsOpen,
  setSettingsOpen,
  scoringSettings,
  newSetDialogOpen,
  setNewSetDialogOpen,
  completeMatchDialogOpen,
  setCompleteMatchDialogOpen,
  onSelectMatch,
  onSelectCourt,
  courts,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  isPending = false,
  scorerName,
  onScorerNameChange,
  setActiveView,
  onCourtChange
}) => {
  if (!currentTournament) {
    return <ScoringContainer errorMessage="Tournament not found" />;
  }

  // Adapter function to handle court selection
  const handleCourtSelection = (court: Court) => {
    onSelectCourt(court);
  };

  // Adapter function to handle score changes
  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
    // Calculate the new scores based on team and increment
    if (!selectedMatch) return;
    
    const currentScore = selectedMatch.scores[currentSet] || { team1Score: 0, team2Score: 0 };
    let team1Score = currentScore.team1Score;
    let team2Score = currentScore.team2Score;
    
    if (team === "team1") {
      team1Score = increment ? team1Score + 1 : Math.max(0, team1Score - 1);
    } else {
      team2Score = increment ? team2Score + 1 : Math.max(0, team2Score - 1);
    }
    
    // Pass the new scores to the original handler
    onScoreChange(team1Score, team2Score);
  };

  // Adapter function to handle court number changes
  const handleCourtChange = (courtNumber: number) => {
    if (onCourtChange) {
      onCourtChange(courtNumber);
    }
  };

  return (
    <ScoringContainer>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{currentTournament.name}</h1>
        
        {activeView === "match" && (
          <Button 
            variant="outline" 
            onClick={() => setActiveView("courts")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courts
          </Button>
        )}
      </div>

      {activeView === "courts" ? (
        <CourtView
          tournament={currentTournament}
          courts={courts}
          onSelectCourt={handleCourtSelection}
          onSelectMatch={onSelectMatch}
        />
      ) : (
        <MatchView 
          match={selectedMatch}
          currentSet={currentSet}
          setCurrentSet={setCurrentSet}
          onNewSet={onNewSet}
          onCompleteMatch={onCompleteMatch}
          onScoreChange={handleScoreChange}
          isPending={isPending}
          scorerName={scorerName}
          onScorerNameChange={onScorerNameChange}
          onCourtChange={handleCourtChange}
        />
      )}
      
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

export default TournamentScoring;
