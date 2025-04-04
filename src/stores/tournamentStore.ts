import { create } from "zustand";
import { Tournament, Match, Court, Team, Division } from "@/types/tournament";
import { generateId } from "@/utils/tournamentUtils";
import { assignCourtToMatch, autoAssignCourts } from "@/utils/courtUtils";
import { findMatchById, updateMatchInTournament } from "@/utils/tournamentUtils";
import { realtimeTournamentService } from "@/services/realtime/RealtimeTournamentService";
import { TournamentFormat, MatchStatus } from "@/types/tournament";

// Define the store state interface
interface TournamentState {
  // State
  tournaments: Tournament[];
  currentTournament: Tournament | null;

  // Tournament operations
  setCurrentTournament: (tournament: Tournament) => void;
  createTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => Tournament;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (tournamentId: string) => void;

  // Team operations
  addTeam: (team: Team) => void;
  importTeams: (teams: Team[]) => void;
  moveTeamToDivision: (teamId: string, fromDivision: Division, toDivision: Division) => void;

  // Match operations
  updateMatch: (match: Match) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => void;
  completeMatch: (matchId: string) => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;

  // Court operations
  updateCourt: (court: Court) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  autoAssignCourts: () => Promise<number>;
  
  // Tournament generation
  generateMultiStageTournament: () => Promise<void>;
  advanceToNextStage: () => Promise<void>;
}

// Load initial data from localStorage
const loadTournamentsFromStorage = (): Tournament[] => {
  const storedTournaments = localStorage.getItem('tournaments');
  console.log('[DEBUG] Loading tournaments from localStorage:', storedTournaments ? 'Found' : 'Not found');
  return storedTournaments ? JSON.parse(storedTournaments) : [];
};

const loadCurrentTournamentFromStorage = (): Tournament | null => {
  const storedCurrentTournament = localStorage.getItem('currentTournament');
  console.log('[DEBUG] Loading current tournament from localStorage:', storedCurrentTournament ? 'Found' : 'Not found');
  return storedCurrentTournament ? JSON.parse(storedCurrentTournament) : null;
};

// Create the store
export const useTournamentStore = create<TournamentState>((set, get) => ({
  // Initialize state from localStorage
  tournaments: loadTournamentsFromStorage(),
  currentTournament: loadCurrentTournamentFromStorage(),

  // Set current tournament
  setCurrentTournament: (tournament) => {
    set({ currentTournament: tournament });
    localStorage.setItem('currentTournament', JSON.stringify(tournament));
    realtimeTournamentService.publishTournamentUpdate(tournament);
  },

  // Create tournament
  createTournament: (tournamentData) => {
    const newTournament: Tournament = {
      id: generateId(),
      ...tournamentData,
      matches: [],
      currentStage: "INITIAL_ROUND",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set((state) => {
      const updatedTournaments = [...state.tournaments, newTournament];
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      return { tournaments: updatedTournaments, currentTournament: newTournament };
    });

    localStorage.setItem('currentTournament', JSON.stringify(newTournament));
    realtimeTournamentService.publishTournamentUpdate(newTournament);

    return newTournament;
  },

  // Update tournament
  updateTournament: (tournament) => {
    set((state) => {
      const updatedTournaments = state.tournaments.map(t => 
        t.id === tournament.id ? tournament : t
      );
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      
      // If this is the current tournament, update that reference too
      const updatedCurrentTournament = 
        state.currentTournament?.id === tournament.id 
          ? tournament 
          : state.currentTournament;
      
      if (updatedCurrentTournament?.id === tournament.id) {
        localStorage.setItem('currentTournament', JSON.stringify(tournament));
        realtimeTournamentService.publishTournamentUpdate(tournament);
      }
      
      return { 
        tournaments: updatedTournaments,
        currentTournament: updatedCurrentTournament
      };
    });
  },

  // Delete tournament
  deleteTournament: (tournamentId) => {
    console.log(`Deleting tournament with ID: ${tournamentId}`);
    
    set((state) => {
      const updatedTournaments = state.tournaments.filter(t => t.id !== tournamentId);
      console.log(`Removed tournament. Remaining tournaments: ${updatedTournaments.length}`);
      
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      
      // If we're deleting the current tournament, clear it
      let updatedCurrentTournament = state.currentTournament;
      if (state.currentTournament?.id === tournamentId) {
        console.log('Current tournament deleted, clearing current tournament.');
        updatedCurrentTournament = null;
        localStorage.removeItem('currentTournament');
      }
      
      return {
        tournaments: updatedTournaments,
        currentTournament: updatedCurrentTournament
      };
    });
  },

  // Team operations
  addTeam: (team) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const updatedTournament = {
      ...currentTournament,
      teams: [...currentTournament.teams, team],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  },

  importTeams: (teams) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const updatedTournament = {
      ...currentTournament,
      teams: [...currentTournament.teams, ...teams],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  },

  moveTeamToDivision: (teamId, fromDivision, toDivision) => {
    // Implementation would go here
    console.log(`Moving team ${teamId} from ${fromDivision} to ${toDivision}`);
    // This would need to be implemented based on the existing logic
  },

  // Match operations
  updateMatch: (match) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === match.id ? match : m
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  },

  updateMatchStatus: (matchId, status) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const match = findMatchById(currentTournament, matchId);
    if (!match) return;
    
    const updatedMatch = { ...match, status, updatedAt: new Date() };
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  },

  updateMatchScore: (matchId, setIndex, team1Score, team2Score) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const match = findMatchById(currentTournament, matchId);
    if (!match) return;
    
    // Create a copy of the scores array
    const updatedScores = [...match.scores];
    
    // Add empty sets if needed
    while (updatedScores.length <= setIndex) {
      updatedScores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Update the score for the specified set
    updatedScores[setIndex] = { team1Score, team2Score };
    
    const updatedMatch = { 
      ...match, 
      scores: updatedScores,
      updatedAt: new Date()
    };
    
    const updatedTournament = updateMatchInTournament(currentTournament, updatedMatch);
    updateTournament(updatedTournament);
  },

  completeMatch: (matchId) => {
    // Would need implementation based on existing completeMatch logic
    // For now, this is a placeholder that would call existing logic
  },

  scheduleMatch: (team1Id, team2Id, scheduledTime, courtId, categoryId) => {
    // Would need implementation based on existing scheduleMatch logic
    // For now, this is a placeholder that would call existing logic
  },

  // Court operations
  updateCourt: (court) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const updatedCourts = currentTournament.courts.map(c => 
      c.id === court.id ? court : c
    );
    
    const updatedTournament = {
      ...currentTournament,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  },

  assignCourt: (matchId, courtId) => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return;
    
    const updatedTournament = assignCourtToMatch(currentTournament, matchId, courtId);
    if (updatedTournament) {
      updateTournament(updatedTournament);
    }
  },

  autoAssignCourts: async () => {
    const { currentTournament, updateTournament } = get();
    if (!currentTournament) return 0;
    
    const result = await autoAssignCourts(currentTournament);
    updateTournament(result.tournament);
    return result.assignedCount;
  },

  // Added placeholder implementations for generating tournaments
  generateMultiStageTournament: async () => {
    console.log("Generating multi-stage tournament");
    // Implementation would depend on your tournament generation logic
  },

  advanceToNextStage: async () => {
    console.log("Advancing tournament to next stage");
    // Implementation would depend on your tournament stage advancement logic
  },
}));
