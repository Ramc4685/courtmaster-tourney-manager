import { create } from "zustand";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  PlayerRegistration,
  TeamRegistration,
  PlayerRegistrationWithStatus,
  TeamRegistrationWithStatus,
  RegistrationStatus,
} from "@/types/registration";

interface RegistrationStore {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  isLoading: boolean;
  error: string | null;
  registerPlayer: (tournamentId: string, data: PlayerRegistration) => Promise<void>;
  registerTeam: (tournamentId: string, data: TeamRegistration) => Promise<void>;
  importPlayersFromCSV: (tournamentId: string, file: File) => Promise<void>;
  importPlayersFromExcel: (tournamentId: string, file: File) => Promise<void>;
  importTeamsFromCSV: (tournamentId: string, file: File) => Promise<void>;
  importTeamsFromExcel: (tournamentId: string, file: File) => Promise<void>;
  updatePlayerStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateTeamStatus: (id: string, status: RegistrationStatus) => Promise<void>;
}

const useRegistrationStore = create<RegistrationStore>((set, get) => ({
  playerRegistrations: [],
  teamRegistrations: [],
  isLoading: false,
  error: null,

  registerPlayer: async (tournamentId: string, data: PlayerRegistration) => {
    set({ isLoading: true, error: null });
    try {
      const newRegistration: PlayerRegistrationWithStatus = {
        ...data,
        id: crypto.randomUUID(),
        tournamentId,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Add API call to register player
      set((state) => ({
        playerRegistrations: [...state.playerRegistrations, newRegistration],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to register player",
        isLoading: false,
      });
    }
  },

  registerTeam: async (tournamentId: string, data: TeamRegistration) => {
    set({ isLoading: true, error: null });
    try {
      const newRegistration: TeamRegistrationWithStatus = {
        ...data,
        id: crypto.randomUUID(),
        tournamentId,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Add API call to register team
      set((state) => ({
        teamRegistrations: [...state.teamRegistrations, newRegistration],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to register team",
        isLoading: false,
      });
    }
  },

  importPlayersFromCSV: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          const players = results.data.map((row: any) => ({
            firstName: row["First Name"],
            lastName: row["Last Name"],
            email: row["Email"],
            phone: row["Phone"] || "",
          }));

          // Register each player
          players.forEach((player: PlayerRegistration) => {
            get().registerPlayer(tournamentId, player);
          });
        },
        error: (error) => {
          set({ error: error.message, isLoading: false });
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import players from CSV",
        isLoading: false,
      });
    }
  },

  importPlayersFromExcel: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const players = data.map((row: any) => ({
        firstName: row["First Name"],
        lastName: row["Last Name"],
        email: row["Email"],
        phone: row["Phone"] || "",
      }));

      // Register each player
      players.forEach((player: PlayerRegistration) => {
        get().registerPlayer(tournamentId, player);
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import players from Excel",
        isLoading: false,
      });
    }
  },

  importTeamsFromCSV: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          const teams = results.data.map((row: any) => ({
            teamName: row["Team Name"],
            members: row["Member Names"]
              .split(",")
              .map((name: string) => {
                const [firstName, lastName] = name.trim().split(" ");
                return {
                  firstName,
                  lastName,
                  email: "",
                  phone: "",
                  isTeamCaptain: false,
                };
              }),
          }));

          // Register each team
          teams.forEach((team: TeamRegistration) => {
            get().registerTeam(tournamentId, team);
          });
        },
        error: (error) => {
          set({ error: error.message, isLoading: false });
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import teams from CSV",
        isLoading: false,
      });
    }
  },

  importTeamsFromExcel: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const teams = data.map((row: any) => ({
        teamName: row["Team Name"],
        members: row["Member Names"]
          .split(",")
          .map((name: string) => {
            const [firstName, lastName] = name.trim().split(" ");
            return {
              firstName,
              lastName,
              email: "",
              phone: "",
              isTeamCaptain: false,
            };
          }),
      }));

      // Register each team
      teams.forEach((team: TeamRegistration) => {
        get().registerTeam(tournamentId, team);
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import teams from Excel",
        isLoading: false,
      });
    }
  },

  updatePlayerStatus: async (id: string, status: RegistrationStatus) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Add API call to update player status
      set((state) => ({
        playerRegistrations: state.playerRegistrations.map((registration) =>
          registration.id === id
            ? { ...registration, status, updatedAt: new Date() }
            : registration
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update player status",
        isLoading: false,
      });
    }
  },

  updateTeamStatus: async (id: string, status: RegistrationStatus) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Add API call to update team status
      set((state) => ({
        teamRegistrations: state.teamRegistrations.map((registration) =>
          registration.id === id
            ? { ...registration, status, updatedAt: new Date() }
            : registration
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update team status",
        isLoading: false,
      });
    }
  },
}));

export const useRegistration = () => {
  const store = useRegistrationStore();
  return {
    ...store,
    // Add any additional methods or computed values here
  };
}; 