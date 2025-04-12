import React from "react";
import { useParams } from "react-router-dom";
import { useRegistration } from "@/contexts/registration/useRegistration";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerRegistrationList } from "@/components/registration/PlayerRegistrationList";
import { TeamRegistrationList } from "@/components/registration/TeamRegistrationList";
import { WaitlistManager } from "@/components/registration/WaitlistManager";
import { RegistrationAnalytics } from "@/components/registration/RegistrationAnalytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { RegistrationStatus } from "@/types/registration";

const RegistrationManagement: React.FC = () => {
  const { id: tournamentId } = useParams<{ id: string }>();
  const { selectedTournament: tournament, isLoading: isTournamentLoading } = useTournament();
  const { user } = useAuth();
  const {
    playerRegistrations,
    teamRegistrations,
    isLoading,
    error,
    fetchRegistrations,
    updatePlayerStatus,
    updateTeamStatus,
    bulkUpdateStatus,
    updateWaitlistPosition,
    notifyWaitlisted,
  } = useRegistration();

  React.useEffect(() => {
    if (tournamentId) {
      fetchRegistrations(tournamentId);
    }
  }, [tournamentId, fetchRegistrations]);

  if (!user || (tournament && tournament.organizer_id !== user.id)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to manage registrations for this tournament.
        </AlertDescription>
      </Alert>
    );
  }

  if (isTournamentLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!tournament) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Tournament not found.</AlertDescription>
      </Alert>
    );
  }

  const filteredPlayerRegistrations = playerRegistrations.filter(
    (reg) => reg.tournamentId === tournamentId
  );

  const filteredTeamRegistrations = teamRegistrations.filter(
    (reg) => reg.tournamentId === tournamentId
  );

  const waitlistedRegistrations = [
    ...filteredPlayerRegistrations.filter((reg) => reg.status === "WAITLIST"),
    ...filteredTeamRegistrations.filter((reg) => reg.status === "WAITLIST"),
  ];

  const handleBulkUpdateStatus = async (ids: string[], status: RegistrationStatus, type: "player" | "team") => {
    await bulkUpdateStatus(ids, status, type);
    await fetchRegistrations(tournamentId);
  };

  const handlePromoteFromWaitlist = async (id: string) => {
    const registration = [...filteredPlayerRegistrations, ...filteredTeamRegistrations].find(
      (reg) => reg.id === id
    );
    if (registration) {
      const type = 'teamName' in registration ? 'team' : 'player';
      await bulkUpdateStatus([id], 'APPROVED', type);
      await fetchRegistrations(tournamentId);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registration Management</h1>
        <p className="text-muted-foreground">
          Manage player and team registrations for {tournament.name}
        </p>
      </div>

      <RegistrationAnalytics
        playerRegistrations={filteredPlayerRegistrations}
        teamRegistrations={filteredTeamRegistrations}
        divisions={tournament.divisions || []}
      />

      <Tabs defaultValue="players" className="w-full">
        <TabsList>
          <TabsTrigger value="players">Individual Players</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <PlayerRegistrationList
            registrations={filteredPlayerRegistrations}
            onUpdateStatus={updatePlayerStatus}
            onBulkUpdateStatus={(ids, status) => handleBulkUpdateStatus(ids, status, "player")}
          />
        </TabsContent>

        <TabsContent value="teams">
          <TeamRegistrationList
            registrations={filteredTeamRegistrations}
            onUpdateStatus={updateTeamStatus}
            onBulkUpdateStatus={(ids, status) => handleBulkUpdateStatus(ids, status, "team")}
          />
        </TabsContent>

        <TabsContent value="waitlist">
          <WaitlistManager
            registrations={waitlistedRegistrations}
            onPromote={handlePromoteFromWaitlist}
            onUpdatePosition={updateWaitlistPosition}
            onNotify={notifyWaitlisted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegistrationManagement; 