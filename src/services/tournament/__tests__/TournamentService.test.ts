import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TournamentService } from '../TournamentService';
import { storageService } from '@/services/storage/StorageService';
import { Tournament } from '@/types/tournament';
import { TournamentFormat, GameType, TournamentStatus, TournamentStage, CourtStatus } from '@/types/tournament-enums';

// Mock the storage service
vi.mock('@/services/storage/StorageService', () => ({
  storageService: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('TournamentService', () => {
  let service: TournamentService;
  const mockTournament: Tournament = {
    id: 'test-id',
    name: 'Test Tournament',
    description: 'Test Description',
    location: 'Test Location',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-02'),
    registrationDeadline: new Date('2023-12-31'),
    maxTeams: 8,
    format: TournamentFormat.SINGLE_ELIMINATION,
    status: TournamentStatus.DRAFT,
    currentStage: TournamentStage.REGISTRATION,
    matches: [],
    teams: [],
    courts: [],
    categories: [],
    registrationEnabled: true,
    requirePlayerProfile: false,
    scoringSettings: {
      matchFormat: 'STANDARD' as const,
      pointsToWin: 21,
      mustWinByTwo: true,
      maxPoints: 30,
      maxSets: 3,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
    },
    categoryRegistrationRules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new TournamentService();
    vi.clearAllMocks();
    // Setup default mock responses
    (storageService.getItem as any).mockResolvedValue(mockTournament);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTournaments', () => {
    it('should return empty array when no tournaments exist', async () => {
      (storageService.getItem as any).mockResolvedValue(null);
      const tournaments = await service.getTournaments();
      expect(tournaments).toEqual([]);
    });

    it('should return tournaments from storage', async () => {
      const mockTournaments = [mockTournament];
      (storageService.getItem as any).mockResolvedValue(mockTournaments);
      const tournaments = await service.getTournaments();
      expect(tournaments).toEqual(mockTournaments);
    });
  });

  describe('getCurrentTournament', () => {
    it('should return current tournament from storage', async () => {
      const tournament = await service.getCurrentTournament();
      expect(tournament).toEqual(mockTournament);
    });

    it('should return null when no current tournament exists', async () => {
      (storageService.getItem as any).mockResolvedValue(null);
      const tournament = await service.getCurrentTournament();
      expect(tournament).toBeNull();
    });
  });

  describe('createTournament', () => {
    const tournamentData = {
      name: 'New Tournament',
      description: 'New Description',
      location: 'New Location',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-02'),
      registrationDeadline: new Date('2023-12-31'),
      maxTeams: 8,
      format: TournamentFormat.SINGLE_ELIMINATION,
      status: TournamentStatus.DRAFT,
      teams: [],
      courts: [],
      categories: [],
      registrationEnabled: true,
      requirePlayerProfile: false,
      scoringSettings: {
        matchFormat: 'STANDARD' as const,
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30,
      },
      categoryRegistrationRules: [],
    };

    it('should create a new tournament and save it', async () => {
      (storageService.getItem as any).mockResolvedValue([]);
      const tournament = await service.createTournament(tournamentData);

      expect(tournament).toMatchObject({
        ...tournamentData,
        matches: [],
        currentStage: TournamentStage.REGISTRATION,
      });
      expect(tournament.id).toBeDefined();
      expect(tournament.createdAt).toBeInstanceOf(Date);
      expect(tournament.updatedAt).toBeInstanceOf(Date);

      expect(storageService.setItem).toHaveBeenCalledTimes(2);
      expect(storageService.setItem).toHaveBeenCalledWith('tournaments', [tournament]);
      expect(storageService.setItem).toHaveBeenCalledWith('currentTournament', tournament);
    });

    it('should add new tournament to existing tournaments', async () => {
      const existingTournaments = [mockTournament];
      (storageService.getItem as any).mockResolvedValue(existingTournaments);

      const tournament = await service.createTournament(tournamentData);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'tournaments',
        [...existingTournaments, tournament]
      );
    });
  });

  describe('createTournamentSync', () => {
    it('should create a tournament synchronously', () => {
      const tournamentData = {
        name: 'Sync Tournament',
        description: 'Sync Description',
        location: 'Sync Location',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        registrationDeadline: new Date('2023-12-31'),
        maxTeams: 8,
        format: TournamentFormat.SINGLE_ELIMINATION,
        status: TournamentStatus.DRAFT,
        teams: [],
        courts: [],
        categories: [],
        registrationEnabled: true,
        requirePlayerProfile: false,
        scoringSettings: {
          matchFormat: 'STANDARD' as const,
          pointsToWin: 21,
          mustWinByTwo: true,
          maxPoints: 30,
          maxSets: 3,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: 30,
        },
        categoryRegistrationRules: [],
      };

      const tournament = service.createTournamentSync(tournamentData);
      expect(tournament).toMatchObject({
        ...tournamentData,
        matches: [],
        currentStage: TournamentStage.REGISTRATION,
      });
      expect(tournament.id).toBeDefined();
      expect(tournament.createdAt).toBeInstanceOf(Date);
      expect(tournament.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateTournament', () => {
    it('should update an existing tournament', async () => {
      const existingTournaments = [mockTournament];
      (storageService.getItem as any)
        .mockResolvedValueOnce(existingTournaments)  // for getTournaments
        .mockResolvedValueOnce(mockTournament);      // for getCurrentTournament

      const updatedData = {
        ...mockTournament,
        name: 'Updated Tournament',
      };

      const updated = await service.updateTournament(updatedData);
      expect(updated.name).toBe('Updated Tournament');
      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(mockTournament.updatedAt.getTime());

      expect(storageService.setItem).toHaveBeenCalledWith(
        'tournaments',
        [updated]
      );
      expect(storageService.setItem).toHaveBeenCalledWith(
        'currentTournament',
        updated
      );
    });

    it('should update current tournament if it matches', async () => {
      const existingTournaments = [mockTournament];
      (storageService.getItem as any)
        .mockResolvedValueOnce(existingTournaments)  // for getTournaments
        .mockResolvedValueOnce(mockTournament);      // for getCurrentTournament

      const updatedData = {
        ...mockTournament,
        name: 'Updated Tournament',
      };

      await service.updateTournament(updatedData);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'currentTournament',
        expect.objectContaining({ name: 'Updated Tournament' })
      );
    });
  });

  describe('deleteTournament', () => {
    it('should delete a tournament', async () => {
      const existingTournaments = [mockTournament];
      (storageService.getItem as any)
        .mockResolvedValueOnce(existingTournaments)  // for getTournaments
        .mockResolvedValueOnce(null);                // for getCurrentTournament

      await service.deleteTournament(mockTournament.id);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'tournaments',
        []
      );
    });

    it('should clear current tournament if deleted', async () => {
      const existingTournaments = [mockTournament];
      (storageService.getItem as any)
        .mockResolvedValueOnce(existingTournaments)  // for getTournaments
        .mockResolvedValueOnce(mockTournament);      // for getCurrentTournament

      await service.deleteTournament(mockTournament.id);
      expect(storageService.removeItem).toHaveBeenCalledWith('currentTournament');
    });
  });

  describe('setCurrentTournament', () => {
    it('should set the current tournament', async () => {
      await service.setCurrentTournament(mockTournament);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'currentTournament',
        mockTournament
      );
    });
  });
}); 