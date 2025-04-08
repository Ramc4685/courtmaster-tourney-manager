
import { create } from "zustand";
import { Tournament, TournamentFormat, TournamentCategory, CategoryType, TournamentStatus, Match, Team } from "@/types/tournament";
import { TournamentFormValues } from "@/components/admin/tournament/types";

interface TournamentStore {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  currentTournament: Tournament | null; // Added this property
  isLoading: boolean;
  error: string | null;
  
  // Core tournament operations
  createTournament: (data: TournamentFormValues) => Promise<void>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  selectTournament: (id: string) => void;
  clearSelectedTournament: () => void;
  setCurrentTournament: (tournament: Tournament) => Promise<void>; // Added this method
  
  // Match operations
  updateMatch: (match: Match) => Promise<void>; // Added this method
  updateMatchStatus: (matchId: string, status: string) => Promise<void>; // Added this method
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => Promise<void>; // Added this method
  completeMatch: (matchId: string) => Promise<void>; // Added this method
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => Promise<void>; // Added this method
  
  // Court operations
  assignCourt: (matchId: string, courtId: string) => Promise<void>; // Added this method
  autoAssignCourts: () => Promise<number>; // Added this method
  startMatchesWithCourts: () => Promise<number>; // Added this method
  initializeScoring: (matchId: string) => Promise<Match | null>; // Added this method
  
  // Team operations
  addTeam: (team: Team) => Promise<void>; // Added this method
  importTeams: (teams: Team[]) => Promise<void>; // Added this method
  
  // Additional tournament operations
  generateBrackets: () => Promise<number>; // Added this method
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: any) => Promise<any>; // Added this method
  generateMultiStageTournament: () => Promise<void>; // Added this method
  advanceToNextStage: () => Promise<void>; // Added this method
  loadSampleData: (format?: TournamentFormat) => Promise<void>; // Added this method
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => Promise<void>; // Added this method
}

const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  selectedTournament: null,
  currentTournament: null, // Added this property
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
        currentStage: "INITIAL_ROUND", // Add the missing required field
      };

      // TODO: Add API call to create tournament
      set(state => ({
        tournaments: [...state.tournaments, newTournament],
        currentTournament: newTournament, // Set as current tournament
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
        currentTournament: state.currentTournament?.id === id
          ? { ...state.currentTournament, ...data, updatedAt: new Date() }
          : state.currentTournament,
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
        currentTournament: state.currentTournament?.id === id ? null : state.currentTournament,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to delete tournament", isLoading: false });
    }
  },

  selectTournament: (id: string) => {
    const tournament = get().tournaments.find(t => t.id === id);
    set({ 
      selectedTournament: tournament || null,
      currentTournament: tournament || null // Also set as current
    });
  },

  clearSelectedTournament: () => {
    set({ 
      selectedTournament: null,
      currentTournament: null // Also clear current
    });
  },

  // Added stub implementation for the new methods
  setCurrentTournament: async (tournament: Tournament) => {
    set({ currentTournament: tournament });
  },

  updateMatch: async (match: Match) => {
    console.log("Updating match:", match.id);
    // Implementation would go here
  },

  updateMatchStatus: async (matchId: string, status: string) => {
    console.log("Updating match status:", matchId, status);
    // Implementation would go here
  },

  updateMatchScore: async (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    console.log("Updating match score:", matchId, setIndex, team1Score, team2Score);
    // Implementation would go here
  },

  completeMatch: async (matchId: string) => {
    console.log("Completing match:", matchId);
    // Implementation would go here
  },

  scheduleMatch: async (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
    console.log("Scheduling match:", team1Id, team2Id, scheduledTime, courtId, categoryId);
    // Implementation would go here
  },

  assignCourt: async (matchId: string, courtId: string) => {
    console.log("Assigning court:", matchId, courtId);
    // Implementation would go here
  },

  autoAssignCourts: async () => {
    console.log("Auto-assigning courts");
    return 0; // Return number of courts assigned
  },

  startMatchesWithCourts: async () => {
    console.log("Starting matches with courts");
    return 0; // Return number of matches started
  },

  initializeScoring: async (matchId: string) => {
    console.log("Initializing scoring for match:", matchId);
    return null; // Return initialized match
  },

  addTeam: async (team: Team) => {
    console.log("Adding team:", team);
    // Implementation would go here
  },

  importTeams: async (teams: Team[]) => {
    console.log("Importing teams:", teams.length);
    // Implementation would go here
  },

  generateBrackets: async () => {
    console.log("Generating brackets");
    return 0; // Return number of brackets generated
  },

  scheduleMatches: async (teamPairs: { team1: Team; team2: Team }[], options: any) => {
    console.log("Scheduling matches:", teamPairs.length);
    return { matchesScheduled: 0 }; // Return scheduling result
  },

  generateMultiStageTournament: async () => {
    console.log("Generating multi-stage tournament");
    // Implementation would go here
  },

  advanceToNextStage: async () => {
    console.log("Advancing to next stage");
    // Implementation would go here
  },

  loadSampleData: async (format?: TournamentFormat) => {
    console.log("Loading sample data:", format);
    // Implementation would go here
  },

  loadCategoryDemoData: async (tournamentId: string, categoryId: string, format: TournamentFormat) => {
    console.log("Loading category demo data:", tournamentId, categoryId, format);
    // Implementation would go here
  }
}));

export const useTournament = () => {
  const store = useTournamentStore();
  return {
    ...store,
    // Add any additional methods or computed values here
  };
};
