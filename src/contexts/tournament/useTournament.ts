
import { useContext } from 'react';
import { useTournament as useTournamentFromContext } from './TournamentContext';
import { TournamentContextType } from './types';

export const useTournament = (): TournamentContextType => {
  return useTournamentFromContext();
};

// This is a re-export to maintain API compatibility
export const createTournament = (data: any) => {
  const { createTournament } = useTournament();
  return createTournament(data);
};
