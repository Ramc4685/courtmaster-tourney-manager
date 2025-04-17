
import { useState } from 'react';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';
import { RegistrationStatus } from '@/types/tournament-enums';
import { registrationService, notificationService, emailService } from '@/services/api';

export const useRegistration = () => {
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistrationWithStatus[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistrationWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchRegistrations = async (tournamentId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const [players, teams] = await Promise.all([
        registrationService.listPlayerRegistrations(tournamentId),
        registrationService.listTeamRegistrations(tournamentId)
      ]);
      setPlayerRegistrations(players);
      setTeamRegistrations(teams);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayerStatus = async (id: string, status: RegistrationStatus) => {
    setIsLoading(true);
    setError('');
    try {
      await registrationService.updateRegistrationStatus(id, status);
      setPlayerRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id ? { ...reg, status } : reg
        )
      );
    } catch (err) {
      console.error('Error updating player status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating player status');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamStatus = async (id: string, status: RegistrationStatus) => {
    setIsLoading(true);
    setError('');
    try {
      await registrationService.updateRegistrationStatus(id, status);
      setTeamRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id ? { ...reg, status } : reg
        )
      );
    } catch (err) {
      console.error('Error updating team status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating team status');
    } finally {
      setIsLoading(false);
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: RegistrationStatus, type: 'player' | 'team') => {
    setIsLoading(true);
    setError('');
    try {
      await registrationService.bulkUpdateStatus(ids, status);
      if (type === 'player') {
        setPlayerRegistrations(prevRegistrations => 
          prevRegistrations.map(reg => 
            ids.includes(reg.id) ? { ...reg, status } : reg
          )
        );
      } else {
        setTeamRegistrations(prevRegistrations => 
          prevRegistrations.map(reg => 
            ids.includes(reg.id) ? { ...reg, status } : reg
          )
        );
      }
    } catch (err) {
      console.error('Error performing bulk update:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during bulk update');
    } finally {
      setIsLoading(false);
    }
  };

  const notifyWaitlisted = async (id: string): Promise<boolean> => {
    try {
      const registration = await registrationService.getRegistration(id);
      const email = registration.metadata?.contactEmail;
      
      if (!email) {
        console.error('No contact email for registration:', id);
        return false;
      }
      
      // Create notification in the system
      await notificationService.createNotification({
        user_id: registration.playerId || '',
        title: 'You are on the waitlist',
        message: 'You have been added to the waitlist for this tournament. We will notify you if a spot becomes available.',
        type: 'waitlist',
        read: false,
        updated_at: new Date().toISOString()
      });
      
      // Send email notification
      await emailService.sendEmail({
        to: email,
        subject: 'Tournament Waitlist Status',
        html: `
          <h1>You are on the waitlist</h1>
          <p>Dear ${registration.metadata?.playerName || 'Player'},</p>
          <p>You have been added to the waitlist for the tournament. Your current position is ${registration.metadata?.waitlistPosition || 'unknown'}.</p>
          <p>We will notify you if a spot becomes available.</p>
        `
      });
      
      return true;
    } catch (err) {
      console.error('Error sending waitlist notification:', err);
      return false;
    }
  };

  const registerPlayer = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      await registrationService.registerPlayer(data);
      // Refresh the registrations after adding a new one
      if (data.tournament_id) {
        await fetchRegistrations(data.tournament_id);
      }
    } catch (err) {
      console.error('Error registering player:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while registering player');
    } finally {
      setIsLoading(false);
    }
  };

  const registerTeam = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      await registrationService.registerTeam(data);
      // Refresh the registrations after adding a new one
      if (data.tournament_id) {
        await fetchRegistrations(data.tournament_id);
      }
    } catch (err) {
      console.error('Error registering team:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while registering team');
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
};
