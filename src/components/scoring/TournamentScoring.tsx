
import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoringHeader from "@/components/scoring/ScoringHeader";
import CourtSelectionPanel from "@/components/scoring/CourtSelectionPanel";
import ScheduledMatchesList from "@/components/scoring/ScheduledMatchesList";
import ScoringMatchDetail from "@/components/scoring/ScoringMatchDetail";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import ScoringConfirmationDialogs from "@/components/scoring/ScoringConfirmationDialogs";
import ScoringContainer from "@/components/scoring/ScoringContainer";
import { Match, Court, Tournament } from "@/types/tournament";

interface TournamentScoringProps {
  currentTournament: Tournament | null;
  tournamentId?: string;
  activeView: "courts" | "scoring";
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
  handleSelectCourt: (court: Court) => void;
  handleSelectMatch: (match: Match) => void;
  handleStartMatch: (match: Match) => void;
  handleScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  handleNewSet: () => void;
  handleCompleteMatch: () => void;
  handleUpdateScoringSettings: (settings: any) => void;
  handleBackToCourts: () => void;
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
  handleBackToCourts
}) => {
  if (!currentTournament) {
    return (
      <ScoringContainer isLoading={true} />
    );
  }

  // Filter matches by different statuses
  const scheduledMatches = currentTournament.matches.filter(
    (match) => match.status === "SCHEDULED"
  );
  
  const inProgressMatches = currentTournament.matches.filter(
    (match) => match.status === "IN_PROGRESS"
  );
  
  // Combine both for listing - in progress first, then scheduled
  const displayMatches = [...inProgressMatches, ...scheduledMatches];

  return (
    <ScoringContainer>
      <ScoringHeader 
        onSettingsOpen={() => setSettingsOpen(true)} 
        tournamentId={tournamentId} 
        inProgressMatchesCount={inProgressMatches.length}
      />

      {activeView === "courts" ? (
        <CourtsView 
          courts={currentTournament.courts}
          displayMatches={displayMatches}
          onCourtSelect={handleSelectCourt}
          onMatchStart={handleStartMatch}
          onMatchSelect={handleSelectMatch}
        />
      ) : (
        <ScoringView
          selectedMatch={selectedMatch}
          currentSet={currentSet}
          onBackToCourts={handleBackToCourts}
          onScoreChange={handleScoreChange}
          onNewSet={() => setNewSetDialogOpen(true)}
          onCompleteMatch={() => setCompleteMatchDialogOpen(true)}
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

// Sub-component for Courts View
const CourtsView: React.FC<{
  courts: Court[];
  displayMatches: Match[];
  onCourtSelect: (court: Court) => void;
  onMatchStart: (match: Match) => void;
  onMatchSelect: (match: Match) => void;
}> = ({ courts, displayMatches, onCourtSelect, onMatchStart, onMatchSelect }) => {
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Select a Court</h2>
      <CourtSelectionPanel 
        courts={courts}
        onCourtSelect={onCourtSelect}
        onMatchStart={onMatchSelect}
      />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">
          {displayMatches.some(m => m.status === "IN_PROGRESS") 
            ? "In Progress & Scheduled Matches" 
            : "Scheduled Matches"}
        </h2>
        <ScheduledMatchesList 
          matches={displayMatches}
          onStartMatch={onMatchStart}
        />
      </div>
    </div>
  );
};

// Sub-component for Scoring View
const ScoringView: React.FC<{
  selectedMatch: Match | null;
  currentSet: number;
  onBackToCourts: () => void;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  onSetChange: (setIndex: number) => void;
}> = ({ 
  selectedMatch, 
  currentSet, 
  onBackToCourts, 
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  onSetChange
}) => {
  return (
    <div className="mt-6">
      <Button 
        variant="outline" 
        className="mb-4" 
        onClick={onBackToCourts}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Courts
      </Button>
      
      {selectedMatch && (
        <ScoringMatchDetail
          match={selectedMatch}
          onScoreChange={onScoreChange}
          onNewSet={onNewSet}
          onCompleteMatch={onCompleteMatch}
          currentSet={currentSet}
          onSetChange={onSetChange}
        />
      )}
    </div>
  );
};

export default TournamentScoring;
