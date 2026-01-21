import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registrationService } from '../api';
import type { PlayerRegistration, TeamRegistration } from '@/types/registration';
import { RegistrationStatus } from '@/types/tournament-enums';
import { databases } from '@/lib/appwrite';

// Mock Appwrite client
vi.mock('@/lib/appwrite', () => ({
  databases: {
    createDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocument: vi.fn(),
  },
  account: {
    getSession: vi.fn(),
    get: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    create: vi.fn(),
    deleteSession: vi.fn(),
  },
  client: {
    subscribe: vi.fn(() => vi.fn())
  },
  COLLECTIONS: {
    REGISTRATIONS: 'registrations-collection-id',
    TOURNAMENTS: 'tournaments-collection-id',
    TEAMS: 'teams-collection-id',
    MATCHES: 'matches-collection-id',
    PROFILES: 'profiles-collection-id',
  },
  APPWRITE_DATABASE_ID: 'test-database-id',
  APPWRITE_ENDPOINT: 'https://test.appwrite.io/v1',
  APPWRITE_PROJECT_ID: 'test-project-id',
}));

describe('registrationService', () => {
  const mockPlayerRegistration: PlayerRegistration = {
    id: 'reg-id',
    tournamentId: 'tournament-id',
    userId: 'user-id',
    categoryId: 'category-id',
    status: RegistrationStatus.PENDING,
    registeredAt: new Date().toISOString(),
    playerName: 'John Doe',
    playerEmail: 'john@example.com',
    waiverAccepted: true,
    paymentStatus: 'pending',
    waitlistPosition: null
  };

  const mockTeamRegistration: TeamRegistration = {
    id: 'team-reg-id',
    tournamentId: 'tournament-id',
    teamId: 'team-id',
    divisionId: 'division-id',
    categoryId: 'category-id',
    status: RegistrationStatus.PENDING,
    registeredAt: new Date().toISOString(),
    teamName: 'Test Team',
    captainId: 'captain-id',
    waiverAccepted: true,
    paymentStatus: 'pending',
    waitlistPosition: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock responses for Appwrite
    vi.mocked(databases.createDocument).mockResolvedValue({ 
      $id: 'reg-id', 
      tournament_id: 'tournament-id', 
      user_id: 'user-id' 
    } as any);
    
    vi.mocked(databases.listDocuments).mockResolvedValue({ 
      documents: [{ 
        $id: 'reg-id', 
        tournament_id: 'tournament-id', 
        user_id: 'user-id', 
        $createdAt: new Date().toISOString() 
      }] 
    } as any);
    
    vi.mocked(databases.updateDocument).mockResolvedValue({ 
      $id: 'reg-id', 
      status: 'APPROVED' 
    } as any);
    
    vi.mocked(databases.getDocument).mockResolvedValue({ 
      $id: 'tournament-id',
      name: 'Test Tournament',
      categories: []
    } as any);
  });

  describe('getPlayerRegistrations', () => {
    it('should get player registrations for a tournament', async () => {
      const result = await registrationService.getPlayerRegistrations('tournament-id');
      expect(result).toBeDefined();
      expect(databases.listDocuments).toHaveBeenCalled();
    });

    it('should throw error if getting player registrations fails', async () => {
      const mockError = new Error('Failed to get player registrations');
      vi.mocked(databases.listDocuments).mockRejectedValue(mockError);

      await expect(registrationService.getPlayerRegistrations('tournament-id')).rejects.toThrow('Failed to get player registrations');
    });
  });

  describe('getTeamRegistrations', () => {
    it('should get team registrations for a tournament', async () => {
      const result = await registrationService.getTeamRegistrations('tournament-id');
      expect(result).toBeDefined();
      expect(databases.listDocuments).toHaveBeenCalled();
    });

    it('should throw error if getting team registrations fails', async () => {
      const mockError = new Error('Failed to get team registrations');
      vi.mocked(databases.listDocuments).mockRejectedValue(mockError);

      await expect(registrationService.getTeamRegistrations('tournament-id')).rejects.toThrow('Failed to get team registrations');
    });
  });

  describe('updatePlayerRegistrationStatus', () => {
    it('should update player registration status', async () => {
      await registrationService.updatePlayerRegistrationStatus('reg-id', RegistrationStatus.APPROVED);
      expect(databases.updateDocument).toHaveBeenCalled();
    });

    it('should throw error if updating player registration status fails', async () => {
      const mockError = new Error('Failed to update status');
      vi.mocked(databases.updateDocument).mockRejectedValue(mockError);

      await expect(registrationService.updatePlayerRegistrationStatus('reg-id', RegistrationStatus.APPROVED))
        .rejects.toThrow('Failed to update status');
    });
  });

  describe('updateTeamRegistrationStatus', () => {
    it('should update team registration status', async () => {
      await registrationService.updateTeamRegistrationStatus('reg-id', RegistrationStatus.APPROVED);
      expect(databases.updateDocument).toHaveBeenCalled();
    });

    it('should throw error if updating team registration status fails', async () => {
      const mockError = new Error('Failed to update status');
      vi.mocked(databases.updateDocument).mockRejectedValue(mockError);

      await expect(registrationService.updateTeamRegistrationStatus('reg-id', RegistrationStatus.APPROVED))
        .rejects.toThrow('Failed to update status');
    });
  });

  describe('createPlayerRegistration', () => {
    it('should create a new player registration', async () => {
      const payload = {
        tournament_id: 'tournament-id',
        user_id: 'user-id',
        category_id: 'category-id'
      };

      // Mock the duplicate check to return no existing registrations
      vi.mocked(databases.listDocuments).mockResolvedValueOnce({ 
        documents: [] // No existing registrations
      } as any);

      const result = await registrationService.createPlayerRegistration(payload);
      expect(result).toBeDefined();
      expect(databases.createDocument).toHaveBeenCalled();
    });

    it('should throw error if creating player registration fails', async () => {
      const payload = {
        tournament_id: 'tournament-id',
        user_id: 'user-id',
        category_id: 'category-id'
      };

      // Mock the duplicate check to return no existing registrations
      vi.mocked(databases.listDocuments).mockResolvedValueOnce({ 
        documents: [] // No existing registrations
      } as any);

      const mockError = new Error('Failed to create registration');
      vi.mocked(databases.createDocument).mockRejectedValue(mockError);

      await expect(registrationService.createPlayerRegistration(payload)).rejects.toThrow('Failed to create registration');
    });
  });
}); 