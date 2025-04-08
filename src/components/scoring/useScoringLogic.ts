import { useState, useCallback } from 'react';
import { Match, Tournament } from '@/types/tournament';
import { ScoringSettings } from '@/types/scoring';
import { isSetComplete, isMatchComplete } from '@/utils/matchUtils';

interface UseScoringLogicProps {
  initialMatch?: Match | null;
  initialTournament?: Tournament | null;
  initialScoringSettings?: ScoringSettings | null;
}

export const useScoringLogic = (props: UseScoringLogicProps = {}) => {
  const { initialMatch = null, initialTournament = null, initialScoringSettings = null } = props;
  const [activeView, setActiveView] = useState<"scoring" | "courts">("courts");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(initialMatch);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings | null>(initialScoringSettings);
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSelectMatch = useCallback((match: Match | null) => {
    setSelectedMatch(match);
    setCurrentSet(0); // Reset to the first set when a new match is selected
  }, []);

  const handleSelectCourt = useCallback((court: any) => {
    setSelectedCourt(court);
  }, []);

  const handleStartMatch = useCallback((match: Match) => {
    setSelectedMatch(match);
    setActiveView("scoring");
  }, []);

  const handleScoreChange = useCallback((team: "team1" | "team2", increment: boolean) => {
    // Implement score change logic here
    console.log(`Score change for ${team}, increment: ${increment}`);
  }, []);

  const handleNewSet = useCallback(() => {
    setNewSetDialogOpen(true);
  }, []);

  const handleCompleteMatch = useCallback(() => {
    setCompleteMatchDialogOpen(true);
  }, []);

  return {
    activeView,
    setActiveView,
    selectedMatch,
    setSelectedMatch,
    selectedCourt,
    setSelectedCourt,
    currentSet,
    setCurrentSet,
    settingsOpen,
    setSettingsOpen,
    scoringSettings,
    setScoringSettings,
    newSetDialogOpen,
    setNewSetDialogOpen,
    completeMatchDialogOpen,
    setCompleteMatchDialogOpen,
    isPending,
    setIsPending,
    handleSelectMatch,
    handleSelectCourt,
    handleStartMatch,
    handleScoreChange,
    handleNewSet,
    handleCompleteMatch,
  };
};
