import { vi } from 'vitest';
import { Tournament, TournamentCategory, Team, Player } from '@/types/tournament';
import { TournamentRegistration, TournamentRegistrationStatus } from '@/types/registration';
import { TournamentFormat, CategoryType, Division, TournamentStatus, TournamentStage } from '@/types/tournament-enums';

// Mock data generators
export const createMockTournament = (overrides = {}): Tournament => ({
  id: 'test-tournament-1',
  name: 'Test Tournament',
  description: 'A test tournament',
  format: TournamentFormat.SINGLE_ELIMINATION,
  status: TournamentStatus.DRAFT,
  startDate: new Date('2024-04-01'),
  endDate: new Date('2024-04-02'),
  registrationEnabled: true,
  requirePlayerProfile: false,
  location: 'Test Location',
  categories: [],
  teams: [],
  matches: [],
  courts: [],
  currentStage: TournamentStage.REGISTRATION,
  createdAt: new Date(),
  updatedAt: new Date(),
  scoringSettings: {
    matchFormat: 'STANDARD',
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    maxSets: 3,
    setsToWin: 2,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30
  },
  ...overrides
});

export const createMockCategory = (overrides = {}): TournamentCategory => ({
  id: 'test-category-1',
  name: 'Men\'s Singles',
  type: CategoryType.SINGLES,
  division: Division.ADVANCED,
  format: TournamentFormat.SINGLE_ELIMINATION,
  isCustom: false,
  ...overrides
});

export const createMockPlayer = (overrides = {}): Player => ({
  id: 'test-player-1',
  name: 'Test Player',
  email: 'test@example.com',
  phone: '1234567890',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockTeam = (overrides = {}): Team => ({
  id: 'test-team-1',
  name: 'Test Team',
  players: [createMockPlayer()],
  category: createMockCategory(),
  division: Division.ADVANCED,
  seed: 1,
  initialRanking: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockRegistration = (overrides = {}): TournamentRegistration => ({
  id: 'test-registration-1',
  tournamentId: 'test-tournament-1',
  teamId: 'test-team-1',
  userId: 'test-user-1',
  status: 'PENDING',
  registeredAt: new Date().toISOString(),
  category: createMockCategory(),
  metadata: {
    playerName: 'Test Player',
    teamSize: 1,
    division: 'ADVANCED',
    contactEmail: 'test@example.com',
    contactPhone: '1234567890',
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '0987654321',
      relationship: 'Parent'
    },
    waiverSigned: true,
    paymentStatus: 'PENDING'
  },
  ...overrides
});

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock toast notifications
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

// Mock navigation
export const mockNavigate = vi.fn();

// Mock QR code scanning
export const mockQrScanner = {
  scan: vi.fn(),
  stop: vi.fn()
};

// Helper to wait for async operations
export const waitFor = (callback: () => void | Promise<void>, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const check = async () => {
      try {
        await callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 50);
        }
      }
    };
    check();
  });
}; 