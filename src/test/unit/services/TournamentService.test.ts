import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentService } from '../../../services/tournament/TournamentService';
import { createMockTournament, mockAppwrite } from '../../utils';
import { TournamentStatus, TournamentFormat } from '@/types/tournament-enums';

// Mock Appwrite
vi.mock('../../../lib/appwrite', () => mockAppwrite);

describe('TournamentService', () => {
  let tournamentService: TournamentService;

  beforeEach(() => {
    tournamentService = new TournamentService();
    vi.clearAllMocks();
  });

  describe('createTournament', () => {
    it('should create tournament with valid data', async () => {
      const tournamentData = {
        name: 'Test Tournament',
        format: TournamentFormat.SINGLE_ELIMINATION,
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        location: 'Test Location'
      };

      const mockCreatedTournament = createMockTournament(tournamentData);
      mockAppwrite.databases.createDocument.mockResolvedValue(mockCreatedTournament);

      const result = await tournamentService.createTournament(tournamentData);

      expect(mockAppwrite.databases.createDocument).toHaveBeenCalledWith(
        expect.any(String), // database ID
        expect.any(String), // collection ID
        expect.any(String), // document ID
        expect.objectContaining({
          name: 'Test Tournament',
          format: TournamentFormat.SINGLE_ELIMINATION,
          location: 'Test Location'
        })
      );

      expect(result).toEqual(mockCreatedTournament);
    });

    it('should handle Appwrite errors gracefully', async () => {
      const tournamentData = {
        name: 'Test Tournament',
        format: TournamentFormat.SINGLE_ELIMINATION,
        startDate: '2024-01-01'
      };

      mockAppwrite.databases.createDocument.mockRejectedValue(new Error('Database error'));

      await expect(tournamentService.createTournament(tournamentData)).rejects.toThrow('Database error');
    });
  });

  describe('getTournament', () => {
    it('should retrieve tournament by ID', async () => {
      const mockTournament = createMockTournament({ id: 'tournament-1' });
      mockAppwrite.databases.getDocument.mockResolvedValue(mockTournament);

      const result = await tournamentService.getTournament('tournament-1');

      expect(mockAppwrite.databases.getDocument).toHaveBeenCalledWith(
        expect.any(String), // database ID
        expect.any(String), // collection ID
        'tournament-1'
      );

      expect(result).toEqual(mockTournament);
    });

    it('should handle errors when tournament not found', async () => {
      mockAppwrite.databases.getDocument.mockRejectedValue(new Error('Document not found'));

      await expect(tournamentService.getTournament('non-existent')).rejects.toThrow('Document not found');
    });
  });

  describe('getTournaments', () => {
    it('should retrieve list of tournaments', async () => {
      const mockTournaments = [
        createMockTournament({ id: 'tournament-1', name: 'Tournament 1' }),
        createMockTournament({ id: 'tournament-2', name: 'Tournament 2' })
      ];

      mockAppwrite.databases.listDocuments.mockResolvedValue({
        documents: mockTournaments,
        total: 2
      });

      const result = await tournamentService.getTournaments();

      expect(mockAppwrite.databases.listDocuments).toHaveBeenCalledWith(
        expect.any(String), // database ID
        expect.any(String), // collection ID
        expect.any(Array) // queries
      );

      expect(result).toEqual(mockTournaments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      mockAppwrite.databases.listDocuments.mockRejectedValue(new Error('Network error'));

      const result = await tournamentService.getTournaments();

      expect(result).toEqual([]);
    });
  });

  describe('updateTournament', () => {
    it('should update tournament data', async () => {
      const originalTournament = createMockTournament({
        id: 'tournament-1',
        name: 'Original Name'
      });

      const updatedData = {
        id: 'tournament-1',
        name: 'Updated Name',
        description: 'Updated description'
      };

      const updatedTournament = { ...originalTournament, ...updatedData };
      mockAppwrite.databases.updateDocument.mockResolvedValue(updatedTournament);

      const result = await tournamentService.updateTournament(updatedData);

      expect(mockAppwrite.databases.updateDocument).toHaveBeenCalledWith(
        expect.any(String), // database ID
        expect.any(String), // collection ID
        'tournament-1',
        expect.objectContaining({
          name: 'Updated Name',
          description: 'Updated description'
        })
      );

      expect(result).toEqual(updatedTournament);
      expect(result.name).toBe('Updated Name');
    });

    it('should handle update errors', async () => {
      const updateData = {
        id: 'tournament-1',
        name: 'Updated Name'
      };

      mockAppwrite.databases.updateDocument.mockRejectedValue(new Error('Update failed'));

      await expect(tournamentService.updateTournament(updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('data transformation', () => {
    it('should handle snake_case to camelCase conversion', async () => {
      const snakeCaseData = {
        id: 'tournament-1',
        name: 'Test Tournament',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockAppwrite.databases.getDocument.mockResolvedValue(snakeCaseData);

      const result = await tournamentService.getTournament('tournament-1');

      // Should convert snake_case to camelCase
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should convert camelCase to snake_case for API calls', async () => {
      const camelCaseData = {
        name: 'Test Tournament',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        maxTeams: 16
      };

      const mockCreatedTournament = createMockTournament(camelCaseData);
      mockAppwrite.databases.createDocument.mockResolvedValue(mockCreatedTournament);

      await tournamentService.createTournament(camelCaseData);

      expect(mockAppwrite.databases.createDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          name: 'Test Tournament',
          start_date: '2024-01-01',
          end_date: '2024-01-02',
          max_teams: 16
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network failures gracefully', async () => {
      mockAppwrite.databases.createDocument.mockRejectedValue(new Error('Network error'));

      const tournamentData = {
        name: 'Test Tournament',
        format: TournamentFormat.SINGLE_ELIMINATION,
        startDate: '2024-01-01'
      };

      await expect(
        tournamentService.createTournament(tournamentData)
      ).rejects.toThrow('Network error');
    });

    it('should preserve error details from Appwrite', async () => {
      const appwriteError = new Error('Validation failed: name is required');
      appwriteError.name = 'AppwriteException';

      mockAppwrite.databases.createDocument.mockRejectedValue(appwriteError);

      const invalidData = {
        name: '',
        format: TournamentFormat.SINGLE_ELIMINATION
      };

      await expect(
        tournamentService.createTournament(invalidData)
      ).rejects.toThrow('Validation failed: name is required');
    });
  });
});