
import React, { createContext, useState, useCallback } from 'react';
import { Registration, RegistrationStatus } from '@/types/entities';
import { registrationService } from '@/services/api';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';

interface RegistrationContextType {
  registrations: Registration[];
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  isLoading: boolean;
  error: string;
  registerPlayer: (data: {
    tournament_id: string;
    player_id: string;
    division_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  }) => Promise<Registration>;
  registerTeam: (data: {
    tournament_id: string;
    team_id: string;
    division_id: string;
    name: string;
    captain_id: string;
    players: { id: string; name: string }[];
  }) => Promise<Registration>;
  fetchRegistrations: (tournamentId: string) => Promise<void>;
  updateStatus: (registrationId: string, status: RegistrationStatus) => Promise<void>;
  updatePlayerStatus: (registrationId: string, status: RegistrationStatus) => Promise<void>;
  updateTeamStatus: (registrationId: string, status: RegistrationStatus) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus, type: 'player' | 'team') => Promise<void>;
  updateWaitlistPosition: (id: string, newPosition: number) => Promise<void>;
  notifyWaitlisted: (id: string) => Promise<void>;
}

export const RegistrationContext = createContext<RegistrationContextType>({
  registrations: [],
  playerRegistrations: [],
  teamRegistrations: [],
  isLoading: false,
  error: '',
  registerPlayer: async () => {
    throw new Error('registerPlayer not implemented');
  },
  registerTeam: async () => {
    throw new Error('registerTeam not implemented');
  },
  fetchRegistrations: async () => {
    throw new Error('fetchRegistrations not implemented');
  },
  updateStatus: async () => {
    throw new Error('updateStatus not implemented');
  },
  updatePlayerStatus: async () => {
    throw new Error('updatePlayerStatus not implemented');
  },
  updateTeamStatus: async () => {
    throw new Error('updateTeamStatus not implemented');
  },
  bulkUpdateStatus: async () => {
    throw new Error('bulkUpdateStatus not implemented');
  },
  updateWaitlistPosition: async () => {
    throw new Error('updateWaitlistPosition not implemented');
  },
  notifyWaitlisted: async () => {
    throw new Error('notifyWaitlisted not implemented');
  },
});

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistrationWithStatus[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistrationWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRegistrations = useCallback(async (tournamentId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await registrationService.getRegistrationsByTournament(tournamentId);
      setRegistrations(response);
      
      // These would actually transform the flat registrations into player/team specific objects
      // In a real implementation, you'd likely query players/teams separately or join them
      setPlayerRegistrations(
        response.filter(r => !r.metadata?.isTeam).map(r => ({
          id: r.id,
          firstName: r.metadata?.firstName || '',
          lastName: r.metadata?.lastName || '',
          email: r.metadata?.email || '',
          phone: r.metadata?.phone,
          status: r.status,
          divisionId: r.divisionId,
          createdAt: r.createdAt,
          metadata: r.metadata || {}
        }))
      );
      
      setTeamRegistrations(
        response.filter(r => r.metadata?.isTeam).map(r => ({
          id: r.id,
          teamName: r.metadata?.teamName || '',
          captainName: r.metadata?.captainName || '',
          playerCount: r.metadata?.playerCount || 0,
          status: r.status,
          divisionId: r.divisionId,
          createdAt: r.createdAt,
          metadata: r.metadata || {}
        }))
      );
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch registrations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPlayer = useCallback(async (data: {
    tournament_id: string;
    player_id: string;
    division_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  }) => {
    try {
      const registration = await registrationService.createRegistration({
        tournamentId: data.tournament_id,
        tournament_id: data.tournament_id,
        divisionId: data.division_id,
        division_id: data.division_id,
        playerId: data.player_id,
        player_id: data.player_id,
        status: RegistrationStatus.PENDING,
        metadata: {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          isTeam: false
        }
      });
      return registration;
    } catch (err) {
      console.error('Error registering player:', err);
      throw err;
    }
  }, []);

  const registerTeam = useCallback(async (data: {
    tournament_id: string;
    team_id: string;
    division_id: string;
    name: string;
    captain_id: string;
    players: { id: string; name: string }[];
  }) => {
    try {
      const registration = await registrationService.createRegistration({
        tournamentId: data.tournament_id,
        tournament_id: data.tournament_id,
        divisionId: data.division_id,
        division_id: data.division_id,
        playerId: data.captain_id, // Store captain as the main player
        player_id: data.captain_id,
        status: RegistrationStatus.PENDING,
        metadata: {
          teamName: data.name,
          teamId: data.team_id,
          captainId: data.captain_id,
          players: data.players,
          playerCount: data.players.length,
          isTeam: true
        }
      });
      return registration;
    } catch (err) {
      console.error('Error registering team:', err);
      throw err;
    }
  }, []);

  const updateStatus = useCallback(async (registrationId: string, status: RegistrationStatus) => {
    try {
      await registrationService.updateRegistrationStatus(registrationId, status);
      // Optimistically update the local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, status } : reg
        )
      );
      setPlayerRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, status } : reg
        )
      );
      setTeamRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, status } : reg
        )
      );
    } catch (err) {
      console.error('Error updating registration status:', err);
      throw err;
    }
  }, []);

  const updatePlayerStatus = useCallback(async (registrationId: string, status: RegistrationStatus) => {
    return updateStatus(registrationId, status);
  }, [updateStatus]);

  const updateTeamStatus = useCallback(async (registrationId: string, status: RegistrationStatus) => {
    return updateStatus(registrationId, status);
  }, [updateStatus]);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: RegistrationStatus, type: 'player' | 'team') => {
    try {
      // In a real implementation, you might want to do this in a transaction or batch operation
      await Promise.all(ids.map(id => registrationService.updateRegistrationStatus(id, status)));
      
      // Update the local state
      setRegistrations(prev => 
        prev.map(reg => 
          ids.includes(reg.id) ? { ...reg, status } : reg
        )
      );
      
      if (type === 'player') {
        setPlayerRegistrations(prev => 
          prev.map(reg => 
            ids.includes(reg.id) ? { ...reg, status } : reg
          )
        );
      } else {
        setTeamRegistrations(prev => 
          prev.map(reg => 
            ids.includes(reg.id) ? { ...reg, status } : reg
          )
        );
      }
    } catch (err) {
      console.error('Error bulk updating registration status:', err);
      throw err;
    }
  }, []);

  const updateWaitlistPosition = useCallback(async (id: string, newPosition: number) => {
    try {
      await registrationService.updateWaitlistPosition(id, newPosition);
      // This would update the local state with the new position
      // In a real implementation, you might want to re-fetch or update more carefully
    } catch (err) {
      console.error('Error updating waitlist position:', err);
      throw err;
    }
  }, []);

  const notifyWaitlisted = useCallback(async (id: string) => {
    try {
      // In a real implementation, this would send a notification to the waitlisted person
      console.log('Notifying waitlisted registration:', id);
      // For now, just pretend we're doing something
    } catch (err) {
      console.error('Error notifying waitlisted:', err);
      throw err;
    }
  }, []);

  return (
    <RegistrationContext.Provider
      value={{
        registrations,
        playerRegistrations,
        teamRegistrations,
        isLoading,
        error,
        registerPlayer,
        registerTeam,
        fetchRegistrations,
        updateStatus,
        updatePlayerStatus,
        updateTeamStatus,
        bulkUpdateStatus,
        updateWaitlistPosition,
        notifyWaitlisted
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
