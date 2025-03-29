
import { useContext } from 'react';
import { TournamentContext } from './TournamentContext';
import { TournamentContextType } from './types';

// Custom hook to access and use the tournament context
export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  
  return context;
};
