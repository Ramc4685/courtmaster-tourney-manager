import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { registrationService } from "@/services/api";
import { PlayerRegistration, TeamRegistration, RegistrationStatus } from "@/types/registration";
import { useToast } from "@/components/ui/use-toast";

interface RegistrationContextType {
  playerRegistrations: PlayerRegistration[];
  teamRegistrations: TeamRegistration[];
  isLoading: boolean;
  error: string | null;
  fetchRegistrations: (tournamentId: string) => Promise<void>;
  updatePlayerStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateTeamStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus, type: "player" | "team") => Promise<void>;
  updateWaitlistPosition: (id: string, newPosition: number) => Promise<void>; // Placeholder
  notifyWaitlisted: (id: string) => Promise<void>; // Placeholder
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(
  undefined
);

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistration[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRegistrations = useCallback(async (tournamentId: string) => {
    console.log(`[useRegistration] Fetching registrations for tournament: ${tournamentId}`);
    setIsLoading(true);
    setError(null);
    try {
      const [players, teams] = await Promise.all([
        registrationService.getPlayerRegistrations(tournamentId),
        registrationService.getTeamRegistrations(tournamentId),
      ]);
      setPlayerRegistrations(players);
      setTeamRegistrations(teams);
      console.log(`[useRegistration] Fetched ${players.length} player and ${teams.length} team registrations.`);
    } catch (err) {
      console.error("[useRegistration] Error fetching registrations:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to load registrations";
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updatePlayerStatus = useCallback(async (id: string, status: RegistrationStatus) => {
    console.log(`[useRegistration] Updating player registration ${id} status to ${status}`);
    setIsLoading(true);
    try {
      await registrationService.updatePlayerRegistrationStatus(id, status);
      setPlayerRegistrations((prev) =>
        prev.map((reg) => (reg.id === id ? { ...reg, status } : reg))
      );
      toast({ title: "Success", description: "Player registration status updated." });
    } catch (err) {
      console.error("[useRegistration] Error updating player status:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to update status";
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateTeamStatus = useCallback(async (id: string, status: RegistrationStatus) => {
    console.log(`[useRegistration] Updating team registration ${id} status to ${status}`);
    setIsLoading(true);
    try {
      await registrationService.updateTeamRegistrationStatus(id, status);
      setTeamRegistrations((prev) =>
        prev.map((reg) => (reg.id === id ? { ...reg, status } : reg))
      );
      toast({ title: "Success", description: "Team registration status updated." });
    } catch (err) {
      console.error("[useRegistration] Error updating team status:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to update status";
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: RegistrationStatus, type: "player" | "team") => {
    console.log(`[useRegistration] Bulk updating ${ids.length} ${type} registrations to ${status}`);
    setIsLoading(true);
    try {
      if (type === "player") {
        await registrationService.bulkUpdatePlayerStatus(ids, status);
        setPlayerRegistrations((prev) =>
          prev.map((reg) => (ids.includes(reg.id) ? { ...reg, status } : reg))
        );
      } else {
        await registrationService.bulkUpdateTeamStatus(ids, status);
        setTeamRegistrations((prev) =>
          prev.map((reg) => (ids.includes(reg.id) ? { ...reg, status } : reg))
        );
      }
      toast({ title: "Success", description: `Bulk ${type} registration status updated.` });
    } catch (err) {
      console.error(`[useRegistration] Error bulk updating ${type} status:`, err);
      const errorMsg = err instanceof Error ? err.message : "Failed to bulk update status";
      setError(errorMsg);
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Placeholder functions for waitlist management - requires backend implementation
  const updateWaitlistPosition = useCallback(async (id: string, newPosition: number) => {
    console.warn("[useRegistration] updateWaitlistPosition not implemented yet.", id, newPosition);
    toast({ variant: "default", title: "Info", description: "Waitlist position update not implemented." });
    // Placeholder: Update local state optimistically if needed
  }, [toast]);

  const notifyWaitlisted = useCallback(async (id: string) => {
    console.warn("[useRegistration] notifyWaitlisted not implemented yet.", id);
    toast({ variant: "default", title: "Info", description: "Waitlist notification not implemented." });
    // Placeholder: Call notification service
  }, [toast]);

  return (
    <RegistrationContext.Provider
      value={{
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
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return context;
};

