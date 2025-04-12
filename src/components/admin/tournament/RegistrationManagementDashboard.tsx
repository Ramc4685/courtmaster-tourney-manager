
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerRegistrationList } from '@/components/registration/PlayerRegistrationList';
import { TeamRegistrationList } from '@/components/registration/TeamRegistrationList';
import { WaitlistManager } from '@/components/registration/WaitlistManager';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus, RegistrationStatus } from '@/types/registration';
import { useRegistration } from '@/contexts/registration/useRegistration';
import { Division } from '@/types/entities';
import { registrationService } from '@/services/api';

interface RegistrationManagementDashboardProps {
  tournamentId: string;
  divisions: Division[];
}

export const RegistrationManagementDashboard: React.FC<RegistrationManagementDashboardProps> = ({ 
  tournamentId,
  divisions
}) => {
  const {
    playerRegistrations,
    teamRegistrations,
    isLoading,
    error,
    fetchRegistrations,
    updatePlayerStatus,
    updateTeamStatus,
    bulkUpdateStatus,
    notifyWaitlisted
  } = useRegistration();

  const [activeTab, setActiveTab] = useState('players');

  React.useEffect(() => {
    fetchRegistrations(tournamentId);
  }, [tournamentId, fetchRegistrations]);

  // Filter waitlisted registrations
  const waitlistedPlayers = playerRegistrations.filter(reg => reg.status === RegistrationStatus.WAITLIST || reg.status === RegistrationStatus.WAITLISTED);
  const waitlistedTeams = teamRegistrations.filter(reg => reg.status === RegistrationStatus.WAITLIST || reg.status === RegistrationStatus.WAITLISTED);
  const combinedWaitlist = [...waitlistedPlayers, ...waitlistedTeams].sort((a, b) => 
    (a.metadata.waitlistPosition || Infinity) - (b.metadata.waitlistPosition || Infinity)
  );

  const handlePromote = async (id: string) => {
    console.log('Promote:', id);
    try {
      await registrationService.promoteFromWaitlist(id, RegistrationStatus.PENDING);
      fetchRegistrations(tournamentId);
    } catch (error) {
      console.error("Failed to promote registration:", error);
    }
  };
  
  const handleUpdateWaitlistPosition = async (id: string, newPosition: number) => {
    console.log('Update position:', id, newPosition);
    try {
      await registrationService.updateWaitlistPosition(id, newPosition);
      fetchRegistrations(tournamentId);
    } catch (error) {
       console.error("Failed to update waitlist position:", error);
    }
  };

  const handleNotifyWaitlisted = async (id: string) => {
    console.log('Notify:', id);
    try {
       await notifyWaitlisted(id); 
       fetchRegistrations(tournamentId);
    } catch (error) {
       console.error("Failed to notify waitlisted registration:", error);
    }
  };

  const handleUpdatePlayerStatus = async (id: string, status: RegistrationStatus) => {
    await updatePlayerStatus(id, status);
  };

  const handleUpdateTeamStatus = async (id: string, status: RegistrationStatus) => {
     await updateTeamStatus(id, status);
  };

  const handleBulkUpdatePlayers = async (ids: string[], status: RegistrationStatus) => {
     await bulkUpdateStatus(ids, status, 'player');
  };

  const handleBulkUpdateTeams = async (ids: string[], status: RegistrationStatus) => {
     await bulkUpdateStatus(ids, status, 'team');
  };

  if (isLoading) return <div>Loading registrations...</div>;
  if (error) return <div className="text-red-500">Error loading registrations: {error}</div>;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="players">Player Registrations ({playerRegistrations.length})</TabsTrigger>
        <TabsTrigger value="teams">Team Registrations ({teamRegistrations.length})</TabsTrigger>
        <TabsTrigger value="waitlist">Waitlist ({combinedWaitlist.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="players">
        <PlayerRegistrationList 
          registrations={playerRegistrations} 
          onUpdateStatus={handleUpdatePlayerStatus}
          onBulkUpdateStatus={handleBulkUpdatePlayers}
          // Add other necessary props like division filters if needed
        />
      </TabsContent>

      <TabsContent value="teams">
         <TeamRegistrationList 
          registrations={teamRegistrations}
          onUpdateStatus={handleUpdateTeamStatus}
          onBulkUpdateStatus={handleBulkUpdateTeams}
          // Add other necessary props
        />
      </TabsContent>

      <TabsContent value="waitlist">
        <WaitlistManager 
          registrations={combinedWaitlist}
          onPromote={handlePromote}
          onUpdatePosition={handleUpdateWaitlistPosition}
          onNotify={handleNotifyWaitlisted}
        />
      </TabsContent>
    </Tabs>
  );
};
