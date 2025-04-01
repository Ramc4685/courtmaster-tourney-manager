
import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoringContainer from "@/components/scoring/ScoringContainer";
import CourtSelectionPanel from "@/components/scoring/CourtSelectionPanel";
import ScoringMatchDetail from "@/components/scoring/ScoringMatchDetail";
import ScoringHeader from "@/components/scoring/ScoringHeader";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import ScoringConfirmationDialogs from "@/components/scoring/ScoringConfirmationDialogs";
import { Match, Tournament, Court } from "@/types/tournament";

// Fixed interface with correct types
interface TournamentScoringProps {
  currentTournament: Tournament | null;
  tournamentId: string | undefined;
  activeView: "courts" | "match"; // Keep as "courts" | "match" to match existing code
  selectedMatch: Match | null;
  currentSet: number;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  scoringSettings: any;
  newSetDialogOpen: boolean;
  setNewSetDialogOpen: (open: boolean) => void;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  setCurrentSet: (set: number) => void;
  handleSelectCourt: (court: Court) => void; // Changed from courtNumber: number
  handleSelectMatch: (match: Match) => void;
  handleStartMatch: (matchId: string) => void; // Keep as string to match existing code
  handleScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  handleNewSet: () => void;
  handleCompleteMatch: () => void;
  handleUpdateScoringSettings: (settings: any) => void;
  handleBackToCourts: () => void;
  isPending?: boolean;
}

const TournamentScoring: React.FC<TournamentScoringProps> = ({
  currentTournament,
  tournamentId,
  activeView,
  selectedMatch,
  currentSet,
  settingsOpen,
  setSettingsOpen,
  scoringSettings,
  newSetDialogOpen,
  setNewSetDialogOpen,
  completeMatchDialogOpen,
  setCompleteMatchDialogOpen,
  setCurrentSet,
  handleSelectCourt,
  handleSelectMatch,
  handleStartMatch,
  handleScoreChange,
  handleNewSet,
  handleCompleteMatch,
  handleUpdateScoringSettings,
  handleBackToCourts,
  isPending
}) => {
  if (!currentTournament) {
    return (
      <ScoringContainer isLoading={true}>
        <p>Loading tournament data...</p>
      </ScoringContainer>
    );
  }

  return (
    <ScoringContainer>
      <div className="mb-6">
        <ScoringHeader 
          tournament={currentTournament} 
          onOpenSettings={() => setSettingsOpen(true)}
          isPending={isPending}
        />

        <div className="mb-4 flex items-center justify-start">
          <Link to={`/tournaments/${tournamentId}`}>
            <Button variant="outline">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Tournament
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {activeView === "courts" ? (
          /* Court selection view */
          <CourtSelectionPanel
            courts={currentTournament.courts}
            matches={currentTournament.matches}
            onCourtSelect={handleSelectCourt}
            onMatchSelect={handleSelectMatch}
            onStartMatch={(match) => handleStartMatch(match.id)}
          />
        ) : (
          /* Match scoring view */
          <>
            <Button 
              variant="outline" 
              className="mb-4" 
              onClick={handleBackToCourts}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Courts
            </Button>
            
            {selectedMatch && (
              <ScoringMatchDetail
                match={selectedMatch}
                onScoreChange={handleScoreChange}
                onNewSet={() => setNewSetDialogOpen(true)}
                onCompleteMatch={() => setCompleteMatchDialogOpen(true)}
                currentSet={currentSet}
                onSetChange={setCurrentSet}
                isPending={isPending}
              />
            )}
          </>
        )}
      </div>

      {/* Scoring Settings Dialog */}
      <ScoringSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        settings={scoringSettings}
        onSettingsChange={handleUpdateScoringSettings}
        title="Tournament Scoring Settings"
        description="Configure scoring rules for this tournament"
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

export default TournamentScoring;
