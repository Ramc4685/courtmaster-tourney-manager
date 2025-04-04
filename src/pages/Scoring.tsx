
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTournament } from "@/contexts/TournamentContext";
import { Match } from "@/types/tournament";
import TournamentScoring from "@/components/scoring/TournamentScoring";
import StandaloneMatchScoring from "@/components/scoring/StandaloneMatchScoring";
import ScoringContainer from "@/components/scoring/ScoringContainer";
import { useUnifiedScoring } from "@/hooks/scoring/useUnifiedScoring";
import { useScoringLogic } from "@/hooks/scoring/useScoringLogic"; 
import { getCurrentUserId } from "@/utils/auditUtils";
import { getDefaultScorerName } from "@/utils/matchAuditUtils";

const Scoring = () => {
  console.log("Rendering Scoring page");
  
  // Get tournament ID from URL - could be from either path format
  const params = useParams<{ tournamentId: string }>();
  const [searchParams] = useSearchParams();
  const tournamentId = params.tournamentId;
  const matchId = searchParams.get("matchId");
  const matchType = searchParams.get("type");
  
  // State for scorer name
  const [scorerName, setScorerName] = useState(getDefaultScorerName());
  
  // Prevent logging on every render to reduce noise
  const firstRenderRef = React.useRef(true);
  if (firstRenderRef.current) {
    console.log("Tournament ID from URL params:", tournamentId);
    console.log("Match ID from URL query:", matchId);
    console.log("Match type from URL query:", matchType);
    firstRenderRef.current = false;
  }
  
  const navigate = useNavigate();
  const { tournaments, setCurrentTournament } = useTournament();
  
  // Determine if we're handling a standalone match
  const isStandaloneMatch = matchType === "standalone" && !!matchId;
  
  // We need this state to prevent re-renders from changing scorerType
  const [scorerTypeState] = useState(isStandaloneMatch ? "STANDALONE" : "TOURNAMENT");
  
  // Use our unified scoring hook with the appropriate scorer type
  const scoring = useUnifiedScoring({
    scorerType: scorerTypeState as any,
    matchId: isStandaloneMatch ? matchId : undefined,
    scorerName: scorerName // Pass scorer name
  });
  
  // Update scorer name when it changes in the scoring hook
  useEffect(() => {
    if (scoring.scorerName && scoring.scorerName !== scorerName) {
      setScorerName(scoring.scorerName);
    }
  }, [scoring.scorerName]);
  
  // Set the current tournament based on the URL parameter - only once after mount
  useEffect(() => {
    if (isStandaloneMatch) {
      console.log("Using standalone match, not loading tournament");
      return;
    }
    
    if (!tournamentId) {
      console.log("No tournament ID found in URL params");
      return;
    }
    
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (tournament) {
      console.log("Setting current tournament:", tournament.id, tournament.name);
      setCurrentTournament(tournament);
    } else {
      // Tournament not found, redirect to tournaments page
      console.log("Tournament not found, redirecting to tournaments page");
      navigate("/tournaments");
    }
  }, [tournamentId, tournaments, setCurrentTournament, navigate, isStandaloneMatch]);

  // Handle updating court number
  const handleCourtChange = (courtNumber: number) => {
    if (scoring.match) {
      console.log(`Updating court number to: ${courtNumber}`);
      scoring.updateCourtNumber(courtNumber);
    }
  };

  // Handle standalone match case
  if (isStandaloneMatch) {
    return (
      <StandaloneMatchScoring 
        isLoading={scoring.isLoading}
        match={scoring.match}
        currentSet={scoring.currentSet}
        setCurrentSet={scoring.setCurrentSet}
        settingsOpen={scoring.settingsOpen}
        setSettingsOpen={scoring.setSettingsOpen}
        scoringSettings={scoring.scoringSettings}
        setNewSetDialogOpen={scoring.setNewSetDialogOpen}
        completeMatchDialogOpen={scoring.completeMatchDialogOpen}
        setCompleteMatchDialogOpen={scoring.setCompleteMatchDialogOpen}
        onScoreChange={scoring.handleScoreChange}
        onNewSet={scoring.handleNewSet}
        onCompleteMatch={scoring.handleCompleteMatch}
        onSave={scoring.saveMatch}
        isPending={scoring.isPending}
        scorerName={scorerName}
        onScorerNameChange={scoring.updateScorerName}
        newSetDialogOpen={scoring.newSetDialogOpen}
        onCourtChange={handleCourtChange}
      />
    );
  }

  // Original tournament-based scoring case
  if (!tournamentId) {
    console.log("No tournament ID found in URL params");
    return (
      <ScoringContainer errorMessage="No Tournament Selected">
        <p>Please select a tournament to continue.</p>
      </ScoringContainer>
    );
  }

  // For tournament scoring, we'll use the imported useScoringLogic hook
  const { 
    currentTournament,
    selectedMatch,
    activeView,
    handleSelectMatch,
    handleSelectCourt,
    handleScoreChange,
    handleStartMatch: originalHandleStartMatch,
    handleCompleteMatch,
    handleNewSet,
    handleUpdateScoringSettings,
    handleBackToCourts,
    scoringSettings,
    ...scoringLogicRest
  } = useScoringLogic();
  
  // Handle isPending in a TypeScript-safe way
  const isPending = typeof scoringLogicRest === 'object' && 
                    scoringLogicRest !== null && 
                    'isPending' in scoringLogicRest ? 
                    Boolean(scoringLogicRest.isPending) : false;

  // Map activeView from "scoring" to "match" to match TournamentScoring's expected enum
  const mappedActiveView = activeView === "scoring" ? "match" : "courts";

  // Create adapter function for handleStartMatch to convert from matchId to Match
  const handleStartMatchAdapter = (matchId: string) => {
    const match = currentTournament?.matches.find(m => m.id === matchId);
    if (match) {
      originalHandleStartMatch(match);
    } else {
      console.error(`Match with ID ${matchId} not found`);
    }
  };
  
  // Handle court number change
  const handleTournamentCourtChange = (courtNumber: number) => {
    if (selectedMatch) {
      console.log(`Updating court number for tournament match to: ${courtNumber}`);
      // We need to update the match in the tournament
      const updatedMatch = { ...selectedMatch, courtNumber };
      // This would need to be implemented in your tournament context
      if (typeof scoringLogicRest === 'object' && 
          scoringLogicRest !== null && 
          'updateMatch' in scoringLogicRest) {
        (scoringLogicRest.updateMatch as (match: Match) => void)(updatedMatch);
      }
    }
  };

  return (
    <TournamentScoring
      currentTournament={currentTournament}
      tournamentId={tournamentId}
      activeView={mappedActiveView}
      selectedMatch={selectedMatch}
      currentSet={scoring.currentSet}
      setCurrentSet={scoring.setCurrentSet}
      settingsOpen={scoring.settingsOpen}
      setSettingsOpen={scoring.setSettingsOpen}
      scoringSettings={scoringSettings}
      newSetDialogOpen={scoring.newSetDialogOpen}
      setNewSetDialogOpen={scoring.setNewSetDialogOpen}
      completeMatchDialogOpen={scoring.completeMatchDialogOpen}
      setCompleteMatchDialogOpen={scoring.setCompleteMatchDialogOpen}
      onSelectMatch={handleSelectMatch}
      onSelectCourt={handleSelectCourt}
      courts={currentTournament?.courts || []}
      onScoreChange={handleScoreChange}
      onNewSet={handleNewSet}
      onCompleteMatch={handleCompleteMatch}
      isPending={isPending}
      scorerName={scorerName}
      onScorerNameChange={scoring.updateScorerName}
      setActiveView={handleBackToCourts}
      onCourtChange={handleTournamentCourtChange}
    />
  );
};

export default Scoring;
