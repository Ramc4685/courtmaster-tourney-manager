
import { Match, Court, StandaloneMatch, ScoringSettings } from '@/types/tournament';

export type ScoringView = "courts" | "scoring";

export interface ScoringState {
  // Current state
  selectedMatch: Match | StandaloneMatch | null;
  selectedCourt: Court | null;
  currentSet: number;
  settingsOpen: boolean;
  activeView: ScoringView;
  newSetDialogOpen: boolean;
  completeMatchDialogOpen: boolean;
  scoringSettings: ScoringSettings;
  
  // State setters
  setSelectedMatch: (match: Match | StandaloneMatch | null) => void;
  setSelectedCourt: (court: Court | null) => void;
  setCurrentSet: (setIndex: number) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveView: (view: ScoringView) => void;
  setNewSetDialogOpen: (open: boolean) => void;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  setScoringSettings: (settings: ScoringSettings) => void;
  
  // Score actions
  updateScore: (team: "team1" | "team2", setIndex: number, value: number) => void;
  incrementScore: (team: "team1" | "team2", setIndex: number) => void;
  decrementScore: (team: "team1" | "team2", setIndex: number) => void;
  addNewSet: () => void;
  completeMatch: () => void;
  selectCourt: (court: Court) => void;
}
