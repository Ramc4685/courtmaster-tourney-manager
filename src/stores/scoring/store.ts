
import { create } from "zustand";
import { ScoringState } from "./types";
import { createScoringActions } from "./actions";
import { getDefaultScoringSettings } from "@/utils/matchUtils";

export const useScoringStore = create<ScoringState>((set, get) => {
  return {
    // Initial state
    selectedMatch: null,
    selectedCourt: null,
    currentSet: 0,
    settingsOpen: false,
    activeView: "courts",
    newSetDialogOpen: false,
    completeMatchDialogOpen: false,
    scoringSettings: getDefaultScoringSettings(),
    
    // Basic setters
    setSelectedMatch: (match) => set({ selectedMatch: match }),
    setSelectedCourt: (court) => set({ selectedCourt: court }),
    setCurrentSet: (setIndex) => set({ currentSet: setIndex }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setActiveView: (view) => set({ activeView: view }),
    setNewSetDialogOpen: (open) => set({ newSetDialogOpen: open }),
    setCompleteMatchDialogOpen: (open) => set({ completeMatchDialogOpen: open }),
    setScoringSettings: (settings) => set({ scoringSettings: settings }),
    
    // Business logic actions imported from actions.ts
    ...createScoringActions(set, get)
  };
});
