
import { useState, useEffect } from "react";
import { Match, Court, ScoringSettings } from "@/types/tournament";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

// This hook manages the state for the scoring interface
export const useScoringState = (initialScoringSettings?: ScoringSettings) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"courts" | "scoring">("courts");
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);
  
  // Get scoring settings from tournament or use defaults
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(
    initialScoringSettings || getDefaultScoringSettings()
  );
  
  // Update scoring settings when tournament changes
  useEffect(() => {
    if (initialScoringSettings) {
      setScoringSettings(initialScoringSettings);
    }
  }, [initialScoringSettings]);

  return {
    // State
    selectedMatch,
    selectedCourt,
    currentSet,
    settingsOpen,
    activeView,
    scoringSettings,
    newSetDialogOpen,
    completeMatchDialogOpen,
    
    // State setters
    setSelectedMatch,
    setSelectedCourt,
    setCurrentSet,
    setSettingsOpen,
    setActiveView,
    setScoringSettings,
    setNewSetDialogOpen,
    setCompleteMatchDialogOpen
  };
};
