
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle } from "lucide-react";
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
  saveMatch
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <ScoringContainer isLoading={true} />
    );
  }

  if (!match) {
    return (
      <ScoringContainer 
        errorMessage="Match Not Found"
      />
    );
  }

  return (
    <ScoringContainer>
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">
          Standalone Match Scoring
        </h1>
        {saveMatch && (
          <Button 
            variant="outline" 
            onClick={saveMatch}
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
      
      {scoringMatch && (
        <ScoringMatchDetail
          match={scoringMatch}
          onScoreChange={handleScoreChange}
          onNewSet={() => setNewSetDialogOpen(true)}
          onCompleteMatch={() => setCompleteMatchDialogOpen(true)}
          currentSet={currentSet}
          onSetChange={setCurrentSet}
        />
      )}

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
        selectedMatch={selectedMatch}
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
