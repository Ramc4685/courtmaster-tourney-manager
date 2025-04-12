import { create } from "zustand";
import { Tournament, TournamentCategory, Match, Team } from "@/types/tournament";
import { TournamentFormat, CategoryType, TournamentStage, TournamentStatus } from "@/types/tournament-enums";
import { TournamentFormValues } from "@/components/admin/tournament/types";
import { tournamentService } from "@/services/tournament/TournamentService";

interface TournamentStore {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  currentTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
  
  // Core tournament operations
  loadTournaments: () => Promise<void>;
  createTournament: (data: TournamentFormValues) => Promise<Tournament>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  selectTournament: (id: string) => void;
  clearSelectedTournament: () => void;
  setCurrentTournament: (tournament: Tournament) => Promise<void>;
  
  // Match operations
  updateMatch: (match: Match) => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<void>;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => Promise<void>;
  completeMatch: (matchId: string) => Promise<void>;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => Promise<void>;
  
  // Court operations
  assignCourt: (matchId: string, courtId: string) => Promise<void>;
  autoAssignCourts: () => Promise<number>;
  startMatchesWithCourts: () => Promise<number>;
  initializeScoring: (matchId: string) => Promise<Match | null>;
  
  // Team operations
  addTeam: (team: Team) => Promise<void>;
  importTeams: (teams: Team[]) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  
  // Additional tournament operations
  generateBrackets: () => Promise<number>;
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: any) => Promise<any>;
  generateMultiStageTournament: () => Promise<void>;
  advanceToNextStage: () => Promise<void>;
  loadSampleData: (format?: TournamentFormat) => Promise<void>;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => Promise<void>;
}

const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  selectedTournament: null,
  currentTournament: null,
  isLoading: false,
  error: null,

  createTournament: async (data: TournamentFormValues) => {
    set({ isLoading: true, error: null });
    try {
      const newTournament: Tournament = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || '',
        format: data.format,
        status: TournamentStatus.DRAFT,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        registrationEnabled: data.registrationEnabled,
        requirePlayerProfile: data.requirePlayerProfile,
        registrationDeadline: new Date(data.registrationDeadline),
        maxTeams: data.maxTeams,
        scoringSettings: {
          matchFormat: 'STANDARD',
          pointsToWin: data.scoringRules.pointsToWin,
          mustWinByTwo: data.scoringRules.mustWinByTwo,
          maxPoints: data.scoringRules.maxPoints,
          maxSets: 3,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: 30,
          setsToWin: 2
        },
        categories: [], // Categories will be added based on divisions
        teams: [],
        matches: [],
        courts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStage: TournamentStage.REGISTRATION,
      };

      // TODO: Add API call to create tournament
      set(state => ({
        tournaments: [...state.tournaments, newTournament],
        currentTournament: newTournament,
        isLoading: false,
      }));

      return newTournament;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create tournament", isLoading: false });
      throw error;
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
    const currentTournament = get().currentTournament;
    if (!currentTournament) {
      throw new Error("No tournament selected");
    }

    const updatedTeams = [...currentTournament.teams, team];
    await get().updateTournament(currentTournament.id, { 
      teams: updatedTeams,
      updatedAt: new Date()
    });
  },

  importTeams: async (teams: Team[]) => {
    console.log("Importing teams:", teams.length);
    // Implementation would go here
  },

  updateTeam: async (team: Team) => {
    console.log("Updating team:", team);
    const currentTournament = get().currentTournament;
    if (!currentTournament) return;

    const updatedTeams = currentTournament.teams.map(t => 
      t.id === team.id ? team : t
    );

    await get().updateTournament(currentTournament.id, { 
      teams: updatedTeams,
      updatedAt: new Date()
    });
  },

  // Add implementation for deleteTeam
  deleteTeam: async (teamId: string) => {
    console.log("Deleting team:", teamId);
    const currentTournament = get().currentTournament;
    if (!currentTournament) return;

    const updatedTeams = currentTournament.teams.filter(t => t.id !== teamId);

    await get().updateTournament(currentTournament.id, { 
      teams: updatedTeams,
      updatedAt: new Date()
    });
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
  },

  loadTournaments: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Add API call to load tournaments
      const loadedTournaments = await tournamentService.getTournaments();
      set({ 
        tournaments: loadedTournaments,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load tournaments", isLoading: false });
      throw error;
    }
  }
}));

export const useTournament = () => {
  const store = useTournamentStore();
  return {
    ...store,
    // Add any additional methods or computed values here
  };
};
