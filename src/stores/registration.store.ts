import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Registration, RegistrationStatus } from '@/domain/models/registration';
import { RegistrationService, RegisterPlayerDTO, RegisterTeamDTO } from '@/domain/services/registration.service';
import { ValidationError } from '@/domain/services/errors';
import { RegistrationRepository } from '@/infrastructure/repositories/registration.repository';
import { NotificationService } from '@/domain/services/notification.service';
import { supabase } from '@/lib/supabase';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';
import { toast } from 'sonner';

// Initialize services
const repository = new RegistrationRepository(supabase);
const notificationService = new NotificationService();
const registrationService = new RegistrationService(repository, notificationService);

interface RegistrationState {
  registrations: Map<string, Registration>;
  isLoading: boolean;
  error: string | null;
  // Actions
  registerPlayer: (data: RegisterPlayerDTO) => Promise<void>;
  registerTeam: (data: RegisterTeamDTO) => Promise<void>;
  updateStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  updateWaitlistPosition: (id: string, newPosition: number) => Promise<void>;
  addComment: (id: string, comment: { text: string; createdBy: string }) => Promise<void>;
  fetchRegistrations: (tournamentId: string) => Promise<void>;
  clearError: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set, get) => {
  return {
    registrations: new Map(),
    isLoading: false,
    error: null,

    registerPlayer: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const registration = await registrationService.registerPlayer(data);
        set(state => ({
          registrations: new Map(state.registrations).set(registration.id, registration),
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to register player:', error);
        set({
          error: error instanceof ValidationError ? error.message : 'Failed to register player',
          isLoading: false
        });
      }
    },

    registerTeam: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const registration = await registrationService.registerTeam(data);
        set(state => ({
          registrations: new Map(state.registrations).set(registration.id, registration),
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to register team:', error);
        set({
          error: error instanceof ValidationError ? error.message : 'Failed to register team',
          isLoading: false
        });
      }
    },

    updateStatus: async (id, status) => {
      set({ isLoading: true, error: null });
      try {
        const registration = await registrationService.updateStatus(id, status);
        set(state => ({
          registrations: new Map(state.registrations).set(registration.id, registration),
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to update status:', error);
        set({
          error: error instanceof ValidationError ? error.message : 'Failed to update status',
          isLoading: false
        });
      }
    },

    updateWaitlistPosition: async (id, newPosition) => {
      set({ isLoading: true, error: null });
      try {
        const registration = await registrationService.updateWaitlistPosition(id, newPosition);
        set(state => ({
          registrations: new Map(state.registrations).set(registration.id, registration),
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to update waitlist position:', error);
        set({
          error: error instanceof ValidationError ? error.message : 'Failed to update waitlist position',
          isLoading: false
        });
      }
    },

    addComment: async (id, comment) => {
      set({ isLoading: true, error: null });
      try {
        const registration = await registrationService.addComment(id, comment);
        set(state => ({
          registrations: new Map(state.registrations).set(registration.id, registration),
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to add comment:', error);
        set({
          error: error instanceof ValidationError ? error.message : 'Failed to add comment',
          isLoading: false
        });
      }
    },

    fetchRegistrations: async (tournamentId) => {
      set({ isLoading: true, error: null });
      try {
        const registrations = await registrationService.findByTournament(tournamentId);
        set({
          registrations: new Map(registrations.map(r => [r.id, r])),
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to fetch registrations:', error);
        set({
          error: error instanceof ValidationError ? error.message : 'Failed to fetch registrations',
          isLoading: false
        });
      }
    },

    clearError: () => set({ error: null })
  };
});

// Hook for consuming the store
export const useRegistration = () => {
  const store = useRegistrationStore();
  return {
    ...store,
    getRegistration: (id: string) => store.registrations.get(id),
    getRegistrations: () => Array.from(store.registrations.values())
  };
}; 