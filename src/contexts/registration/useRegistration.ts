import { useState, useCallback } from 'react';
import { registrationService } from '@/services/api';
import { Registration, RegistrationStatus } from '@/types/entities';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';

export function useRegistration() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistrationWithStatus[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistrationWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRegistrations = useCallback(async (tournamentId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const [allRegs, playerRegs, teamRegs] = await Promise.all([
        registrationService.listRegistrations(tournamentId),
        registrationService.listPlayerRegistrations(tournamentId),
        registrationService.listTeamRegistrations(tournamentId)
      ]);
      
      setRegistrations(allRegs);
      setPlayerRegistrations(playerRegs);
      setTeamRegistrations(teamRegs);
    } catch (err) {
      setError('Failed to fetch registrations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlayerStatus = useCallback(async (id: string, status: RegistrationStatus) => {
    try {
      await registrationService.updateRegistrationStatus(id, status);
      setPlayerRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, status } : reg)
      );
      setRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, status } : reg)
      );
    } catch (err) {
      setError('Failed to update player status');
      console.error(err);
    }
  }, []);

  const updateTeamStatus = useCallback(async (id: string, status: RegistrationStatus) => {
    try {
      await registrationService.updateRegistrationStatus(id, status);
      setTeamRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, status } : reg)
      );
      setRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, status } : reg)
      );
    } catch (err) {
      setError('Failed to update team status');
      console.error(err);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: RegistrationStatus, type: 'player' | 'team') => {
    try {
      await registrationService.bulkUpdateStatus(ids, status);
      
      if (type === 'player') {
        setPlayerRegistrations(prev => 
          prev.map(reg => ids.includes(reg.id) ? { ...reg, status } : reg)
        );
      } else {
        setTeamRegistrations(prev => 
          prev.map(reg => ids.includes(reg.id) ? { ...reg, status } : reg)
        );
      }
      
      setRegistrations(prev => 
        prev.map(reg => ids.includes(reg.id) ? { ...reg, status } : reg)
      );
    } catch (err) {
      setError(`Failed to bulk update ${type} statuses`);
      console.error(err);
    }
  }, []);

  const notifyWaitlisted = useCallback(async (id: string) => {
    try {
      // This would normally send a notification to the waitlisted registrant
      console.log('Notifying waitlisted registration:', id);
      return true;
    } catch (err) {
      setError('Failed to notify waitlisted registration');
      console.error(err);
      return false;
    }
  }, []);

  const registerPlayer = useCallback(async (data: any) => {
    // Implementation would come here
    console.log('Registering player:', data);
  }, []);

  const registerTeam = useCallback(async (data: any) => {
    // Implementation would come here
    console.log('Registering team:', data);
  }, []);

  return {
    registrations,
    playerRegistrations,
    teamRegistrations,
    isLoading,
    error,
    fetchRegistrations,
    updatePlayerStatus,
    updateTeamStatus,
    bulkUpdateStatus,
    notifyWaitlisted,
    registerPlayer,
    registerTeam
  };
}
