import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// MVP-specific test setup and configuration

// Global test environment setup
beforeAll(() => {
  // Set up MVP-specific environment variables
  process.env.VITE_APP_ENV = 'mvp-test';
  process.env.VITE_ENABLE_ANALYTICS = 'false';
  process.env.VITE_ENABLE_LOGGING = 'false';
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Keep console.error for debugging
  const originalError = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    // Only show errors in CI or when explicitly enabled
    if (process.env.CI || process.env.SHOW_TEST_ERRORS) {
      originalError(...args);
    }
  });
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Global teardown
afterAll(() => {
  vi.restoreAllMocks();
});

// MVP-specific mock configurations
export const mvpMocks = {
  // Mock Appwrite for MVP testing
  appwrite: {
    databases: {
      createDocument: vi.fn(),
      updateDocument: vi.fn(),
      deleteDocument: vi.fn(),
      getDocument: vi.fn(),
      listDocuments: vi.fn()
    },
    account: {
      get: vi.fn(),
      createEmailSession: vi.fn(),
      deleteSession: vi.fn(),
      createAccount: vi.fn()
    },
    storage: {
      createFile: vi.fn(),
      getFileView: vi.fn(),
      deleteFile: vi.fn()
    },
    realtime: {
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }
  },
  
  // Mock localStorage for offline functionality
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  
  // Mock IndexedDB for PWA functionality
  indexedDB: {
    open: vi.fn(),
    deleteDatabase: vi.fn()
  },
  
  // Mock service worker for PWA
  serviceWorker: {
    register: vi.fn(),
    unregister: vi.fn(),
    update: vi.fn()
  },
  
  // Mock geolocation for location-based features
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  },
  
  // Mock notifications for tournament updates
  notification: {
    requestPermission: vi.fn(),
    constructor: vi.fn()
  }
};

// Set up global mocks
Object.defineProperty(window, 'localStorage', {
  value: mvpMocks.localStorage
});

Object.defineProperty(window, 'indexedDB', {
  value: mvpMocks.indexedDB
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: mvpMocks.serviceWorker,
  configurable: true
});

Object.defineProperty(navigator, 'geolocation', {
  value: mvpMocks.geolocation,
  configurable: true
});

Object.defineProperty(window, 'Notification', {
  value: mvpMocks.notification.constructor,
  configurable: true
});

Object.defineProperty(Notification, 'requestPermission', {
  value: mvpMocks.notification.requestPermission,
  configurable: true
});

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver for lazy loading
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock URL.createObjectURL for file handling
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock WebSocket for real-time features
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Custom test utilities for MVP
export const mvpTestUtils = {
  // Wait for async operations to complete
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock tournament data factory
  createMockTournamentData: (overrides = {}) => ({
    id: 'test-tournament',
    name: 'Test Tournament',
    sport: 'badminton',
    format: 'single-elimination',
    status: 'draft',
    teams: [],
    matches: [],
    courts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),
  
  // Mock user data factory
  createMockUserData: (overrides = {}) => ({
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    role: 'player',
    avatar: null,
    preferences: {},
    ...overrides
  }),
  
  // Mock match data factory
  createMockMatchData: (overrides = {}) => ({
    id: 'test-match',
    tournamentId: 'test-tournament',
    team1Id: 'team-1',
    team2Id: 'team-2',
    status: 'scheduled',
    sets: [],
    winnerId: null,
    courtId: null,
    scheduledTime: null,
    startTime: null,
    endTime: null,
    ...overrides
  }),
  
  // Simulate real-time updates
  simulateRealTimeUpdate: (eventType: string, data: any) => {
    const event = new CustomEvent('realtime-update', {
      detail: { type: eventType, data }
    });
    window.dispatchEvent(event);
  },
  
  // Simulate offline/online state changes
  simulateOfflineState: (isOnline: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: isOnline
    });
    
    const event = new Event(isOnline ? 'online' : 'offline');
    window.dispatchEvent(event);
  },
  
  // Mock PWA installation prompt
  simulateInstallPrompt: () => {
    const event = new CustomEvent('beforeinstallprompt', {
      detail: {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }
    });
    window.dispatchEvent(event);
  }
};

// Export for use in tests
export { mvpMocks as mocks, mvpTestUtils as testUtils };
