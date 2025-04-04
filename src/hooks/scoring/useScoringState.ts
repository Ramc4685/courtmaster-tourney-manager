
import { useState, useRef } from "react";
import { Match, Court } from "@/types/tournament";
import { getDefaultScoringSettings } from "@/utils/matchUtils";
import { useTournament } from "@/contexts/tournament/useTournament";

export const useScoringState = () => {
  const { currentTournament } = useTournament();
  
  // Get scoring settings from tournament
  const scoringSettings = currentTournament?.scoringSettings || getDefaultScoringSettings();
  
  // State management with refs to prevent infinite loops
  const selectedMatchRef = useRef<Match | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"courts" | "scoring">("courts");
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Flag to track if we're currently updating match to prevent update loops
  const isUpdatingMatch = useRef(false);
  
  // Safely update the selected match to prevent infinite loops
  const safeSetSelectedMatch = (match: Match | null) => {
    if (isUpdatingMatch.current) return;
    isUpdatingMatch.current = true;
    
    // Break the update chain
    setTimeout(() => {
      selectedMatchRef.current = match;
      setSelectedMatch(match);
      isUpdatingMatch.current = false;
    }, 0);
  };
  
  return {
    currentTournament,
    selectedMatch,
    selectedMatchRef,
    selectedCourt,
    currentSet,
    settingsOpen,
    activeView,
    scoringSettings,
    newSetDialogOpen,
    completeMatchDialogOpen,
    safeSetSelectedMatch,
    setSelectedCourt,
    setCurrentSet,
    setSettingsOpen,
    setActiveView,
    setNewSetDialogOpen,
    setCompleteMatchDialogOpen,
    isUpdatingMatch
  };
};
