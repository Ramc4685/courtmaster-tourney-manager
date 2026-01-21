
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// Setup global mocks will be done in individual test files

// Global mocks for browser APIs
window.matchMedia = window.matchMedia || function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

// Mock for ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock for IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor(callback: any, options?: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as any;

// Mock for HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock for URL.createObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock for crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Setup and cleanup for each test
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset sessionStorage
  sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});
