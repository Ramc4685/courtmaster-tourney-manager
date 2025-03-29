
import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import CourtSelectionPanel from "@/components/scoring/CourtSelectionPanel";
import ScoringHeader from "@/components/scoring/ScoringHeader";
import ScoringMatchDetail from "@/components/scoring/ScoringMatchDetail";
import ScheduledMatchesList from "@/components/scoring/ScheduledMatchesList";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import ScoringConfirmationDialogs from "@/components/scoring/ScoringConfirmationDialogs";
import { useScoringLogic } from "@/components/scoring/useScoringLogic";
import { useTournament } from "@/contexts/TournamentContext";

const Scoring = () => {
  console.log("Rendering Scoring page");
  
  // Get tournament ID from URL - could be from either path format
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = params.tournamentId;
  console.log("Tournament ID from URL params:", tournamentId);
  
  const navigate = useNavigate();
  const { tournaments, setCurrentTournament } = useTournament();
  
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
  
  // Set the current tournament based on the URL parameter
  useEffect(() => {
    console.log("Scoring useEffect - tournamentId:", tournamentId);
    console.log("Available tournaments:", tournaments.map(t => t.id));
    
    if (tournamentId) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      console.log("Found tournament:", tournament ? "Yes" : "No");
      
      if (tournament) {
        console.log("Setting current tournament:", tournament.id, tournament.name);
        setCurrentTournament(tournament);
      } else {
        // Tournament not found, redirect to tournaments page
        console.log("Tournament not found, redirecting to tournaments page");
        navigate("/tournaments");
      }
    }
  }, [tournamentId, tournaments, setCurrentTournament, navigate]);

  if (!tournamentId) {
    console.log("No tournament ID found in URL params");
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">No Tournament Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select a tournament to access the scoring interface.
          </p>
          <Link to="/tournaments">
            <Button>
              <Trophy className="mr-2 h-4 w-4" />
              Go to Tournaments
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!currentTournament) {
    console.log("Current tournament not loaded yet");
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4">
          <p>Loading tournament data...</p>
        </div>
      </Layout>
    );
  }

  console.log("Rendering Scoring UI for tournament:", currentTournament.id);
  
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
    <Layout>
      <div className="max-w-6xl mx-auto">
        <ScoringHeader onSettingsOpen={() => setSettingsOpen(true)} tournamentId={tournamentId} />

        {activeView === "courts" ? (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Select a Court</h2>
            <CourtSelectionPanel 
              courts={currentTournament.courts}
              onCourtSelect={handleSelectCourt}
              onMatchStart={handleSelectMatch}
            />
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">
                {inProgressMatches.length > 0 ? "In Progress & Scheduled Matches" : "Scheduled Matches"}
              </h2>
              <ScheduledMatchesList 
                matches={displayMatches}
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
