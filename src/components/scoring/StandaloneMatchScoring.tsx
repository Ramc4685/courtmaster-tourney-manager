
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoringMatchDetail from "@/components/scoring/ScoringMatchDetail";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import ScoringConfirmationDialogs from "@/components/scoring/ScoringConfirmationDialogs";
import ScoringContainer from "@/components/scoring/ScoringContainer";
import { Match } from "@/types/tournament";

interface StandaloneMatchScoringProps {
  isLoading: boolean;
  match: Match | null;
  scoringMatch: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  scoringSettings: any;
  handleUpdateScoringSettings: (settings: any) => void;
  newSetDialogOpen: boolean;
  setNewSetDialogOpen: (open: boolean) => void;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  handleScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  handleNewSet: () => void;
  handleCompleteMatch: () => void;
  selectedMatch: Match | null;
  saveMatch?: () => void;
  isPending?: boolean;
}

const StandaloneMatchScoring: React.FC<StandaloneMatchScoringProps> = ({
  isLoading,
  match,
  scoringMatch,
  currentSet,
  setCurrentSet,
  settingsOpen,
  setSettingsOpen,
  scoringSettings,
  handleUpdateScoringSettings,
  newSetDialogOpen,
  setNewSetDialogOpen,
  completeMatchDialogOpen,
  setCompleteMatchDialogOpen,
  handleScoreChange,
  handleNewSet,
  handleCompleteMatch,
  selectedMatch,
  saveMatch,
  isPending = false
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <ScoringContainer isLoading={true}>
        <p>Loading match data...</p>
      </ScoringContainer>
    );
  }

  if (!match && !scoringMatch) {
    return (
      <ScoringContainer errorMessage="Match Not Found">
        <p>The requested match could not be found.</p>
      </ScoringContainer>
    );
  }

  // Use the scoringMatch for ScoringMatchDetail since it's compatible with the scoring component
  // Fall back to selectedMatch if available, which is already formatted properly
  const matchForScoring = scoringMatch || selectedMatch || match;
  
  if (!matchForScoring) {
    return (
      <ScoringContainer errorMessage="Match Data Issue">
        <p>There was a problem loading the match data. Please try again.</p>
      </ScoringContainer>
    );
  }

  return (
    <ScoringContainer>
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">
          Standalone Match Scoring
          {isPending && (
            <span className="ml-2 inline-flex items-center text-amber-600 text-sm font-normal">
              <span className="animate-pulse rounded-full w-2 h-2 bg-amber-500 mr-1"></span>
              Processing...
            </span>
          )}
        </h1>
        {saveMatch && (
          <Button 
            variant="outline" 
            onClick={saveMatch}
            disabled={isPending}
          >
            Save Match
          </Button>
        )}
      </div>
      
      <Button 
        variant="outline" 
        className="mb-4" 
        onClick={() => navigate("/quick-match")}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Quick Match
      </Button>
      
      <ScoringMatchDetail
        match={matchForScoring}
        onScoreChange={handleScoreChange}
        onNewSet={() => setNewSetDialogOpen(true)}
        onCompleteMatch={() => setCompleteMatchDialogOpen(true)}
        currentSet={currentSet}
        onSetChange={setCurrentSet}
        isPending={isPending}
      />

      {/* Scoring Settings Dialog */}
      <ScoringSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        settings={scoringSettings}
        onSettingsChange={handleUpdateScoringSettings}
        title="Badminton Scoring Settings"
        description="Configure badminton match scoring rules"
      />

      {/* Confirmation Dialogs for New Set and Complete Match */}
      <ScoringConfirmationDialogs
        selectedMatch={matchForScoring}
        currentSet={currentSet}
        newSetDialogOpen={newSetDialogOpen}
        setNewSetDialogOpen={setNewSetDialogOpen}
        completeMatchDialogOpen={completeMatchDialogOpen}
        setCompleteMatchDialogOpen={setCompleteMatchDialogOpen}
        onNewSet={handleNewSet}
        onCompleteMatch={handleCompleteMatch}
      />
    </ScoringContainer>
  );
};

export default StandaloneMatchScoring;
