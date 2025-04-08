
import { create } from 'zustand';
import { ScoringState } from './types';
import { getDefaultScoringSettings } from '@/utils/matchUtils';
import { actions } from './actions';

export const useScoringStore = create<ScoringState>((set, get) => {
  // Initialize state
  const initialState: Partial<ScoringState> = {
    selectedMatch: null,
    selectedCourt: null,
    currentSet: 0,
    settingsOpen: false,
    activeView: "courts",
    newSetDialogOpen: false,
    completeMatchDialogOpen: false,
    scoringSettings: getDefaultScoringSettings(),
  };

  // Create action functions
  const actionFunctions = actions(set, get);

  // Return state and actions
  return {
    ...initialState,
    ...actionFunctions,
    
    // Add simple state setters
    setSelectedMatch: (match) => set({ selectedMatch: match }),
    setSelectedCourt: (court) => set({ selectedCourt: court }),
    setCurrentSet: (setIndex) => set({ currentSet: setIndex }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setActiveView: (view) => set({ activeView: view }),
    setNewSetDialogOpen: (open) => set({ newSetDialogOpen: open }),
    setCompleteMatchDialogOpen: (open) => set({ completeMatchDialogOpen: open }),
    setScoringSettings: (settings) => set({ scoringSettings: settings }),
  } as ScoringState;
});
