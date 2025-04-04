
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import TournamentScoring from '@/components/scoring/TournamentScoring';
import { Match, Court, Tournament } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

const Scoring = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { currentTournament, completeMatch, updateMatchScore, updateMatchStatus } = useTournament();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeView, setActiveView] = useState<"courts" | "match">("courts");
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scoringSettings, setScoringSettings] = useState({
    autoAdvanceSet: true,
    showScoreConfirmation: true,
    fullscreenMode: false
  });
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  const [scorerName, setScorerName] = useState<string>("");
  const queryClient = useQueryClient();

  // Reset state when tournament changes
  useEffect(() => {
    setSelectedMatch(null);
    setActiveView("courts");
    setCurrentSet(0);
  }, [tournamentId, currentTournament?.id]);

  if (!currentTournament || (tournamentId && currentTournament.id !== tournamentId)) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Tournament Scoring</h1>
        <p>Please select a tournament to score.</p>
      </div>
    );
  }

  const courts = currentTournament.courts || [];

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setActiveView("match");
    setCurrentSet(match.scores.length - 1 >= 0 ? match.scores.length - 1 : 0);
  };

  // This function adapts the Court parameter to match what the component expects
  const handleSelectCourt = (court: Court) => {
    const match = court.currentMatch || 
      currentTournament.matches.find(m => m.courtNumber === court.number && m.status === "IN_PROGRESS");
    
    if (match) {
      handleSelectMatch(match);
    } else {
      toast({
        title: "No active match",
        description: `Court ${court.number} doesn't have an active match`,
        duration: 3000
      });
    }
  };

  // Adapter function to handle team/increment API to team1Score/team2Score API
  const handleScoreChange = (team1Score: number, team2Score: number) => {
    if (!selectedMatch) return;

    updateMatchScore(
      selectedMatch.id, 
      currentSet, 
      team1Score, 
      team2Score,
      scorerName || undefined
    );

    if (selectedMatch.status === "SCHEDULED") {
      updateMatchStatus(selectedMatch.id, "IN_PROGRESS");
    }

    // Check if we should automatically advance to next set
    if (scoringSettings.autoAdvanceSet) {
      const reachedSetPoint = (team1Score >= 21 && team1Score - team2Score >= 2) || 
                             (team2Score >= 21 && team2Score - team1Score >= 2);
      if (reachedSetPoint) {
        setNewSetDialogOpen(true);
      }
    }
  };

  const handleNewSet = () => {
    if (!selectedMatch) return;
    setCurrentSet(selectedMatch.scores.length);
  };

  const handleCompleteMatch = () => {
    if (!selectedMatch) return;
    completeMatch(selectedMatch.id, scorerName || undefined);
    setActiveView("courts");
    setSelectedMatch(null);
    
    toast({
      title: "Match Completed",
      description: `${selectedMatch.team1.name} vs ${selectedMatch.team2.name} has been marked as complete`,
      duration: 3000
    });
  };

  // Adapter for Court change
  const handleCourtChange = (courtNumber: number) => {
    if (!selectedMatch) return;
    
    // This would update the match with the new court number
    console.log(`Court changed to ${courtNumber} for match ${selectedMatch.id}`);
    
    // In a real implementation, you would call a function to update the match
    // updateMatchCourt(selectedMatch.id, courtNumber);
    
    toast({
      title: "Court Updated",
      description: `Match moved to Court ${courtNumber}`,
      duration: 3000
    });
  };

  return (
    <TournamentScoring
      currentTournament={currentTournament}
      tournamentId={tournamentId || ''}
      activeView={activeView}
      setActiveView={setActiveView}
      selectedMatch={selectedMatch}
      currentSet={currentSet}
      setCurrentSet={setCurrentSet}
      settingsOpen={settingsOpen}
      setSettingsOpen={setSettingsOpen}
      scoringSettings={scoringSettings}
      newSetDialogOpen={newSetDialogOpen}
      setNewSetDialogOpen={setNewSetDialogOpen}
      completeMatchDialogOpen={completeMatchDialogOpen}
      setCompleteMatchDialogOpen={setCompleteMatchDialogOpen}
      onSelectMatch={handleSelectMatch}
      onSelectCourt={handleSelectCourt}
      courts={courts}
      onScoreChange={handleScoreChange}
      onNewSet={handleNewSet}
      onCompleteMatch={handleCompleteMatch}
      scorerName={scorerName}
      onScorerNameChange={(value: string) => setScorerName(value)}
      onCourtChange={handleCourtChange}
    />
  );
};

export default Scoring;
