import { create } from "zustand";
import { Tournament, TournamentFormat, TournamentCategory, CategoryType, TournamentStatus } from "@/types/tournament";
import { TournamentFormValues } from "@/components/admin/tournament/types";

interface TournamentStore {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
  createTournament: (data: TournamentFormValues) => Promise<void>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  selectTournament: (id: string) => void;
  clearSelectedTournament: () => void;
}

const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  selectedTournament: null,
  isLoading: false,
  error: null,

  createTournament: async (data: TournamentFormValues) => {
    set({ isLoading: true, error: null });
    try {
      // Transform the form data into the tournament format
      const categories: TournamentCategory[] = data.divisions.flatMap(division => 
        division.categories.map(category => ({
          id: crypto.randomUUID(),
          name: category.name,
          type: category.type,
          division: division.name,
        }))
      );

      const newTournament: Tournament = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        format: data.format,
        status: "DRAFT" as TournamentStatus,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        registrationEnabled: data.registrationEnabled,
        registrationDeadline: data.registrationDeadline,
        maxTeams: data.maxTeams,
        scoringRules: JSON.stringify(data.scoringRules),
        categories,
        teams: [],
        matches: [],
        courts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Add API call to create tournament
      set(state => ({
        tournaments: [...state.tournaments, newTournament],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create tournament", isLoading: false });
    }
  },

  updateTournament: async (id: string, data: Partial<Tournament>) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Add API call to update tournament
      set(state => ({
        tournaments: state.tournaments.map(tournament =>
          tournament.id === id ? { ...tournament, ...data, updatedAt: new Date() } : tournament
        ),
        selectedTournament: state.selectedTournament?.id === id
          ? { ...state.selectedTournament, ...data, updatedAt: new Date() }
          : state.selectedTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update tournament", isLoading: false });
    }
  },

  deleteTournament: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Add API call to delete tournament
      set(state => ({
        tournaments: state.tournaments.filter(tournament => tournament.id !== id),
        selectedTournament: state.selectedTournament?.id === id ? null : state.selectedTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to delete tournament", isLoading: false });
    }
  },

  selectTournament: (id: string) => {
    const tournament = get().tournaments.find(t => t.id === id);
    set({ selectedTournament: tournament || null });
  },

  clearSelectedTournament: () => {
    set({ selectedTournament: null });
  },
}));

export const useTournament = () => {
  const store = useTournamentStore();
  return {
    ...store,
    // Add any additional methods or computed values here
  };
};
