
import { Match, Court, ScoringSettings, StandaloneMatch } from "@/types/tournament";

export interface ScoringState {
  // State
  selectedMatch: Match | StandaloneMatch | null;
  selectedCourt: Court | null;
  currentSet: number;
  settingsOpen: boolean;
  activeView: "courts" | "scoring";
  newSetDialogOpen: boolean;
  completeMatchDialogOpen: boolean;
  scoringSettings: ScoringSettings;
  
  // Actions
  setSelectedMatch: (match: Match | StandaloneMatch | null) => void;
  setSelectedCourt: (court: Court | null) => void;
  setCurrentSet: (setIndex: number) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveView: (view: "courts" | "scoring") => void;
  setNewSetDialogOpen: (open: boolean) => void;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  setScoringSettings: (settings: ScoringSettings) => void;
  
  // Business logic for tournament matches
  handleSelectMatch: (match: Match | StandaloneMatch) => void;
  handleSelectCourt: (court: Court) => void;
  handleScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  handleStartMatch: (match: Match | StandaloneMatch) => void;
  handleCompleteMatch: () => void;
  handleNewSet: () => void;
  handleUpdateScoringSettings: (settings: ScoringSettings) => void;
  handleBackToCourts: () => void;
  
  // Business logic for standalone matches
  handleStandaloneScoreChange: (team: "team1" | "team2", increment: boolean, standaloneStore: any) => void;
  handleStandaloneStartMatch: (matchId: string, standaloneStore: any) => void;
  handleStandaloneCompleteMatch: (standaloneStore: any) => void;
  handleStandaloneNewSet: (standaloneStore: any) => void;
}
