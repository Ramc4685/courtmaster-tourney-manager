import React from 'react';
import { TournamentContextType } from './types';

// Create the context
export const TournamentContext = React.createContext<TournamentContextType | undefined>(undefined);

// Check if current tournament exists
export const checkCurrentTournamentExists = (
  currentTournament: any,
  errorMessage = "No tournament is currently selected"
) => {
  if (!currentTournament) {
    throw new Error(errorMessage);
  }
  return true;
};

// Custom hook to use the tournament context
export const useTournament = (): TournamentContextType => {
  const context = React.useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};
