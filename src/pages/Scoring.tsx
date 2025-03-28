
import React from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import CourtSelectionPanel from "@/components/scoring/CourtSelectionPanel";
import ScoringHeader from "@/components/scoring/ScoringHeader";
import ScoringMatchDetail from "@/components/scoring/ScoringMatchDetail";
import ScheduledMatchesList from "@/components/scoring/ScheduledMatchesList";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import ScoringConfirmationDialogs from "@/components/scoring/ScoringConfirmationDialogs";
import { useScoringLogic } from "@/components/scoring/useScoringLogic";

const Scoring = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const {
    currentTournament,
    selectedMatch,
    currentSet,
    settingsOpen,
    activeView,
    scoringSettings,
    newSetDialogOpen,
    completeMatchDialogOpen,
    setCurrentSet,
    setSettingsOpen,
    setNewSetDialogOpen,
    setCompleteMatchDialogOpen,
    handleSelectMatch,
    handleSelectCourt,
    handleScoreChange,
    handleStartMatch,
    handleCompleteMatch,
    handleNewSet,
    handleUpdateScoringSettings,
    handleBackToCourts
  } = useScoringLogic();

  if (!currentTournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>No tournament selected. Please select a tournament first.</p>
        </div>
      </Layout>
    );
  }

  const scheduledMatches = currentTournament.matches.filter(
    (match) => match.status === "SCHEDULED"
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <ScoringHeader onSettingsOpen={() => setSettingsOpen(true)} />

        {activeView === "courts" ? (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Select a Court</h2>
            <CourtSelectionPanel 
              courts={currentTournament.courts}
              onCourtSelect={handleSelectCourt}
              onMatchStart={handleSelectMatch}
            />
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Scheduled Matches</h2>
              <ScheduledMatchesList 
                matches={scheduledMatches}
                onStartMatch={handleStartMatch}
              />
            </div>
          </div>
        ) : (
          <div className="mt-6">
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
              />
            )}
          </div>
        )}
      </div>

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
    </Layout>
  );
};

export default Scoring;
