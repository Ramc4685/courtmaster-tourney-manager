import { create } from "zustand";
import Papa from "papaparse";
import ExcelJS from 'exceljs';
import { Registration } from "@/types/models";
import { RegistrationService } from "@/services/registration.service";
import { RegistrationStatus } from "@/types/registration";

interface RegistrationStore {
  registrations: Registration[];
  isLoading: boolean;
  error: string | null;
  registerPlayer: (data: {
    tournament_id: string;
    player_id: string;
    division_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  }) => Promise<void>;
  registerTeam: (data: {
    tournament_id: string;
    player_id: string;
    division_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    team_name: string;
    team_members: Array<{
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      is_team_captain?: boolean;
    }>;
  }) => Promise<void>;
  importPlayersFromCSV: (tournament_id: string, file: File) => Promise<void>;
  importPlayersFromExcel: (tournament_id: string, file: File) => Promise<void>;
  importTeamsFromCSV: (tournament_id: string, file: File) => Promise<void>;
  importTeamsFromExcel: (tournament_id: string, file: File) => Promise<void>;
  updateStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  fetchRegistrations: (tournament_id: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: RegistrationStatus) => Promise<void>;
  updateWaitlistPosition: (id: string, newPosition: number) => Promise<void>;
}

const registrationService = new RegistrationService();

const useRegistrationStore = create<RegistrationStore>((set, get) => ({
  registrations: [],
  isLoading: false,
  error: null,

  fetchRegistrations: async (tournament_id: string) => {
    set({ isLoading: true, error: null });
    try {
      const registrations = await registrationService.findByTournament(tournament_id);
      set({ registrations, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch registrations",
        isLoading: false,
      });
    }
  },

  registerPlayer: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.register({
        tournament_id: data.tournament_id,
        player_id: data.player_id,
        division_id: data.division_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
      });
      set(state => ({
        registrations: [...state.registrations, registration],
        isLoading: false
      }));
    } catch (error) {
      console.error("Error registering player:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to register player",
        isLoading: false,
      });
    }
  },

  registerTeam: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.register({
        tournament_id: data.tournament_id,
        player_id: data.player_id,
        division_id: data.division_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        team_name: data.team_name,
        team_members: data.team_members.map(member => ({
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          phone: member.phone,
          is_team_captain: member.is_team_captain
        }))
      });
      set(state => ({
        registrations: [...state.registrations, registration],
        isLoading: false
      }));
    } catch (error) {
      console.error("Error registering team:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to register team",
        isLoading: false,
      });
    }
  },

  importPlayersFromCSV: async (tournament_id: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          for (const row of results.data) {
            await get().registerPlayer({
              tournament_id,
              player_id: "",
              division_id: "",
              first_name: row["First Name"],
              last_name: row["Last Name"],
              email: row["Email"],
              phone: row["Phone"] || "",
            });
          }
          set({ isLoading: false });
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

  importPlayersFromExcel: async (tournament_id: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await file.arrayBuffer();
      const data = await parseExcelFile(buffer);

      for (const row of data) {
        await get().registerPlayer({
          tournament_id,
          player_id: "",
          division_id: "",
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone,
        });
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import players from Excel",
        isLoading: false,
      });
    }
  },

  importTeamsFromCSV: async (tournament_id: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          for (const row of results.data) {
            const team_members = row["Member Names"]
              .split(",")
              .map((name: string) => {
                const [first_name, last_name] = name.trim().split(" ");
                return {
                  first_name,
                  last_name,
                  email: "",
                  phone: "",
                  is_team_captain: false,
                };
              });

            await get().registerTeam({
              tournament_id,
              player_id: "",
              division_id: "",
              first_name: row["Captain First Name"],
              last_name: row["Captain Last Name"],
              email: row["Captain Email"],
              phone: row["Captain Phone"] || "",
              team_name: row["Team Name"],
              team_members,
            });
          }
          set({ isLoading: false });
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

  importTeamsFromExcel: async (tournament_id: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await file.arrayBuffer();
      const data = await parseExcelFile(buffer);

      for (const row of data) {
        await get().registerTeam({
          tournament_id,
          player_id: "",
          division_id: "",
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone,
          team_name: row.team_name,
          team_members: [
            {
              first_name: row.first_name,
              last_name: row.last_name,
              email: row.email,
              phone: row.phone,
              is_team_captain: row.is_team_captain
            }
          ],
        });
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import teams from Excel",
        isLoading: false,
      });
    }
  },

  updateStatus: async (id: string, status: RegistrationStatus) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.updateStatus(id, status);
      set(state => ({
        registrations: state.registrations.map(reg =>
          reg.id === id ? registration : reg
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error("Failed to update status:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update status",
        isLoading: false,
      });
    }
  },

  bulkUpdateStatus: async (ids: string[], status: RegistrationStatus) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all(ids.map(id => registrationService.updateStatus(id, status)));
      set(state => ({
        registrations: state.registrations.map(reg =>
          ids.includes(reg.id) ? { ...reg, status } : reg
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error("Failed to bulk update status:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update status",
        isLoading: false,
      });
    }
  },

  updateWaitlistPosition: async (id: string, newPosition: number) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.updateWaitlistPosition(id, newPosition);
      set(state => ({
        registrations: state.registrations.map(reg =>
          reg.id === id ? registration : reg
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error("Failed to update waitlist position:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update waitlist position",
        isLoading: false,
      });
    }
  },
}));

const parseExcelFile = async (buffer: ArrayBuffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1);
  
  const data = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    const values = row.values;
    data.push({
      first_name: values[1],
      last_name: values[2],
      email: values[3],
      phone: values[4],
      team_name: values[5],
      is_team_captain: values[6] === 'true' || values[6] === true
    });
  });
  
  return data;
};

export const useRegistration = () => {
  const store = useRegistrationStore();
  return {
    ...store,
  };
}; 