
import React, { createContext, useContext } from 'react';
import { useRegistrationService } from './useRegistrationService';
import { RegistrationWithStatus } from '@/types/registration';
import { RegistrationStatus } from '@/types/tournament-enums';
import { WaiverData } from './useRegistrationService';

interface RegistrationContextValue {
  // Registration collections
  registrations: RegistrationWithStatus[];
  playerRegistrations: RegistrationWithStatus[];
  teamRegistrations: RegistrationWithStatus[];
  
  // Status indicators
  isLoading: boolean;
  error: string;
  isOnline: boolean;
  pendingRegistrations: number;
  
  // Core registration operations
  fetchRegistrations: (tournamentId: string) => Promise<void>;
  createRegistration: (data: any) => Promise<string | null>;
  updateRegistrationStatus: (id: string, status: RegistrationStatus) => Promise<boolean>;
  updateRegistration: (id: string, data: Partial<any>) => Promise<boolean>;
  getRegistration: (id: string) => Promise<RegistrationWithStatus | null>;
  getPlayerRegistrations: (playerId: string) => Promise<RegistrationWithStatus[]>;
  
  // Specialized operations
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus, type: 'player' | 'team') => Promise<boolean>;
  checkIn: (id: string, userId?: string) => Promise<boolean>;
  submitWaiver: (registrationId: string, waiverData: WaiverData) => Promise<boolean>;
  
  // Sport-specific helpers
  getSportRequirements: (sportType: string) => {
    isTeamSport: boolean;
    teamSize: number;
    divisions: any[];
    requiredFields: string[];
  };
  
  // Offline synchronization
  syncNow: () => Promise<void>;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registrationService = useRegistrationService();

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
