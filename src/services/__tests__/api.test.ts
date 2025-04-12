import { vi, describe, it, expect, beforeEach } from 'vitest';
import { registrationService } from '../api';
import { supabase } from '@/lib/supabase';
import type { Registration } from '@/types/entities';
import type { RegistrationMetadata } from '@/types/registration';
import { Division } from '@/types/tournament-enums';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation((column, options) => Promise.resolve({ data: null, error: null })),
    })),
  },
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
    // Setup default mock responses
    const mockResponse = { data: mockRegistration, error: null };
    (supabase.from as any)().single.mockImplementation(() => Promise.resolve(mockResponse));
    (supabase.from as any)().order.mockImplementation((column, options) => 
      Promise.resolve({ data: [mockRegistration], error: null })
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
      expect(supabase.from).toHaveBeenCalledWith('registrations');
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
      (supabase.from as any)().single.mockImplementation(() => 
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.register(registrationData)).rejects.toThrow('Registration failed');
    });
  });

  describe('getRegistration', () => {
    it('should get a registration by id', async () => {
      const result = await registrationService.getRegistration('test-id');
      expect(result).toEqual(mockRegistration);
      expect(supabase.from).toHaveBeenCalledWith('registrations');
    });

    it('should throw error if registration not found', async () => {
      const mockError = new Error('Registration not found');
      (supabase.from as any)().single.mockImplementation(() => 
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.getRegistration('invalid-id')).rejects.toThrow('Registration not found');
    });
  });

  describe('listRegistrations', () => {
    it('should list registrations with filters', async () => {
      const filters = {
        tournament_id: 'tournament-id',
        division_id: 'division-id',
        status: 'PENDING',
      };

      const result = await registrationService.listRegistrations(filters);
      expect(result).toEqual([mockRegistration]);
      expect(supabase.from).toHaveBeenCalledWith('registrations');
    });

    it('should throw error if listing fails', async () => {
      const mockError = new Error('Failed to list registrations');
      (supabase.from as any)().order.mockImplementation(() => 
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.listRegistrations({})).rejects.toThrow('Failed to list registrations');
    });
  });

  describe('updateRegistration', () => {
    it('should update a registration', async () => {
      const updateData = {
        status: 'APPROVED',
        notes: 'Approved by admin',
      };

      const updatedRegistration = {
        ...mockRegistration,
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      (supabase.from as any)().single.mockImplementation(() => 
        Promise.resolve({ data: updatedRegistration, error: null })
      );

      const result = await registrationService.updateRegistration('test-id', updateData);
      expect(result).toEqual(updatedRegistration);
      expect(supabase.from).toHaveBeenCalledWith('registrations');
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Update failed');
      (supabase.from as any)().single.mockImplementation(() => 
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.updateRegistration('test-id', { status: 'APPROVED' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('addComment', () => {
    it('should add a comment to a registration', async () => {
      const comment = {
        text: 'Test comment',
        createdBy: 'user-id',
      };

      const updatedRegistration = {
        ...mockRegistration,
        metadata: {
          ...mockRegistration.metadata,
          comments: [{ ...comment, timestamp: expect.any(String) }],
        },
      };

      (supabase.from as any)().single.mockImplementation(() => 
        Promise.resolve({ data: updatedRegistration, error: null })
      );

      const result = await registrationService.addComment('test-id', comment);
      expect(result).toEqual(updatedRegistration);
      expect(supabase.from).toHaveBeenCalledWith('registrations');
    });

    it('should throw error if adding comment fails', async () => {
      const mockError = new Error('Failed to add comment');
      (supabase.from as any)().single.mockImplementation(() => 
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.addComment('test-id', { text: 'Test', createdBy: 'user-id' }))
        .rejects.toThrow('Failed to add comment');
    });
  });

  describe('updatePriority', () => {
    it('should update registration priority', async () => {
      const updatedRegistration = {
        ...mockRegistration,
        priority: 1,
      };

      (supabase.from as any)().update().eq().select().single.mockImplementation(() =>
        Promise.resolve({ data: updatedRegistration, error: null })
      );

      const result = await registrationService.updatePriority('test-id', 1);
      expect(result).toEqual(updatedRegistration);
      expect(supabase.from).toHaveBeenCalledWith('registrations');
    });

    it('should throw error if priority update fails', async () => {
      const mockError = new Error('Failed to update priority');
      (supabase.from as any)().update().eq().select().single.mockImplementation(() =>
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.updatePriority('test-id', 1))
        .rejects.toThrow('Failed to update priority');
    });
  });

  describe('updateNotes', () => {
    it('should update registration notes', async () => {
      const updatedRegistration = {
        ...mockRegistration,
        notes: 'Updated notes',
      };

      (supabase.from as any)().update().eq().select().single.mockImplementation(() =>
        Promise.resolve({ data: updatedRegistration, error: null })
      );

      const result = await registrationService.updateNotes('test-id', 'Updated notes');
      expect(result).toEqual(updatedRegistration);
      expect(supabase.from).toHaveBeenCalledWith('registrations');
    });

    it('should throw error if notes update fails', async () => {
      const mockError = new Error('Failed to update notes');
      (supabase.from as any)().update().eq().select().single.mockImplementation(() =>
        Promise.resolve({ data: null, error: mockError })
      );

      await expect(registrationService.updateNotes('test-id', 'Updated notes'))
        .rejects.toThrow('Failed to update notes');
    });
  });
}); 