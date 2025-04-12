import { Tournament, Match, Team, Court, Division, MatchStatus } from "@/types/tournament";
import { TournamentFormat, TournamentStatus, TournamentStage } from '@/types/tournament-enums';
import { generateId } from "@/utils/tournamentUtils";
import { storageService } from "../storage/StorageService";

export const VALID_STAGE_TRANSITIONS: Record<TournamentStage, TournamentStage[]> = {
  [TournamentStage.REGISTRATION]: [TournamentStage.SEEDING],
  [TournamentStage.SEEDING]: [TournamentStage.GROUP_STAGE, TournamentStage.ELIMINATION_ROUND],
  [TournamentStage.GROUP_STAGE]: [TournamentStage.ELIMINATION_ROUND],
  [TournamentStage.ELIMINATION_ROUND]: [TournamentStage.THIRD_PLACE, TournamentStage.FINALS],
  [TournamentStage.THIRD_PLACE]: [TournamentStage.FINALS],
  [TournamentStage.FINALS]: [TournamentStage.COMPLETED],
  [TournamentStage.COMPLETED]: []
};

export class TournamentService {
  private TOURNAMENTS_KEY = 'tournaments';
  private CURRENT_TOURNAMENT_KEY = 'currentTournament';
  private tournaments: Tournament[] = [];
  private currentTournament: Tournament | null = null;

  // Get all tournaments
  async getTournaments(): Promise<Tournament[]> {
    const tournaments = await storageService.getItem<Tournament[]>(this.TOURNAMENTS_KEY);
    
    // If no tournaments exist and we're in demo mode, initialize demo data
    if (!tournaments || tournaments.length === 0) {
      console.log('[DEBUG] No tournaments found, initializing demo data');
      const demoTournaments = await this.initializeDemoTournaments();
      await this.saveTournaments(demoTournaments);
      return demoTournaments;
    }
    
    return tournaments || [];
  }

  // Initialize demo tournaments
  private async initializeDemoTournaments(): Promise<Tournament[]> {
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    const demoTournaments: Tournament[] = [
      {
        id: generateId(),
        name: "Summer Singles Championship",
        description: "Annual summer singles tournament",
        location: "City Sports Complex",
        format: TournamentFormat.SINGLE_ELIMINATION,
        status: TournamentStatus.PUBLISHED,
        currentStage: TournamentStage.REGISTRATION,
        startDate: new Date(now.getTime() + oneWeek),
        endDate: new Date(now.getTime() + (2 * oneWeek)),
        registrationDeadline: new Date(now.getTime() + (0.5 * oneWeek)),
        registrationEnabled: true,
        requirePlayerProfile: true,
        teams: [],
        matches: [],
        courts: [],
        categories: [],
        scoringSettings: {
          matchFormat: 'STANDARD',
          pointsToWin: 21,
          maxSets: 3,
          mustWinByTwo: true,
          maxPoints: 30,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: 30,
          setsToWin: 2
        },
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        name: "Winter Doubles Tournament",
        description: "Winter season doubles competition",
        location: "Indoor Sports Arena",
        format: TournamentFormat.ROUND_ROBIN,
        status: TournamentStatus.DRAFT,
        currentStage: TournamentStage.REGISTRATION,
        startDate: new Date(now.getTime() + (3 * oneWeek)),
        endDate: new Date(now.getTime() + (4 * oneWeek)),
        registrationDeadline: new Date(now.getTime() + (2.5 * oneWeek)),
        registrationEnabled: true,
        requirePlayerProfile: true,
        teams: [],
        matches: [],
        courts: [],
        categories: [],
        scoringSettings: {
          matchFormat: 'STANDARD',
          pointsToWin: 21,
          maxSets: 3,
          mustWinByTwo: true,
          maxPoints: 30,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: 30,
          setsToWin: 2
        },
        createdAt: now,
        updatedAt: now
      }
    ];

    console.log('[DEBUG] Created demo tournaments:', demoTournaments.length);
    return demoTournaments;
  }

  // Save tournaments
  private async saveTournaments(tournaments: Tournament[]): Promise<void> {
    await storageService.setItem(this.TOURNAMENTS_KEY, tournaments);
  }

  // Get current tournament
  async getCurrentTournament(): Promise<Tournament | null> {
    return await storageService.getItem<Tournament>(this.CURRENT_TOURNAMENT_KEY);
  }

  // Set current tournament
  async setCurrentTournament(tournament: Tournament): Promise<void> {
    await storageService.setItem(this.CURRENT_TOURNAMENT_KEY, tournament);
  }

  // Create a new tournament
  async createTournament(tournament: Tournament): Promise<Tournament> {
    const tournaments = await this.getTournaments();
    const now = new Date();
    const newTournament = {
      ...tournament,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      status: TournamentStatus.DRAFT,
      currentStage: TournamentStage.REGISTRATION,
      teams: [],
      matches: [],
      courts: [],
      categories: []
    };
    tournaments.push(newTournament);
    await this.saveTournaments(tournaments);
    return newTournament;
  }

  // Update an existing tournament
  async updateTournament(tournament: Tournament): Promise<Tournament> {
    const tournaments = await this.getTournaments();
    const index = tournaments.findIndex(t => t.id === tournament.id);
    if (index === -1) {
      throw new Error(`Tournament with id ${tournament.id} not found`);
    }
    const updatedTournament = {
      ...tournament,
      updatedAt: new Date()
    };
    tournaments[index] = updatedTournament;
    await this.saveTournaments(tournaments);
    return updatedTournament;
  }

  // Delete a tournament
  async deleteTournament(tournamentId: string): Promise<void> {
    const tournaments = await this.getTournaments();
    const filteredTournaments = tournaments.filter(t => t.id !== tournamentId);
    await this.saveTournaments(filteredTournaments);
    
    // If this was the current tournament, clear it
    const currentTournament = await this.getCurrentTournament();
    if (currentTournament?.id === tournamentId) {
      await storageService.removeItem(this.CURRENT_TOURNAMENT_KEY);
    }
  }

  // Update tournament stage
  async updateTournamentStage(tournamentId: string, newStage: TournamentStage): Promise<Tournament> {
    const tournaments = await this.getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }

    const validNextStages = VALID_STAGE_TRANSITIONS[tournament.currentStage];
    if (!validNextStages.includes(newStage)) {
      throw new Error(`Invalid stage transition from ${tournament.currentStage} to ${newStage}`);
    }

    const updatedTournament = {
      ...tournament,
      currentStage: newStage,
      updatedAt: new Date()
    };

    if (newStage === TournamentStage.COMPLETED) {
      updatedTournament.status = TournamentStatus.COMPLETED;
    }

    return await this.updateTournament(updatedTournament);
  }

  // Add a team to a tournament
  async addTeam(tournamentId: string, team: Team): Promise<Tournament> {
    const tournaments = await this.getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }

    if (tournament.currentStage !== TournamentStage.REGISTRATION) {
      throw new Error('Teams can only be added during registration stage');
    }

    const updatedTournament = {
      ...tournament,
      teams: [...tournament.teams, { ...team, id: generateId() }],
      updatedAt: new Date()
    };

    return await this.updateTournament(updatedTournament);
  }

  // Add a match to a tournament
  async addMatch(tournamentId: string, match: Omit<Match, 'id' | 'status'>): Promise<Tournament> {
    const tournaments = await this.getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }

    if (tournament.currentStage === TournamentStage.REGISTRATION || 
        tournament.currentStage === TournamentStage.SEEDING) {
      throw new Error('Matches cannot be added during registration or seeding stages');
    }

    const newMatch: Match = {
      ...match,
      id: generateId(),
      status: MatchStatus.SCHEDULED
    };

    const updatedTournament = {
      ...tournament,
      matches: [...tournament.matches, newMatch],
      updatedAt: new Date()
    };

    return await this.updateTournament(updatedTournament);
  }
}

// Create a singleton instance
export const tournamentService = new TournamentService();

