
import { Tournament, Match, Team, Court, Division, MatchStatus } from "@/types/tournament";
import { generateId } from "@/utils/tournamentUtils";
import { storageService } from "../storage/StorageService";

export class TournamentService {
  private TOURNAMENTS_KEY = 'tournaments';
  private CURRENT_TOURNAMENT_KEY = 'currentTournament';

  // Get all tournaments
  async getTournaments(): Promise<Tournament[]> {
    const tournaments = await storageService.getItem<Tournament[]>(this.TOURNAMENTS_KEY);
    return tournaments || [];
  }

  // Get current tournament
  async getCurrentTournament(): Promise<Tournament | null> {
    return storageService.getItem<Tournament>(this.CURRENT_TOURNAMENT_KEY);
  }

  // Save all tournaments
  async saveTournaments(tournaments: Tournament[]): Promise<void> {
    await storageService.setItem(this.TOURNAMENTS_KEY, tournaments);
  }

  // Save current tournament
  async saveCurrentTournament(tournament: Tournament | null): Promise<void> {
    if (tournament) {
      await storageService.setItem(this.CURRENT_TOURNAMENT_KEY, tournament);
    } else {
      await storageService.removeItem(this.CURRENT_TOURNAMENT_KEY);
    }
  }

  // NEW SYNCHRONOUS METHOD: Create a tournament synchronously
  createTournamentSync(tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">): Tournament {
    // This is a synchronous version that returns the tournament object directly
    return {
      id: generateId(),
      ...tournamentData,
      matches: [],
      currentStage: "INITIAL_ROUND",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Create a new tournament (async version)
  async createTournament(tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">): Promise<Tournament> {
    const newTournament: Tournament = {
      id: generateId(),
      ...tournamentData,
      matches: [],
      currentStage: "INITIAL_ROUND",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tournaments = await this.getTournaments();
    tournaments.push(newTournament);
    
    await this.saveTournaments(tournaments);
    await this.saveCurrentTournament(newTournament);
    
    return newTournament;
  }

  // Delete a tournament
  async deleteTournament(tournamentId: string): Promise<void> {
    const tournaments = await this.getTournaments();
    const currentTournament = await this.getCurrentTournament();
    
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    await this.saveTournaments(updatedTournaments);
    
    if (currentTournament?.id === tournamentId) {
      await this.saveCurrentTournament(null);
    }
  }

  // Update a tournament
  async updateTournament(tournament: Tournament): Promise<Tournament> {
    const updatedTournament = {
      ...tournament,
      updatedAt: new Date()
    };
    
    const tournaments = await this.getTournaments();
    const updatedTournaments = tournaments.map(t => 
      t.id === tournament.id ? updatedTournament : t
    );
    
    await this.saveTournaments(updatedTournaments);
    
    const currentTournament = await this.getCurrentTournament();
    if (currentTournament?.id === tournament.id) {
      await this.saveCurrentTournament(updatedTournament);
    }
    
    return updatedTournament;
  }

  // Set current tournament
  async setCurrentTournament(tournament: Tournament): Promise<void> {
    await this.saveCurrentTournament(tournament);
  }
}

// Create a singleton instance
export const tournamentService = new TournamentService();
