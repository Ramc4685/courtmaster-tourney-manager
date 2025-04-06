
import { create } from 'zustand';
import { useTournament } from '@/contexts/TournamentContext';
import { Tournament, Match, Team, TournamentFormat } from '@/types/tournament';

interface TournamentStoreState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  loadTournaments: () => Promise<void>;
  createTournament: (name: string, format: TournamentFormat) => Promise<void>;
  updateTournament: (tournament: Tournament) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  addTeamToTournament: (team: Team) => Promise<void>;
  removeTeamFromTournament: (teamId: string) => Promise<void>;
  addMatchToTournament: (match: Match) => Promise<void>;
  removeMatchFromTournament: (matchId: string) => Promise<void>;
}

export const useTournamentStore = create<TournamentStoreState>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  loadTournaments: async () => {
    // Placeholder for loading tournaments from API
    const mockTournaments: Tournament[] = [
      {
        id: '1',
        name: 'Tournament 1',
        format: 'SINGLE_ELIMINATION' as TournamentFormat,
        startDate: new Date(),
        endDate: new Date(),
        matches: [],
        teams: [],
        courts: [],
        status: 'DRAFT',
        currentStage: 'INITIAL_ROUND',
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        scoringSettings: {
          maxPoints: 21,
          maxSets: 3,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: 30,
        },
      },
      {
        id: '2',
        name: 'Tournament 2',
        format: 'ROUND_ROBIN' as TournamentFormat,
        startDate: new Date(),
        endDate: new Date(),
        matches: [],
        teams: [],
        courts: [],
        status: 'DRAFT',
        currentStage: 'INITIAL_ROUND',
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        scoringSettings: {
          maxPoints: 21,
          maxSets: 3,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: 30,
        },
      },
    ];
    set({ tournaments: mockTournaments });
  },
  createTournament: async (name: string, format: TournamentFormat) => {
    // Placeholder for creating a tournament via API
    const newTournament: Tournament = {
      id: Date.now().toString(),
      name,
      format,
      startDate: new Date(),
      endDate: new Date(),
      matches: [],
      teams: [],
      courts: [],
      status: 'DRAFT',
      currentStage: 'INITIAL_ROUND',
      createdAt: new Date(),
      updatedAt: new Date(),
      categories: [],
      scoringSettings: {
        maxPoints: 21,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30,
      },
    };
    set((state) => ({ tournaments: [...state.tournaments, newTournament] }));
  },
  updateTournament: async (tournament: Tournament) => {
    // Placeholder for updating a tournament via API
    set((state) => ({
      tournaments: state.tournaments.map((t) => (t.id === tournament.id ? tournament : t)),
    }));
  },
  deleteTournament: async (tournamentId: string) => {
    // Placeholder for deleting a tournament via API
    set((state) => ({
      tournaments: state.tournaments.filter((t) => t.id !== tournamentId),
    }));
  },
  addTeamToTournament: async (team: Team) => {
    set((state) => {
      if (state.currentTournament) {
        const updatedTournament = {
          ...state.currentTournament,
          teams: [...state.currentTournament.teams, team],
        };
        return {
          ...state,
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((t) =>
            t.id === updatedTournament.id ? updatedTournament : t
          ),
        };
      }
      return state;
    });
  },
  removeTeamFromTournament: async (teamId: string) => {
    set((state) => {
      if (state.currentTournament) {
        const updatedTournament = {
          ...state.currentTournament,
          teams: state.currentTournament.teams.filter((team) => team.id !== teamId),
        };
        return {
          ...state,
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((t) =>
            t.id === updatedTournament.id ? updatedTournament : t
          ),
        };
      }
      return state;
    });
  },
  addMatchToTournament: async (match: Match) => {
    set((state) => {
      if (state.currentTournament) {
        const updatedTournament = {
          ...state.currentTournament,
          matches: [...state.currentTournament.matches, match],
        };
        return {
          ...state,
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((t) =>
            t.id === updatedTournament.id ? updatedTournament : t
          ),
        };
      }
      return state;
    });
  },
  removeMatchFromTournament: async (matchId: string) => {
    set((state) => {
      if (state.currentTournament) {
        const updatedTournament = {
          ...state.currentTournament,
          matches: state.currentTournament.matches.filter((match) => match.id !== matchId),
        };
        return {
          ...state,
          currentTournament: updatedTournament,
          tournaments: state.tournaments.map((t) =>
            t.id === updatedTournament.id ? updatedTournament : t
          ),
        };
      }
      return state;
    });
  },
}));
