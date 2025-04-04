
import { Match, Tournament, Court, ScoringSettings, StandaloneMatch } from '@/types/tournament';

export interface BaseScoringProps {
  isLoading: boolean;
  match: Match | null;
  currentSet: number;
  setCurrentSet: (index: number) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  scoringSettings: ScoringSettings;
  updateScoringSettings: (settings: ScoringSettings) => void;
  newSetDialogOpen: boolean;
  setNewSetDialogOpen: (open: boolean) => void;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  onScoreChange: (team: 'team1' | 'team2', increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  isPending?: boolean;
  scorerName?: string; // Add scorerName prop
  onScorerNameChange?: (name: string) => void; // Add scorerName change handler
}

export interface StandaloneMatchScoringProps extends BaseScoringProps {
  // Standalone-specific props
  onSave?: () => void;
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
}

export interface TournamentScoringProps extends BaseScoringProps {
  // Tournament-specific props
  currentTournament: Tournament;
  tournamentId: string;
  activeView: 'courts' | 'match';
  selectedMatch: Match;
  setActiveView: (view: 'courts' | 'match') => void;
  onSelectMatch: (match: Match) => void;
  onSelectCourt: (court: Court) => void;
  courts: Court[];
  scorerName?: string;
  onScorerNameChange?: (name: string) => void;
}
