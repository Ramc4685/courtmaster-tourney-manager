import type { StorageService } from './StorageService';
import { generateId } from '@/utils/tournamentUtils';
import type { Tournament, TournamentCategory } from '@/types/tournament';
import type { TournamentRegistration, TournamentRegistrationStatus, RegistrationMetadata } from '@/types/registration';
import type { Profile } from '@/types/entities';
import { TournamentFormat, CategoryType, Division, TournamentStatus, TournamentStage, CourtStatus, MatchStatus } from '@/types/tournament-enums';

interface DemoStorageConfig {
  isDemoMode: boolean;
  demoUser: Profile;
}

export class DemoStorageService implements StorageService {
  private DEMO_KEYS = {
    TOURNAMENTS: 'demo_tournaments',
    REGISTRATIONS: 'demo_registrations',
    CURRENT_TOURNAMENT: 'demo_current_tournament'
  };

  private demoUser: Profile;
  private isDemoMode: boolean;

  constructor(config: DemoStorageConfig) {
    this.demoUser = config.demoUser;
    this.isDemoMode = config.isDemoMode;
    
    if (!this.demoUser) {
      console.error('[DEBUG] DemoStorageService: No demo user provided in config');
      throw new Error('Demo user is required for DemoStorageService');
    }
    
    console.log('[DEBUG] DemoStorageService: Constructor called with user profile:', this.demoUser.email);
    // Clear existing demo data to ensure fresh start
    Object.values(this.DEMO_KEYS).forEach(key => {
      console.log(`[DEBUG] DemoStorageService: Clearing ${key}`);
      localStorage.removeItem(key);
    });
    // Initialize demo data
    console.log('[DEBUG] DemoStorageService: Starting demo data initialization');
    this.initializeDemoData();
    console.log('[DEBUG] DemoStorageService: Demo data initialization complete');
    // Verify data was created
    const tournaments = this.getDemoTournaments();
    console.log('[DEBUG] DemoStorageService: Verified tournaments after initialization:', tournaments);
  }

  private isDoublesCategory(type: CategoryType): boolean {
    return type === CategoryType.DOUBLES || type === CategoryType.MIXED;
  }

  private createSampleTournament(format: TournamentFormat, index: number): Tournament {
    const id = `demo-tournament-${index}`;
    const name = `Demo ${format} Tournament`;
    const description = `A sample tournament using the ${format} format`;
    const now = new Date();

    // Create sample teams
    const teams = [
      {
        id: `team-${id}-1`,
        name: 'Eagles',
        division: Division.ADVANCED,
        players: [
          { id: 'p1', name: 'John Smith', email: 'john@example.com', createdAt: now, updatedAt: now },
          { id: 'p2', name: 'Mike Johnson', email: 'mike@example.com', createdAt: now, updatedAt: now }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: `team-${id}-2`,
        name: 'Hawks',
        division: Division.ADVANCED,
        players: [
          { id: 'p3', name: 'David Lee', email: 'david@example.com', createdAt: now, updatedAt: now },
          { id: 'p4', name: 'Steve Chen', email: 'steve@example.com', createdAt: now, updatedAt: now }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];

    // Create sample courts
    const courts = [
      { id: `court-${id}-1`, name: 'Court 1', number: 1, status: CourtStatus.AVAILABLE, createdAt: now, updatedAt: now },
      { id: `court-${id}-2`, name: 'Court 2', number: 2, status: CourtStatus.AVAILABLE, createdAt: now, updatedAt: now }
    ];

    // Create sample matches
    const matches = [
      {
        id: `match-${id}-1`,
        tournamentId: id,
        stage: TournamentStage.GROUP_STAGE,
        round: 1,
        bracketRound: 1,
        bracketPosition: 1,
        progression: null,
        team1Id: `team-${id}-1`,
        team2Id: `team-${id}-2`,
        team1: teams[0],
        team2: teams[1],
        courtId: `court-${id}-1`,
        status: MatchStatus.SCHEDULED,
        scores: [],
        division: Division.ADVANCED,
        createdAt: now,
        updatedAt: now
      }
    ];

    return {
      id,
      name,
      description,
      format,
      status: TournamentStatus.PUBLISHED,
      currentStage: TournamentStage.REGISTRATION,
      location: "Demo Venue",
      registrationEnabled: true,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      registrationDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      teams,
      matches,
      courts,
      categories: [
        { id: 'cat-1', name: "Advanced Singles", type: CategoryType.SINGLES, division: Division.ADVANCED },
        { id: 'cat-2', name: "Intermediate Singles", type: CategoryType.SINGLES, division: Division.INTERMEDIATE }
      ],
      scoringSettings: {
        matchFormat: 'STANDARD',
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30,
        setsToWin: 2
      },
      requirePlayerProfile: true,
      createdAt: now,
      updatedAt: now
    };
  }

  private mapKeyToDemo(key: string): string {
    if (key === 'tournaments') return this.DEMO_KEYS.TOURNAMENTS;
    if (key === 'registrations') return this.DEMO_KEYS.REGISTRATIONS;
    if (key === 'currentTournament') return this.DEMO_KEYS.CURRENT_TOURNAMENT;
    if (key.startsWith('tournament_')) {
      return this.DEMO_KEYS.TOURNAMENTS;
    }
    return key;
  }

  private getDemoTournaments(): Tournament[] {
    const data = localStorage.getItem(this.DEMO_KEYS.TOURNAMENTS);
    if (!data) return [];
    try {
      const tournaments = JSON.parse(data);
      console.log('[DEBUG] DemoStorageService: Retrieved tournaments from storage:', tournaments);
      return tournaments;
    } catch (error) {
      console.error('[DEBUG] DemoStorageService: Error parsing tournaments:', error);
      return [];
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    console.log(`[DEBUG] DemoStorageService: Getting item with key: ${key}`);
    
    try {
      // For tournaments key, always use demo tournaments
      if (key === 'tournaments') {
        const rawData = localStorage.getItem(this.DEMO_KEYS.TOURNAMENTS);
        console.log('[DEBUG] DemoStorageService: Raw tournaments data:', rawData);
        
        if (!rawData) {
          console.log('[DEBUG] DemoStorageService: No tournaments found in storage');
          return [] as unknown as T;
        }
        
        const tournaments = JSON.parse(rawData);
        console.log('[DEBUG] DemoStorageService: Found tournaments:', tournaments);
        console.log('[DEBUG] DemoStorageService: Number of tournaments:', tournaments.length);
        console.log('[DEBUG] DemoStorageService: Tournament names:', tournaments.map((t: any) => t.name));
        
        return tournaments as unknown as T;
      }

      // For individual tournament lookup
      if (key.startsWith('tournament_')) {
        const id = key.split('_')[1];
        console.log(`[DEBUG] DemoStorageService: Looking for tournament with id: ${id}`);
        
        const rawData = localStorage.getItem(this.DEMO_KEYS.TOURNAMENTS);
        if (!rawData) return null;
        
        const tournaments = JSON.parse(rawData);
        const tournament = tournaments.find((t: any) => t.id === id);
        console.log(`[DEBUG] DemoStorageService: Found tournament:`, tournament);
        
        return tournament as unknown as T;
      }

      // For other keys, use the mapped demo key
      const mappedKey = this.mapKeyToDemo(key);
      console.log(`[DEBUG] DemoStorageService: Using mapped key: ${mappedKey}`);
      
      const rawData = localStorage.getItem(mappedKey);
      if (!rawData) {
        console.log(`[DEBUG] DemoStorageService: No data found for key ${mappedKey}`);
        return null;
      }
      
      const parsed = JSON.parse(rawData);
      console.log(`[DEBUG] DemoStorageService: Retrieved data for ${mappedKey}:`, parsed);
      
      return parsed as T;
    } catch (error) {
      console.error(`[DEBUG] DemoStorageService: Error getting item:`, error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const mappedKey = this.mapKeyToDemo(key);
    console.log(`[DEBUG] DemoStorageService: Setting item with key: ${key} (mapped to: ${mappedKey})`);
    
    if (key === 'tournaments') {
      console.log('[DEBUG] DemoStorageService: Setting all tournaments:', value);
      localStorage.setItem(this.DEMO_KEYS.TOURNAMENTS, JSON.stringify(value));
      return;
    }

    if (key.startsWith('tournament_')) {
      const id = key.split('_')[1];
      const tournaments = this.getDemoTournaments();
      const updatedTournaments = tournaments.map(t => t.id === id ? value : t);
      console.log('[DEBUG] DemoStorageService: Updating tournament in list:', updatedTournaments);
      localStorage.setItem(this.DEMO_KEYS.TOURNAMENTS, JSON.stringify(updatedTournaments));
      return;
    }

    try {
      localStorage.setItem(mappedKey, JSON.stringify(value));
    } catch (error) {
      console.error(`[DEBUG] DemoStorageService: Error setting item in localStorage: ${mappedKey}`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    const mappedKey = this.mapKeyToDemo(key);
    console.log(`[DEBUG] DemoStorageService: Removing item with key: ${key} (mapped to: ${mappedKey})`);
    try {
      localStorage.removeItem(mappedKey);
    } catch (error) {
      console.error(`[DEBUG] DemoStorageService: Error removing item from localStorage: ${mappedKey}`, error);
    }
  }

  private async initializeDemoData() {
    console.log('[DEBUG] DemoStorageService: Initializing demo data');
    // Check if user is admin to determine which demo data to initialize
    const isAdmin = this.demoUser.email === 'demo-admin';
    console.log('[DEBUG] DemoStorageService: User is admin:', isAdmin);

    // Create demo tournaments
    const tournaments = isAdmin ? this.createDemoTournaments() : [];
    await this.setItem(this.DEMO_KEYS.TOURNAMENTS, tournaments);
    console.log('[DEBUG] DemoStorageService: Demo tournaments created:', tournaments.length);

    // Set current tournament if admin
    if (isAdmin && tournaments.length > 0) {
      await this.setItem(this.DEMO_KEYS.CURRENT_TOURNAMENT, tournaments[0]);
      console.log('[DEBUG] DemoStorageService: Current tournament set:', tournaments[0].id);
    }
  }

  private createDemoTournaments(): Tournament[] {
    const formats = [
      TournamentFormat.SINGLE_ELIMINATION,
      TournamentFormat.ROUND_ROBIN,
      TournamentFormat.GROUP_KNOCKOUT
    ];
    
    return formats.map((format, index) => 
      this.createSampleTournament(format, index)
    );
  }
} 