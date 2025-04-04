
import React, { ReactNode } from "react";
import { TournamentProvider } from "./TournamentContext";

// Note: This file is now a backup/reference implementation. The active implementation is in TournamentContext.tsx.

export const TournamentProviderNew = ({ children }: { children: ReactNode }) => {
  // This is a placeholder implementation since we're now using TournamentContext.tsx
  // We're delegating to the main TournamentProvider
  return (
    <TournamentProvider>{children}</TournamentProvider>
  );
};
