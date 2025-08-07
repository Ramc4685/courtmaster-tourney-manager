import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registrationService } from '../api';
import type { Registration } from '@/types/entities';
import type { RegistrationMetadata } from '@/types/registration';
import { Division } from '@/types/tournament-enums';

// Mock Appwrite client
vi.mock('@/lib/appwrite', () => ({
  databases: {
    createDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  COLLECTIONS: {
    REGISTRATIONS: 'registrations-collection-id',
  },
  DATABASE_ID: 'test-database-id',
}));

describe('registrationService', () => {
  const mockMetadata: RegistrationMetadata = {
    playerName: 'John Doe',
    teamSize: 1,
    division: Division.ADVANCED,
    contactEmail: 'john@example.com',
    contactPhone: '123-456-7890',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '098-765-4321',
      relationship: 'Spouse'
    },
    waiverSigned: true,
    paymentStatus: 'PENDING'
  };

  const mockRegistration: Registration = {
    id: 'reg-id',
    tournament_id: 'tournament-id',
    division_id: 'division-id',
    player_id: 'player-id',
    partner_id: null,
    status: 'PENDING',
    metadata: mockMetadata,
    notes: '',
    priority: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock responses for Appwrite
    (require('@/lib/appwrite').databases.createDocument as any).mockImplementation(() => 
      Promise.resolve(mockRegistration)
    );
    (require('@/lib/appwrite').databases.listDocuments as any).mockImplementation(() => 
      Promise.resolve({ documents: [mockRegistration] })
    );
    (require('@/lib/appwrite').databases.updateDocument as any).mockImplementation(() => 
      Promise.resolve(mockRegistration)
    );
  });

  describe('register', () => {
    it('should create a new registration', async () => {
      const registrationData = {
        tournament_id: 'tournament-id',
        division_id: 'division-id',
        player_id: 'player-id',
        partner_id: null,
        status: 'PENDING',
        metadata: mockMetadata,
        notes: '',
        priority: 0
      } as const;

      const result = await registrationService.register(registrationData);
      expect(result).toEqual(mockRegistration);
      expect(require('@/lib/appwrite').databases.createDocument).toHaveBeenCalled();
    });

    it('should throw error if registration fails', async () => {
      const registrationData = {
        tournament_id: 'tournament-id',
        division_id: 'division-id',
        player_id: 'player-id',
        partner_id: null,
        status: 'PENDING',
        metadata: mockMetadata,
        notes: '',
        priority: 0
      } as const;

      const mockError = new Error('Registration failed');
      (require('@/lib/appwrite').databases.createDocument as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.register(registrationData)).rejects.toThrow('Registration failed');
    });
  });

  describe('getRegistration', () => {
    it('should get a registration by id', async () => {
      // Mock the Appwrite listDocuments to return a single registration
      (require('@/lib/appwrite').databases.listDocuments as any).mockImplementation(() => 
        Promise.resolve({ documents: [mockRegistration] })
      );
      
      const result = await registrationService.getRegistration('test-id');
      expect(result).toEqual(mockRegistration);
      expect(require('@/lib/appwrite').databases.listDocuments).toHaveBeenCalled();
    });

    it('should throw error if registration not found', async () => {
      const mockError = new Error('Registration not found');
      (require('@/lib/appwrite').databases.listDocuments as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.getRegistration('invalid-id')).rejects.toThrow('Registration not found');
    });
  });

  describe('listRegistrations', () => {
    it('should list all registrations for a tournament', async () => {
      const result = await registrationService.listRegistrations('tournament-id');
      expect(result).toEqual([mockRegistration]);
      expect(require('@/lib/appwrite').databases.listDocuments).toHaveBeenCalled();
    });

    it('should throw error if listing registrations fails', async () => {
      const mockError = new Error('Failed to list registrations');
      (require('@/lib/appwrite').databases.listDocuments as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.listRegistrations('tournament-id')).rejects.toThrow('Failed to list registrations');
    });
  });

  describe('updateRegistration', () => {
    it('should update a registration', async () => {
      const updateData = { status: 'CONFIRMED' };
      const result = await registrationService.updateRegistration('reg-id', updateData);
      expect(result).toEqual(mockRegistration);
      expect(require('@/lib/appwrite').databases.updateDocument).toHaveBeenCalled();
    });

    it('should throw error if updating registration fails', async () => {
      const updateData = { status: 'CONFIRMED' };
      const mockError = new Error('Failed to update registration');
      (require('@/lib/appwrite').databases.updateDocument as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.updateRegistration('reg-id', updateData)).rejects.toThrow('Failed to update registration');
    });
  });

  describe('addComment', () => {
    it('should add a comment to a registration', async () => {
      const comment = 'This is a test comment';
      const result = await registrationService.addComment('reg-id', comment);
      expect(result).toEqual(mockRegistration);
      expect(require('@/lib/appwrite').databases.updateDocument).toHaveBeenCalled();
    });

    it('should throw error if adding comment fails', async () => {
      const comment = 'This is a test comment';
      const mockError = new Error('Failed to add comment');
      (require('@/lib/appwrite').databases.updateDocument as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.addComment('reg-id', comment)).rejects.toThrow('Failed to add comment');
    });
  });

  describe('updatePriority', () => {
    it('should update registration priority', async () => {
      const updatedRegistration = {
        ...mockRegistration,
        priority: 1,
      };

      (require('@/lib/appwrite').databases.updateDocument as any).mockImplementation(() => 
        Promise.resolve(updatedRegistration)
      );

      const result = await registrationService.updatePriority('test-id', 1);
      expect(result).toEqual(updatedRegistration);
      expect(require('@/lib/appwrite').databases.updateDocument).toHaveBeenCalled();
    });

    it('should throw error if priority update fails', async () => {
      const mockError = new Error('Failed to update priority');
      (require('@/lib/appwrite').databases.updateDocument as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.updatePriority('test-id', 1))
        .rejects.toThrow('Failed to update priority');
    });
  });

  describe('updateNotes', () => {
    it('should update registration notes', async () => {
      const newNotes = 'Updated notes';
      const result = await registrationService.updateNotes('reg-id', newNotes);
      expect(result).toEqual(mockRegistration);
      expect(require('@/lib/appwrite').databases.updateDocument).toHaveBeenCalled();
    });

    it('should throw error if updating notes fails', async () => {
      const newNotes = 'Updated notes';
      const mockError = new Error('Failed to update notes');
      (require('@/lib/appwrite').databases.updateDocument as any).mockImplementation(() => 
        Promise.reject(mockError)
      );

      await expect(registrationService.updateNotes('reg-id', newNotes)).rejects.toThrow('Failed to update notes');
    });
  });
}); 