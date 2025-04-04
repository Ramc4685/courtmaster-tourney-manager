
import { useContext } from 'react';
import { useTournament as useTournamentFromContext } from './TournamentContext';
import { TournamentContextType } from './types';

export const useTournament = (): TournamentContextType => {
  return useTournamentFromContext();
};
