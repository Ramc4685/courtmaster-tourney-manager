
import { useState, useEffect } from "react";
import { Match, Court, ScoringSettings } from "@/types/tournament";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

/**
 * Hook to manage scoring state separate from actions
 */
export const useScoringState = (tournamentSettings?: ScoringSettings) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"courts" | "scoring">("courts");
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Initialize scoring settings with badminton defaults or tournament settings
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(
    tournamentSettings || getDefaultScoringSettings()
  );
  
  // Update settings when tournament settings change
  useEffect(() => {
    if (tournamentSettings) {
      setScoringSettings(tournamentSettings);
    }
  }, [tournamentSettings]);

  return {
    selectedMatch,
    setSelectedMatch,
    selectedCourt,
    setSelectedCourt,
    currentSet,
    setCurrentSet,
    settingsOpen,
    setSettingsOpen,
    activeView,
    setActiveView,
    scoringSettings,
    setScoringSettings,
    newSetDialogOpen,
    setNewSetDialogOpen,
    completeMatchDialogOpen,
    setCompleteMatchDialogOpen
  };
};
