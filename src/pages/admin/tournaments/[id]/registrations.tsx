import React from "react";
import { useParams } from "react-router-dom";
import { useRegistration } from "@/contexts/registration/useRegistration";
import { useTournament } from "@/contexts/tournament/useTournament";
import RegistrationStatusList from "@/components/registration/RegistrationStatusList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RegistrationStatus } from "@/types/registration";

const TournamentRegistrationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    playerRegistrations,
    teamRegistrations,
    importPlayersFromCSV,
    importPlayersFromExcel,
    importTeamsFromCSV,
    importTeamsFromExcel,
    updatePlayerStatus,
    updateTeamStatus,
    bulkUpdateStatus,
    error,
  } = useRegistration();
  const { selectedTournament } = useTournament();

  const handleImportPlayers = async (file: File) => {
    if (!id) return;

    if (file.name.endsWith(".csv")) {
      await importPlayersFromCSV(id, file);
    } else if (file.name.endsWith(".xlsx")) {
      await importPlayersFromExcel(id, file);
    }
  };

  const handleImportTeams = async (file: File) => {
    if (!id) return;

    if (file.name.endsWith(".csv")) {
      await importTeamsFromCSV(id, file);
    } else if (file.name.endsWith(".xlsx")) {
      await importTeamsFromExcel(id, file);
    }
  };

  const handleUpdateStatus = async (registrationId: string, status: RegistrationStatus, type: "player" | "team") => {
    if (type === "player") {
      await updatePlayerStatus(registrationId, status);
    } else {
      await updateTeamStatus(registrationId, status);
    }
  };

  const handleBulkUpdateStatus = async (ids: string[], status: RegistrationStatus, type: "player" | "team") => {
    await bulkUpdateStatus(ids, status, type);
  };

  if (!selectedTournament) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Tournament not found</AlertDescription>
      </Alert>
    );
  }

  const tournamentRegistrations = {
    playerRegistrations: playerRegistrations.filter(
      (reg) => reg.tournamentId === id
    ),
    teamRegistrations: teamRegistrations.filter(
      (reg) => reg.tournamentId === id
    ),
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tournament Registrations</h1>
        <p className="text-muted-foreground">
          Manage player and team registrations for {selectedTournament.name}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-lg border p-6">
        <RegistrationStatusList
          {...tournamentRegistrations}
          onImportPlayers={handleImportPlayers}
          onImportTeams={handleImportTeams}
          onUpdateStatus={handleUpdateStatus}
          onBulkUpdateStatus={handleBulkUpdateStatus}
        />
      </div>
    </div>
  );
};

export default TournamentRegistrationsPage; 