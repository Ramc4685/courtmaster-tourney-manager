
import React, { createContext, useContext } from 'react';
import { useRegistration } from './useRegistration';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';
import { RegistrationStatus } from '@/types/tournament-enums';

interface RegistrationContextValue {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  isLoading: boolean;
  error: string;
  fetchRegistrations: (tournamentId: string) => Promise<void>;
  updatePlayerStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateTeamStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus, type: 'player' | 'team') => Promise<void>;
  notifyWaitlisted: (id: string) => Promise<boolean>;
  registerPlayer: (data: any) => Promise<void>;
  registerTeam: (data: any) => Promise<void>;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registrationService = useRegistration();

  return (
    <RegistrationContext.Provider value={registrationService}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistrationContext = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistrationContext must be used within a RegistrationProvider');
  }
  return context;
};
