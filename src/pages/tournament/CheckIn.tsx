import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useRegistration } from "@/contexts/registration/useRegistration";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import QRCheckIn from "@/components/check-in/QRCheckIn";
import { PlayerRegistrationList } from "@/components/registration/PlayerRegistrationList";
import { TeamRegistrationList } from "@/components/registration/TeamRegistrationList";
import { RegistrationStats } from "@/components/registration/RegistrationStats";

const CheckIn: React.FC = () => {
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
  } = useRegistration();

  React.useEffect(() => {
    if (tournamentId) {
      fetchRegistrations(tournamentId);
    }
  }, [tournamentId, fetchRegistrations]);

  const handleQRScan = async (data: string) => {
    try {
      const scanData = JSON.parse(data);
      if (scanData.id && scanData.type) {
        if (scanData.type === "player") {
          await updatePlayerStatus(scanData.id, "CHECKED_IN");
        } else if (scanData.type === "team") {
          await updateTeamStatus(scanData.id, "CHECKED_IN");
        }
      }
    } catch (error) {
      throw new Error("Invalid QR code");
    }
  };

  if (!user || (tournament && tournament.created_by !== user.id)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to manage check-ins for this tournament.
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

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tournament Check-in</h1>
        <p className="text-muted-foreground">
          Manage participant check-ins for {tournament.name}
        </p>
      </div>

      <RegistrationStats
        playerCount={filteredPlayerRegistrations.length}
        teamCount={filteredTeamRegistrations.length}
        tournament={tournament}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <QRCheckIn onScan={handleQRScan} />
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="players" className="w-full">
            <TabsList>
              <TabsTrigger value="players">Individual Players</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="players">
              <PlayerRegistrationList
                registrations={filteredPlayerRegistrations}
                onUpdateStatus={updatePlayerStatus}
              />
            </TabsContent>

            <TabsContent value="teams">
              <TeamRegistrationList
                registrations={filteredTeamRegistrations}
                onUpdateStatus={updateTeamStatus}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CheckIn; 