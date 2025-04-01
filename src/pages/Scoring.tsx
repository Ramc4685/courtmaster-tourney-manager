
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useScoringLogic } from "@/hooks/scoring/useScoringLogic";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { useStandaloneScoring } from "@/hooks/scoring/useStandaloneScoring";
import TournamentScoring from "@/components/scoring/TournamentScoring";
import StandaloneMatchScoring from "@/components/scoring/StandaloneMatchScoring";
import ScoringContainer from "@/components/scoring/ScoringContainer";
import { Match, Court } from "@/types/tournament";

const Scoring = () => {
  console.log("Rendering Scoring page");
  
  // Get tournament ID from URL - could be from either path format
  const params = useParams<{ tournamentId: string }>();
  const [searchParams] = useSearchParams();
  const tournamentId = params.tournamentId;
  const matchId = searchParams.get("matchId");
  const matchType = searchParams.get("type");
  const { toast } = useToast();
  
  console.log("Tournament ID from URL params:", tournamentId);
  console.log("Match ID from URL query:", matchId);
  console.log("Match type from URL query:", matchType);
  
  const navigate = useNavigate();
  const { tournaments, setCurrentTournament, isPending } = useTournament();
  const [isStandaloneMatch, setIsStandaloneMatch] = useState(false);
  const [matchSelected, setMatchSelected] = useState(false);
  
  // Use standalone scoring hook when a standalone match is specified
  const standaloneScoring = useStandaloneScoring(matchType === "standalone" ? matchId : null);
  
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

  // Handle standalone match selection once the match is loaded
  const selectStandaloneMatch = useCallback(() => {
    if (standaloneScoring.scoringMatch && !matchSelected) {
      console.log("Standalone match loaded successfully, selecting match");
      handleSelectMatch(standaloneScoring.scoringMatch as Match);
      setMatchSelected(true);
    }
  }, [standaloneScoring.scoringMatch, matchSelected, handleSelectMatch]);

  // Load standalone match if specified in URL - with fixed dependencies
  useEffect(() => {
    if (matchType === "standalone" && matchId) {
      console.log("Setting up for standalone match:", matchId);
      setIsStandaloneMatch(true);
    }
  }, [matchId, matchType]);
  
  // Only try to select the match when it's available
  useEffect(() => {
    if (isStandaloneMatch && standaloneScoring.scoringMatch && !matchSelected) {
      selectStandaloneMatch();
    }
  }, [isStandaloneMatch, standaloneScoring.scoringMatch, matchSelected, selectStandaloneMatch]);
  
  // Set the current tournament based on the URL parameter
  useEffect(() => {
    console.log("Scoring useEffect - tournamentId:", tournamentId);
    
    if (isStandaloneMatch) {
      console.log("Using standalone match, not loading tournament");
      return;
    }
    
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
  }, [tournamentId, tournaments, setCurrentTournament, navigate, isStandaloneMatch]);

  // Handle standalone match case
  if (isStandaloneMatch) {
    return (
      <StandaloneMatchScoring 
        isLoading={standaloneScoring.isLoading}
        match={standaloneScoring.match as Match}
        scoringMatch={standaloneScoring.scoringMatch as Match}
        currentSet={currentSet}
        setCurrentSet={setCurrentSet}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        scoringSettings={scoringSettings}
        handleUpdateScoringSettings={handleUpdateScoringSettings}
        newSetDialogOpen={newSetDialogOpen}
        setNewSetDialogOpen={setNewSetDialogOpen}
        completeMatchDialogOpen={completeMatchDialogOpen}
        setCompleteMatchDialogOpen={setCompleteMatchDialogOpen}
        handleScoreChange={handleScoreChange}
        handleNewSet={handleNewSet}
        handleCompleteMatch={handleCompleteMatch}
        selectedMatch={selectedMatch}
        saveMatch={standaloneScoring.saveMatch}
      />
    );
  }

  // Original tournament-based scoring case
  if (!tournamentId && !isStandaloneMatch) {
    console.log("No tournament ID found in URL params");
    return (
      <ScoringContainer errorMessage="No Tournament Selected">
        <p>Please select a tournament to continue.</p>
      </ScoringContainer>
    );
  }

  // Create adapter functions to match expected types in TournamentScoring
  const handleCourtSelectAdapter = (court: Court) => {
    handleSelectCourt(court);
  };

  const handleStartMatchAdapter = (matchId: string) => {
    const match = currentTournament?.matches.find(m => m.id === matchId);
    if (match) {
      handleStartMatch(match);
    }
  };

  // Map activeView from "scoring" to "match" to match TournamentScoring's expected enum
  const mappedActiveView = activeView === "scoring" ? "match" : "courts";

  return (
    <TournamentScoring
      currentTournament={currentTournament}
      tournamentId={tournamentId}
      activeView={mappedActiveView}
      selectedMatch={selectedMatch}
      currentSet={currentSet}
      settingsOpen={settingsOpen}
      setSettingsOpen={setSettingsOpen}
      scoringSettings={scoringSettings}
      newSetDialogOpen={newSetDialogOpen}
      setNewSetDialogOpen={setNewSetDialogOpen}
      completeMatchDialogOpen={completeMatchDialogOpen}
      setCompleteMatchDialogOpen={setCompleteMatchDialogOpen}
      setCurrentSet={setCurrentSet}
      handleSelectCourt={handleCourtSelectAdapter}
      handleSelectMatch={handleSelectMatch}
      handleStartMatch={handleStartMatchAdapter}
      handleScoreChange={handleScoreChange}
      handleNewSet={handleNewSet}
      handleCompleteMatch={handleCompleteMatch}
      handleUpdateScoringSettings={handleUpdateScoringSettings}
      handleBackToCourts={handleBackToCourts}
      isPending={isPending}
    />
  );
};

export default Scoring;
