
import { Match, Court, ScoringSettings } from "@/types/tournament";

export interface ScoringState {
  // State
  selectedMatch: Match | null;
  selectedCourt: Court | null;
  currentSet: number;
  settingsOpen: boolean;
  activeView: "courts" | "scoring";
  newSetDialogOpen: boolean;
  completeMatchDialogOpen: boolean;
  scoringSettings: ScoringSettings;
  
  // Actions
  setSelectedMatch: (match: Match | null) => void;
  setSelectedCourt: (court: Court | null) => void;
  setCurrentSet: (setIndex: number) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveView: (view: "courts" | "scoring") => void;
  setNewSetDialogOpen: (open: boolean) => void;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  setScoringSettings: (settings: ScoringSettings) => void;
  
  // Business logic
  handleSelectMatch: (match: Match) => void;
  handleSelectCourt: (court: Court) => void;
  handleScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  handleStartMatch: (match: Match) => void;
  handleCompleteMatch: () => void;
  handleNewSet: () => void;
  handleUpdateScoringSettings: (settings: ScoringSettings) => void;
  handleBackToCourts: () => void;
}
