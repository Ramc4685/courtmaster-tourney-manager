
import { Match, StandaloneMatch } from './tournament';

export interface ScoringSettings {
  maxPoints: number;
  winByTwo: boolean;
  maxSets: number;
  bestOf: boolean;
}

export interface StandaloneMatchScoringProps {
  isLoading: boolean;
  match: StandaloneMatch | Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  scoringSettings: ScoringSettings;
  setNewSetDialogOpen: (open: boolean) => void;
  newSetDialogOpen: boolean;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  onSave: () => void;
  isPending?: boolean;
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
  onCourtChange?: (courtNumber: number) => void;
}

export interface TournamentScorerOptions {
  scorerType: "TOURNAMENT" | "STANDALONE";
  matchId?: string;
  scorerName?: string;
}
