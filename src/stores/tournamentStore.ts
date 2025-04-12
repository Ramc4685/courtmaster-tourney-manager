import { create } from "zustand";
import type { Tournament, Match, Court, Team, MatchScore } from "@/types/tournament";
import { TournamentStage, StageType, TournamentFormat, MatchStatus, Division } from '@/types/tournament-enums';
import { generateId } from "@/utils/tournamentUtils";
import { assignCourtToMatch, autoAssignCourts } from "@/utils/courtUtils";
import { findMatchById, updateMatchInTournament } from "@/utils/tournamentUtils";
import { realtimeTournamentService } from "@/services/realtime/RealtimeTournamentService";
import { storageService } from "@/services/storage/StorageService";

// Define the store state interface
interface TournamentState {
  // State
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  tournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
  currentStage: TournamentStage;

  // Tournament operations
  loadTournaments: () => Promise<void>;
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
  updateMatchScore: (matchId: string, score: MatchScore) => void;
  completeMatch: (matchId: string) => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;

  // Court operations
  updateCourt: (court: Court) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  autoAssignCourts: () => Promise<number>;
  
  // Tournament generation
  generateMultiStageTournament: () => Promise<void>;
  advanceToNextStage: () => Promise<void>;

  // New operations
  setTournament: (tournament: Tournament) => void;
  updateTournamentStage: (stage: TournamentStage) => void;
}

interface TournamentActions {
  setTournament: (tournament: Tournament) => void;
  updateMatchScore: (matchId: string, score: MatchScore) => void;
  updateTournamentStage: (stage: TournamentStage) => void;
}

type TournamentStore = TournamentState & TournamentActions;

// Load initial data from storage service
const loadTournamentsFromStorage = async (): Promise<Tournament[]> => {
  console.log('[DEBUG] Loading tournaments from storage service');
  const tournaments = await storageService.getItem<Tournament[]>('tournaments');
  console.log('[DEBUG] Loaded tournaments:', tournaments?.length || 0);
  return tournaments || [];
};

const loadCurrentTournamentFromStorage = async (): Promise<Tournament | null> => {
  console.log('[DEBUG] Loading current tournament from storage service');
  const tournament = await storageService.getItem<Tournament>('currentTournament');
  console.log('[DEBUG] Current tournament:', tournament ? 'Found' : 'Not found');
  return tournament;
};

// Create the store
export const useTournamentStore = create<TournamentStore>((set, get) => {
  // Helper functions for tournament stage management
  const generateNextTournamentStage = (tournament: Tournament): TournamentStage => {
    const nextStage = advanceToNextStage(tournament);
    
    if (nextStage === TournamentStage.GROUP_STAGE) {
      tournament.matches = generateGroupStageMatches(tournament);
    } else if (nextStage === TournamentStage.ELIMINATION_ROUND) {
      tournament.matches = generateEliminationRoundMatches(tournament);
    } else if (nextStage === TournamentStage.FINALS) {
      tournament.matches = generateFinalMatches(tournament);
    }
    
    return nextStage;
  };

  const advanceToNextStage = (tournament: Tournament): TournamentStage => {
    switch (tournament.currentStage) {
      case TournamentStage.REGISTRATION:
        return TournamentStage.SEEDING;
      case TournamentStage.SEEDING:
        return TournamentStage.GROUP_STAGE;
      case TournamentStage.GROUP_STAGE:
        return TournamentStage.ELIMINATION_ROUND;
      case TournamentStage.ELIMINATION_ROUND:
        return TournamentStage.FINALS;
      case TournamentStage.FINALS:
        return TournamentStage.COMPLETED;
      default:
        return tournament.currentStage;
    }
  };

  const isStageComplete = (tournament: Tournament): boolean => {
    if (!tournament.matches || tournament.matches.length === 0) {
      return true;
    }

    const incompleteMatches = tournament.matches.filter(match => 
      match.stage === tournament.currentStage && 
      match.status !== MatchStatus.COMPLETED
    );

    return incompleteMatches.length === 0;
  };

  const generateNextStageMatches = (tournament: Tournament): Match[] => {
    switch (tournament.currentStage) {
      case TournamentStage.GROUP_STAGE:
        return generateGroupStageMatches(tournament);
      case TournamentStage.ELIMINATION_ROUND:
        return generateEliminationRoundMatches(tournament);
      case TournamentStage.FINALS:
        return generateFinalMatches(tournament);
      default:
        return [];
    }
  };

  const generateGroupStageMatches = (tournament: Tournament): Match[] => {
    // Implementation of generateGroupStageMatches
    return [];
  };

  const generateEliminationRoundMatches = (tournament: Tournament): Match[] => {
    // Implementation of generateEliminationRoundMatches
    return [];
  };

  const generateFinalMatches = (tournament: Tournament): Match[] => {
    // Implementation of generateFinalMatches
    return [];
  };

  const generateMatchId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const updateMatchScore = (match: Match, scores: MatchScore[]) => {
    const latestScore = scores[scores.length - 1];
    return {
      ...match,
      scores,
      team1Score: latestScore?.team1Score || 0,
      team2Score: latestScore?.team2Score || 0,
    };
  };

  const updateTournamentStage = (tournament: Tournament, stage: TournamentStage) => {
    return {
      ...tournament,
      currentStage: stage,
      updatedAt: new Date(),
    };
  };

  return {
    // Initialize state
    tournaments: [],
    currentTournament: null,
    tournament: null,
    isLoading: false,
    error: null,
    currentStage: TournamentStage.REGISTRATION,

    // Load tournaments from storage
    loadTournaments: async () => {
      console.log('[DEBUG] Loading tournaments from storage');
      set({ isLoading: true });
      try {
        const [storedTournaments, storedCurrentTournament] = await Promise.all([
          loadTournamentsFromStorage(),
          loadCurrentTournamentFromStorage()
        ]);
        console.log('[DEBUG] Loaded tournaments:', storedTournaments.length);
        set({ 
          tournaments: storedTournaments,
          currentTournament: storedCurrentTournament,
          isLoading: false 
        });
        return Promise.resolve();
      } catch (error) {
        console.error('[ERROR] Failed to load tournaments:', error);
        set({ error: 'Failed to load tournaments', isLoading: false });
        return Promise.reject(error);
      }
    },

    // Set current tournament
    setCurrentTournament: async (tournament) => {
      set({ currentTournament: tournament });
      await storageService.setItem('currentTournament', tournament);
      realtimeTournamentService.publishTournamentUpdate(tournament);
    },

    // Create tournament
    createTournament: (tournamentData) => {
      const newTournament: Tournament = {
        id: generateId(),
        ...tournamentData,
        matches: [],
        currentStage: TournamentStage.REGISTRATION,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTournaments = [...get().tournaments, newTournament];
      storageService.setItem('tournaments', updatedTournaments);
      storageService.setItem('currentTournament', newTournament);
      
      set({ 
        tournaments: updatedTournaments, 
        currentTournament: newTournament 
      });

      realtimeTournamentService.publishTournamentUpdate(newTournament);
      return newTournament;
    },

    // Update tournament
    updateTournament: (tournament) => {
      const state = get();
      const updatedTournaments = state.tournaments.map(t => 
        t.id === tournament.id ? tournament : t
      );
      
      // If this is the current tournament, update that reference too
      const updatedCurrentTournament = 
        state.currentTournament?.id === tournament.id 
          ? tournament 
          : state.currentTournament;
      
      storageService.setItem('tournaments', updatedTournaments);
      
      if (updatedCurrentTournament?.id === tournament.id) {
        storageService.setItem('currentTournament', tournament);
        realtimeTournamentService.publishTournamentUpdate(tournament);
      }
      
      set({ 
        tournaments: updatedTournaments,
        currentTournament: updatedCurrentTournament
      });
    },

    // Delete tournament
    deleteTournament: (tournamentId) => {
      console.log(`Deleting tournament with ID: ${tournamentId}`);
      const state = get();
      
      const updatedTournaments = state.tournaments.filter(t => t.id !== tournamentId);
      console.log(`Removed tournament. Remaining tournaments: ${updatedTournaments.length}`);
      
      storageService.setItem('tournaments', updatedTournaments);
      
      // If we're deleting the current tournament, clear it
      let updatedCurrentTournament = state.currentTournament;
      if (state.currentTournament?.id === tournamentId) {
        console.log('Current tournament deleted, clearing current tournament.');
        updatedCurrentTournament = null;
        storageService.removeItem('currentTournament');
      }
      
      set({
        tournaments: updatedTournaments,
        currentTournament: updatedCurrentTournament
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

    updateMatchScore: (matchId, score) => {
      const { currentTournament, updateTournament } = get();
      if (!currentTournament) return;
      
      const updatedMatches = currentTournament.matches.map((match) => {
        if (match.id === matchId) {
          const updatedScores = [...(match.scores || [])];
          updatedScores.push([score.team1Score, score.team2Score]);
          
          return {
            ...match,
            team1Score: score.team1Score,
            team2Score: score.team2Score,
            scores: updatedScores,
            updatedAt: new Date()
          };
        }
        return match;
      });
      
      const updatedTournament = {
        ...currentTournament,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      
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
      const { currentTournament, updateTournament } = get();
      if (!currentTournament) return;

      const nextStage = advanceToNextStage(currentTournament);
      const updatedTournament = {
        ...currentTournament,
        currentStage: nextStage,
        updatedAt: new Date()
      };

      updateTournament(updatedTournament);
    },

    advanceToNextStage: async () => {
      const { currentTournament, updateTournament } = get();
      if (!currentTournament) return;

      // Validate current stage is complete
      if (!isStageComplete(currentTournament)) {
        throw new Error('Cannot advance - current stage is not complete');
      }

      // Generate next stage based on current results
      const nextStage = generateNextTournamentStage(currentTournament);
      if (!nextStage) {
        throw new Error('Tournament has reached final stage');
      }

      const nextStageMatches = generateNextStageMatches(currentTournament);

      const updatedTournament = {
        ...currentTournament,
        currentStage: nextStage,
        matches: [...currentTournament.matches, ...nextStageMatches],
        updatedAt: new Date()
      };

      updateTournament(updatedTournament);
    },

    // New operations
    setTournament: (tournament) => set({ tournament }),
    updateTournamentStage: (stage) => set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: {
          ...state.tournament,
          currentStage: stage,
          updatedAt: new Date()
        }
      };
    })
  };
});

// Helper functions for tournament stage management
export const generateNextTournamentStage = (tournament: Tournament): TournamentStage => {
  const nextStage = advanceToNextStage(tournament);
  
  if (nextStage === TournamentStage.GROUP_STAGE) {
    tournament.matches = generateGroupStageMatches(tournament);
  } else if (nextStage === TournamentStage.ELIMINATION_ROUND) {
    tournament.matches = generateEliminationRoundMatches(tournament);
  } else if (nextStage === TournamentStage.FINALS) {
    tournament.matches = generateFinalMatches(tournament);
  }
  
  return nextStage;
};

export const advanceToNextStage = (tournament: Tournament): TournamentStage => {
  switch (tournament.currentStage) {
    case TournamentStage.REGISTRATION:
      return TournamentStage.SEEDING;
    case TournamentStage.SEEDING:
      return TournamentStage.GROUP_STAGE;
    case TournamentStage.GROUP_STAGE:
      return TournamentStage.ELIMINATION_ROUND;
    case TournamentStage.ELIMINATION_ROUND:
      return TournamentStage.FINALS;
    case TournamentStage.FINALS:
      return TournamentStage.COMPLETED;
    default:
      return tournament.currentStage;
  }
};

export const isStageComplete = (tournament: Tournament): boolean => {
  if (!tournament.matches || tournament.matches.length === 0) {
    return true;
  }

  const incompleteMatches = tournament.matches.filter(match => 
    match.stage === tournament.currentStage && 
    match.status !== MatchStatus.COMPLETED
  );

  return incompleteMatches.length === 0;
};

export const generateNextStageMatches = (tournament: Tournament): Match[] => {
  switch (tournament.currentStage) {
    case TournamentStage.GROUP_STAGE:
      return generateGroupStageMatches(tournament);
    case TournamentStage.ELIMINATION_ROUND:
      return generateEliminationRoundMatches(tournament);
    case TournamentStage.FINALS:
      return generateFinalMatches(tournament);
    default:
      return [];
  }
};

const generateGroupStageMatches = (tournament: Tournament): Match[] => {
  // Implementation of generateGroupStageMatches
  return [];
};

const generateEliminationRoundMatches = (tournament: Tournament): Match[] => {
  // Implementation of generateEliminationRoundMatches
  return [];
};

const generateFinalMatches = (tournament: Tournament): Match[] => {
  // Implementation of generateFinalMatches
  return [];
};

const generateMatchId = () => {
  return Math.random().toString(36).substring(2, 15);
};

const updateMatchScore = (match: Match, scores: MatchScore[]) => {
  const latestScore = scores[scores.length - 1];
  return {
    ...match,
    scores,
    team1Score: latestScore?.team1Score || 0,
    team2Score: latestScore?.team2Score || 0,
  };
};

const updateTournamentStage = (tournament: Tournament, stage: TournamentStage) => {
  return {
    ...tournament,
    currentStage: stage,
    updatedAt: new Date(),
  };
};

