import { 
  Tournament, Match, Team, Court, Division, MatchStatus
} from '@/types/tournament';
import {
  TournamentFormat,
  TournamentStage,
  TournamentStatus,
  GameType,
  PlayType,
  CategoryType
} from '@/types/tournament-enums';
import { generateId } from "@/utils/tournamentUtils";
import { storageService } from "../storage/StorageService";

export const VALID_STAGE_TRANSITIONS: Record<TournamentStage, TournamentStage[]> = {
  [TournamentStage.REGISTRATION]: [TournamentStage.SEEDING],
  [TournamentStage.SEEDING]: [
    TournamentStage.GROUP_STAGE,
    TournamentStage.ELIMINATION_ROUND,
    TournamentStage.INITIAL_ROUND,
    TournamentStage.SWISS_ROUND,
    TournamentStage.DIVISION_PLACEMENT
  ],
  [TournamentStage.GROUP_STAGE]: [
    TournamentStage.ELIMINATION_ROUND,
    TournamentStage.KNOCKOUT_STAGE,
    TournamentStage.PLAYOFF_KNOCKOUT,
    TournamentStage.QUARTERFINALS
  ],
  [TournamentStage.INITIAL_ROUND]: [
    TournamentStage.GROUP_STAGE,
    TournamentStage.KNOCKOUT_STAGE,
    TournamentStage.ELIMINATION_ROUND
  ],
  [TournamentStage.ELIMINATION_ROUND]: [
    TournamentStage.QUARTERFINALS,
    TournamentStage.SEMIFINALS,
    TournamentStage.THIRD_PLACE,
    TournamentStage.FINALS
  ],
  [TournamentStage.KNOCKOUT_STAGE]: [
    TournamentStage.QUARTERFINALS,
    TournamentStage.SEMIFINALS
  ],
  [TournamentStage.QUARTERFINALS]: [TournamentStage.SEMIFINALS],
  [TournamentStage.SEMIFINALS]: [TournamentStage.THIRD_PLACE, TournamentStage.FINALS],
  [TournamentStage.THIRD_PLACE]: [TournamentStage.FINALS],
  [TournamentStage.FINALS]: [TournamentStage.COMPLETED],
  [TournamentStage.COMPLETED]: [],
  [TournamentStage.DIVISION_PLACEMENT]: [
    TournamentStage.GROUP_STAGE,
    TournamentStage.KNOCKOUT_STAGE,
    TournamentStage.ELIMINATION_ROUND
  ],
  [TournamentStage.PLAYOFF_KNOCKOUT]: [
    TournamentStage.QUARTERFINALS,
    TournamentStage.SEMIFINALS
  ],
  [TournamentStage.SWISS_ROUND]: [
    TournamentStage.KNOCKOUT_STAGE,
    TournamentStage.PLAYOFF_KNOCKOUT,
    TournamentStage.FINALS
  ]
};

export class TournamentService {
  private TOURNAMENTS_KEY = 'tournaments';
  private CURRENT_TOURNAMENT_KEY = 'currentTournament';
  private tournaments: Tournament[] = [];
  private currentTournament: Tournament | null = null;

  // Get all tournaments
  async getTournaments(): Promise<Tournament[]> {
    let tournaments = await storageService.getItem<Tournament[]>(this.TOURNAMENTS_KEY);
    if (!tournaments || tournaments.length === 0) {
      // Initialize demo tournaments if none exist
      tournaments = await this.initializeDemoTournaments();
      await this.saveTournaments(tournaments);
      console.log('[DEBUG] Initialized demo tournaments:', tournaments.length);
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
        format: {
          type: TournamentFormat.SINGLE_ELIMINATION,
          stages: [TournamentStage.REGISTRATION, TournamentStage.KNOCKOUT_STAGE],
          scoring: {
            matchFormat: 'STANDARD',
            setsToWin: 2,
            pointsToWinSet: 21,
            tiebreakPoints: 11,
            finalSetTiebreak: true,
            pointsToWin: 21,
            mustWinByTwo: true,
            maxPoints: 30,
            maxSets: 3,
            requireTwoPointLead: true,
            maxTwoPointLeadScore: 30
          },
          divisions: [],
          seedingEnabled: true
        },
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
        format: {
          type: TournamentFormat.ROUND_ROBIN,
          stages: [TournamentStage.REGISTRATION, TournamentStage.GROUP_STAGE],
          scoring: {
            matchFormat: 'STANDARD',
            setsToWin: 2,
            pointsToWinSet: 21,
            tiebreakPoints: 11,
            finalSetTiebreak: true,
            pointsToWin: 21,
            mustWinByTwo: true,
            maxPoints: 30,
            maxSets: 3,
            requireTwoPointLead: true,
            maxTwoPointLeadScore: 30
          },
          divisions: [],
          groupSize: 4,
          advancingTeams: 2
        },
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
      currentStage: TournamentStage.REGISTRATION,
      teams: tournament.teams || [],
      matches: tournament.matches || [],
      courts: tournament.courts || [],
      categories: tournament.categories || []
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
    try {
      // Get current tournaments
      const tournaments = await this.getTournaments();
      
      // Filter out the tournament to delete
      const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
      
      // Save updated tournaments list
      await this.saveTournaments(updatedTournaments);
      
      // Remove the specific tournament from storage
      await storageService.removeItem(`tournament_${tournamentId}`);
      
      // If this was the current tournament, clear it
      const currentTournament = await this.getCurrentTournament();
      if (currentTournament?.id === tournamentId) {
        await storageService.removeItem(this.CURRENT_TOURNAMENT_KEY);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw new Error('Failed to delete tournament');
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

  // Get a single tournament by ID
  async getTournament(id: string): Promise<Tournament | null> {
    try {
      const tournaments = await this.getTournaments();
      const tournament = tournaments.find(t => t.id === id);
      
      if (!tournament) {
        console.error('Tournament not found:', id);
        return null;
      }

      // Save to storage to maintain state
      await storageService.setItem(`tournament_${id}`, tournament);
      
      return tournament;
    } catch (error) {
      console.error('Error getting tournament:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const tournamentService = new TournamentService();

