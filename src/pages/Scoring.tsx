
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
import { getDefaultScoringSettings } from "@/utils/matchUtils";

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
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scoringSettings, setScoringSettings] = useState(getDefaultScoringSettings());
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Determine if we're handling a standalone match
  useEffect(() => {
    if (matchType === "standalone" && matchId) {
      console.log("Setting up for standalone match:", matchId);
      setIsStandaloneMatch(true);
    } else {
      setIsStandaloneMatch(false);
    }
  }, [matchId, matchType]);
  
  // Use standalone scoring hook only when handling a standalone match
  const standaloneScoring = useStandaloneScoring(isStandaloneMatch ? matchId : null);
  
  const {
    currentTournament,
    selectedMatch,
    activeView,
    handleSelectMatch,
    handleSelectCourt,
    handleScoreChange: tournamentHandleScoreChange,
    handleStartMatch,
    handleCompleteMatch: tournamentHandleCompleteMatch,
    handleNewSet: tournamentHandleNewSet,
    handleUpdateScoringSettings,
    handleBackToCourts
  } = useScoringLogic();

  // Update scoring settings when tournament changes
  useEffect(() => {
    if (currentTournament?.scoringSettings) {
      setScoringSettings(currentTournament.scoringSettings);
    }
  }, [currentTournament]);

  // Handle standalone match score change
  const handleStandaloneScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    if (standaloneScoring.handleScoreChange) {
      standaloneScoring.handleScoreChange(team, increment, currentSet);
    }
  }, [standaloneScoring, currentSet]);

  // Handle standalone match selection once the match is loaded
  useEffect(() => {
    if (standaloneScoring.scoringMatch && !matchSelected && isStandaloneMatch) {
      console.log("Standalone match loaded successfully, setting initial state");
      
      setCurrentSet(standaloneScoring.scoringMatch.scores.length > 0 ? 
                   standaloneScoring.scoringMatch.scores.length - 1 : 0);
      
      setMatchSelected(true);
    }
  }, [standaloneScoring.scoringMatch, matchSelected, isStandaloneMatch]);
  
  // Set the current tournament based on the URL parameter
  useEffect(() => {
    if (isStandaloneMatch) {
      console.log("Using standalone match, not loading tournament");
      return;
    }
    
    if (!tournamentId) {
      console.log("No tournament ID found in URL params");
      return;
    }
    
    console.log("Available tournaments:", tournaments.map(t => t.id));
    
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
        handleScoreChange={handleStandaloneScoreChange}
        handleNewSet={standaloneScoring.handleNewSet || (() => {})}
        handleCompleteMatch={standaloneScoring.handleCompleteMatch || (() => {})}
        selectedMatch={standaloneScoring.scoringMatch || selectedMatch}
        saveMatch={standaloneScoring.saveMatch}
        isPending={isPending}
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

  // Map activeView from "scoring" to "match" to match TournamentScoring's expected enum
  const mappedActiveView = activeView === "scoring" ? "match" : "courts";

  // Create adapter function for handleStartMatch to convert from matchId to Match
  const handleStartMatchAdapter = (matchId: string) => {
    const match = currentTournament?.matches.find(m => m.id === matchId);
    if (match) {
      handleStartMatch(match);
    } else {
      console.error(`Match with ID ${matchId} not found`);
    }
  };

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
      handleSelectCourt={handleSelectCourt}
      handleSelectMatch={handleSelectMatch}
      handleStartMatch={handleStartMatchAdapter}
      handleScoreChange={tournamentHandleScoreChange}
      handleNewSet={tournamentHandleNewSet}
      handleCompleteMatch={tournamentHandleCompleteMatch}
      handleUpdateScoringSettings={handleUpdateScoringSettings}
      handleBackToCourts={handleBackToCourts}
      isPending={isPending}
    />
  );
};

export default Scoring;
